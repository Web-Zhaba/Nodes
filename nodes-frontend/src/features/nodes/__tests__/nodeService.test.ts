import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateNode } from '../nodeService';
import { useLocalDatabase } from '@/store/useLocalDatabase';

vi.mock('@/store/useLocalDatabase', () => ({
  useLocalDatabase: {
    getState: vi.fn().mockReturnValue({
      updateNode: vi.fn().mockReturnValue(true),
    }),
  },
}));

describe('nodeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateNode', () => {
    it('должен успешно обновлять узел', async () => {
      const mockUpdateNode = vi.fn().mockReturnValue(true);
      (useLocalDatabase.getState as any).mockReturnValue({
        updateNode: mockUpdateNode,
      });

      const result = await updateNode('node-1', { name: 'New Name' });

      expect(mockUpdateNode).toHaveBeenCalledWith('node-1', { name: 'New Name' });
      expect(result).toBe(true);
    });

    it('должен возвращать false при ошибке обновления', async () => {
      const mockUpdateNode = vi.fn().mockReturnValue(false);
      (useLocalDatabase.getState as any).mockReturnValue({
        updateNode: mockUpdateNode,
      });

      const result = await updateNode('node-1', { name: 'New Name' });

      expect(mockUpdateNode).toHaveBeenCalledWith('node-1', { name: 'New Name' });
      expect(result).toBe(false);
    });
  });
});
