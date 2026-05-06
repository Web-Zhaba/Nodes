import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateNode } from '../nodeService';
import { supabase } from '@/lib/supabase';

// Мокаем supabase клиент
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user-id' } } } }),
    },
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
      const eqMock = vi.fn().mockReturnThis();
      // Чтобы await query работал, объект должен быть Thenable
      const thenMock = vi.fn().mockImplementation((onFulfilled) => {
        return Promise.resolve({ error: null }).then(onFulfilled);
      });

      (supabase.from as any).mockReturnValue({
        update: updateMock,
        eq: eqMock,
        then: thenMock,
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
      // Универсальный мок для цепочки вызовов
      const chainMock = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null }),
        then: vi.fn().mockImplementation((onFulfilled) => {
          return Promise.resolve({ error: null }).then(onFulfilled);
        }),
      };

      (supabase.from as any).mockReturnValue(chainMock);

      const result = await updateNode('node-1', {
        name: 'New Node Name',
        connector_ids: ['conn-1', 'conn-2']
      });

      // Проверки обновления "nodes"
      expect(supabase.from).toHaveBeenCalledWith('nodes');
      expect(chainMock.update).toHaveBeenCalledWith({ name: 'New Node Name' });
      expect(chainMock.eq).toHaveBeenCalledWith('id', 'node-1');

      // Проверки очистки "node_connectors"
      expect(supabase.from).toHaveBeenCalledWith('node_connectors');
      expect(chainMock.delete).toHaveBeenCalled();
      expect(chainMock.eq).toHaveBeenCalledWith('node_id', 'node-1');

      // Проверки добавления в "node_connectors"
      expect(chainMock.insert).toHaveBeenCalledWith([
        { node_id: 'node-1', connector_id: 'conn-1' },
        { node_id: 'node-1', connector_id: 'conn-2' },
      ]);

      expect(result).toBe(true);
    });

    it('должен возвращать false при ошибке обновления базы', async () => {
      const updateMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const thenMock = vi.fn().mockImplementation((onFulfilled) => {
        return Promise.resolve({ error: new Error('DB Error') }).then(onFulfilled);
      });

      (supabase.from as any).mockReturnValue({
        update: updateMock,
        eq: eqMock,
        then: thenMock,
      });

      const result = await updateNode('node-1', { name: 'New Name' });

      expect(result).toBe(false);
    });
  });
});
