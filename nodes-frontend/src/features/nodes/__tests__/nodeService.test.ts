import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateNode } from '../nodeService';
import { supabase } from '@/lib/supabase';

// Мокаем supabase клиент
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('nodeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateNode', () => {
    it('должен успешно обновлять узел без коннекторов', async () => {
      // Подготавливаем мок для builder-а Supabase
      const updateMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        update: updateMock,
        eq: eqMock,
      });

      const result = await updateNode('node-1', { name: 'New Name' });

      // Проверки вызовов с нужными параметрами
      expect(supabase.from).toHaveBeenCalledWith('nodes');
      expect(updateMock).toHaveBeenCalledWith({ name: 'New Name' });
      expect(eqMock).toHaveBeenCalledWith('id', 'node-1');
      expect(result).toBe(true);
    });

    it('должен успешно обновлять узел вместе с коннекторами', async () => {
      // 1. Моки для обновления базового узла
      const updateMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ error: null });

      // 2. Моки для очистки старых коннекторов
      const deleteMock = vi.fn().mockReturnThis();
      const deleteEqMock = vi.fn().mockResolvedValue({ error: null });

      // 3. Моки для добавления новых коннекторов
      const insertMock = vi.fn().mockResolvedValue({ error: null });

      // Настраиваем поведение from() в зависимости от названия таблицы
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'nodes') {
          return { update: updateMock, eq: eqMock };
        }
        if (table === 'node_connectors') {
          return {
            delete: deleteMock,
            eq: deleteEqMock,
            insert: insertMock
          };
        }
      });

      const result = await updateNode('node-1', {
        name: 'New Node Name',
        connector_ids: ['conn-1', 'conn-2']
      });

      // Проверки обновления "nodes"
      expect(supabase.from).toHaveBeenCalledWith('nodes');
      expect(updateMock).toHaveBeenCalledWith({ name: 'New Node Name' });
      expect(eqMock).toHaveBeenCalledWith('id', 'node-1');

      // Проверки очистки "node_connectors"
      expect(supabase.from).toHaveBeenCalledWith('node_connectors');
      expect(deleteMock).toHaveBeenCalled();
      expect(deleteEqMock).toHaveBeenCalledWith('node_id', 'node-1');

      // Проверки добавления в "node_connectors"
      expect(insertMock).toHaveBeenCalledWith([
        { node_id: 'node-1', connector_id: 'conn-1' },
        { node_id: 'node-1', connector_id: 'conn-2' },
      ]);

      expect(result).toBe(true);
    });

    it('должен возвращать false при ошибке обновления базы', async () => {
      const updateMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockResolvedValue({ error: new Error('DB Error') });

      (supabase.from as any).mockReturnValue({
        update: updateMock,
        eq: eqMock,
      });

      const result = await updateNode('node-1', { name: 'New Name' });

      expect(result).toBe(false);
    });
  });
});
