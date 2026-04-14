-- ============================================================
-- PROCESS_PULSE: Атомарная обработка импульса
-- ============================================================
-- Выполняет ВСЮ логику за 1 вызов внутри PostgreSQL:
-- 1. Сохраняет/удаляет импульс (upsert/delete)
-- 2. Пересчитывает stability_score узла (rolling decay за 30 дней)
-- 3. Обновляет stability_score всех связанных ядер (avg)
-- 4. Возвращает результат как JSONB
--
-- Вызов из Django: SELECT process_pulse(user_id, node_id, value, date)
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_pulse(
    p_user_id UUID,
    p_node_id UUID,
    p_value NUMERIC,
    p_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- Обходит RLS (вызывается из Django Service Role)
AS $$
DECLARE
    v_node_type TEXT;
    v_target_value NUMERIC;
    v_stability NUMERIC := 0.0;
    v_last_date DATE;
    v_days_passed INT;
    v_impact NUMERIC;
    v_completion_ratio NUMERIC;
    v_decay_factor NUMERIC;
    v_impulse_rec RECORD;
    v_is_delete BOOLEAN;
    v_cutoff DATE;
    -- Константы (зеркало services.py)
    C_BASE_BUMP NUMERIC := 20.0;
    C_MAX_OVERDRIVE NUMERIC := 1.5;
    C_DECAY_RATE NUMERIC := 0.05;
    C_MAX_STABILITY NUMERIC := 100.0;
BEGIN
    -- ==============================
    -- 0. Проверяем, что узел принадлежит пользователю
    -- ==============================
    SELECT node_type, target_value
    INTO v_node_type, v_target_value
    FROM public.nodes
    WHERE id = p_node_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Node not found');
    END IF;

    -- ==============================
    -- 1. Сохраняем / удаляем импульс
    -- ==============================
    v_is_delete := (p_value < 0) OR (v_node_type = 'binary' AND p_value = 0);

    IF v_is_delete THEN
        DELETE FROM public.impulses
        WHERE node_id = p_node_id AND completed_at = p_date;
    ELSE
        -- Upsert: пробуем обновить, если не получилось — вставляем
        UPDATE public.impulses
        SET value = p_value
        WHERE node_id = p_node_id AND completed_at = p_date;

        IF NOT FOUND THEN
            INSERT INTO public.impulses (node_id, completed_at, value)
            VALUES (p_node_id, p_date, p_value);
        END IF;
    END IF;

    -- ==============================
    -- 2. Пересчитываем стабильность узла (rolling decay за 30 дней)
    -- ==============================
    v_cutoff := CURRENT_DATE - INTERVAL '30 days';
    v_stability := 0.0;
    v_last_date := NULL;

    FOR v_impulse_rec IN
        SELECT completed_at, value
        FROM public.impulses
        WHERE node_id = p_node_id AND completed_at >= v_cutoff
        ORDER BY completed_at ASC
    LOOP
        IF v_last_date IS NOT NULL THEN
            v_days_passed := v_impulse_rec.completed_at - v_last_date;
            IF v_days_passed > 0 THEN
                v_decay_factor := POWER(1.0 - C_DECAY_RATE, v_days_passed);
                v_stability := v_stability * v_decay_factor;
            END IF;
        END IF;

        -- Рассчитываем силу импульса
        IF v_target_value IS NULL OR v_target_value <= 0 THEN
            v_impact := C_BASE_BUMP;
        ELSE
            -- Если это временной узел, конвертируем цель из минут в секунды
            IF v_node_type = 'duration' THEN
                v_completion_ratio := COALESCE(v_impulse_rec.value, 0) / (v_target_value * 60.0);
            ELSE
                v_completion_ratio := COALESCE(v_impulse_rec.value, 0) / v_target_value;
            END IF;

            IF v_completion_ratio > C_MAX_OVERDRIVE THEN
                v_completion_ratio := C_MAX_OVERDRIVE;
            END IF;
            v_impact := C_BASE_BUMP * v_completion_ratio;
        END IF;

        v_stability := v_stability + v_impact;
        IF v_stability > C_MAX_STABILITY THEN
            v_stability := C_MAX_STABILITY;
        END IF;

        v_last_date := v_impulse_rec.completed_at;
    END LOOP;

    -- Финальное угасание от последнего импульса до сегодня
    IF v_last_date IS NOT NULL THEN
        v_days_passed := CURRENT_DATE - v_last_date;
        IF v_days_passed > 0 THEN
            v_decay_factor := POWER(1.0 - C_DECAY_RATE, v_days_passed);
            v_stability := v_stability * v_decay_factor;
        END IF;
    END IF;

    v_stability := ROUND(v_stability, 2);

    -- ==============================
    -- 3. Сохраняем стабильность узла
    -- ==============================
    UPDATE public.nodes
    SET stability_score = v_stability, updated_at = NOW()
    WHERE id = p_node_id;

    -- ==============================
    -- 4. Пересчитываем стабильность связанных ядер (avg всех связанных узлов)
    -- Путь: node → node_connectors → connector_id → core_connectors → core
    -- ==============================
    UPDATE public.cores c
    SET
        stability_score = sub.avg_score,
        updated_at = NOW()
    FROM (
        SELECT
            cc.core_id,
            COALESCE(AVG(n.stability_score), 0) AS avg_score
        FROM public.core_connectors cc
        JOIN public.node_connectors nc ON nc.connector_id = cc.connector_id
        JOIN public.nodes n ON n.id = nc.node_id AND n.user_id = p_user_id
        WHERE cc.core_id IN (
            -- Только ядра, связанные с ЭТИМ узлом
            SELECT DISTINCT cc2.core_id
            FROM public.node_connectors nc2
            JOIN public.core_connectors cc2 ON cc2.connector_id = nc2.connector_id
            WHERE nc2.node_id = p_node_id
        )
        GROUP BY cc.core_id
    ) sub
    WHERE c.id = sub.core_id;

    -- ==============================
    -- 5. Возвращаем результат
    -- ==============================
    RETURN jsonb_build_object(
        'status', 'success',
        'node_id', p_node_id,
        'new_stability_score', v_stability
    );
END;
$$;
