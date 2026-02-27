import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('useAppStore', () => {
  // Получаем начальное состояние перед каждым тестом
  const initialState = useAppStore.getState();

  beforeEach(() => {
    useAppStore.setState(initialState, true);
  });

  it('должен иметь правильное начальное состояние', () => {
    const state = useAppStore.getState();
    expect(state.isSidebarOpen).toBe(true);
  });

  it('должен переключать состояние сайдбара toggleSidebar()', () => {
    // 1. Проверяем начальное состояние (true)
    let state = useAppStore.getState();
    expect(state.isSidebarOpen).toBe(true);

    // 2. Переключаем (false)
    state.toggleSidebar();
    state = useAppStore.getState();
    expect(state.isSidebarOpen).toBe(false);

    // 3. Переключаем обратно (true)
    state.toggleSidebar();
    state = useAppStore.getState();
    expect(state.isSidebarOpen).toBe(true);
  });
});
