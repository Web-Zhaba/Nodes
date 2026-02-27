import { z } from "zod";

/**
 * Схема валидации для создания узла
 * Mass и target_value уже числа после трансформации
 */
export const createNodeSchema = z.object({
  // Название узла (обязательно)
  name: z
    .string()
    .min(2, "Название должно содержать минимум 2 символа")
    .max(50, "Название не должно превышать 50 символов"),

  // Описание (опционально)
  description: z
    .string()
    .max(500, "Описание не должно превышать 500 символов")
    .optional(),

  // Тип узла (обязательно)
  node_type: z.enum(["binary", "quantity", "duration"]),

  // Масса узла (сложность, 0.5-10.0) - строка для input type="range", трансформируется в число
  mass: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return 1.0;
    return Math.min(Math.max(num, 0.5), 10.0);
  }),

  // Целевое значение (опционально, только для quantity/duration) - строка или число, трансформируется в число
  target_value: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(),

  // Массив ID коннекторов (обязательно хотя бы один)
  connector_ids: z.array(z.string()).min(1, "Выберите хотя бы один коннектор"),

  // Цвет узла (HEX)
  color: z.string().default("#8b5cf6"),

  // Название иконки (Lucide)
  icon: z.string().default("Circle"),
});

/**
 * Тип данных формы (после трансформации)
 */
export type CreateNodeFormData = z.infer<typeof createNodeSchema>;
