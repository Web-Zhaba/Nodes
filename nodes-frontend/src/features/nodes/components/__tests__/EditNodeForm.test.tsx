import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { EditNodeForm } from '../EditNodeForm';
import { getNodeById, updateNode, deleteNode } from '../../nodeService';
import { getUserConnectors } from '@/features/connectors/connectorService';
import { toast } from 'sonner';

// Мокаем зависимости сервисов
vi.mock('../../nodeService', () => ({
  getNodeById: vi.fn(),
  updateNode: vi.fn(),
  deleteNode: vi.fn(),
}));

vi.mock('@/features/connectors/connectorService', () => ({
  getUserConnectors: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <EditNodeForm nodeId="test-node-1" />
    </MemoryRouter>
  );
};

describe('EditNodeForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен отображать лоадер при инициализации', () => {
    // Не резолвим промис сразу, чтобы увидеть состояние загрузки
    (getNodeById as any).mockImplementation(() => new Promise(() => { }));
    (getUserConnectors as any).mockImplementation(() => new Promise(() => { }));

    renderComponent();

    expect(screen.getByText(/загрузка данных узла/i)).toBeInTheDocument();
  });

  it('должен правильно загружать и отображать данные узла', async () => {
    (getNodeById as any).mockResolvedValue({
      id: 'test-node-1',
      name: 'Утренняя пробежка',
      description: 'Бегать по 30 минут',
      node_type: 'duration',
      mass: 5,
      target_value: 30,
      color: '#ff0000',
      icon: 'Activity',
      connector_ids: ['conn-1'],
    });

    (getUserConnectors as any).mockResolvedValue([
      { id: 'conn-1', name: 'Спорт' },
      { id: 'conn-2', name: 'Здоровье' },
    ]);

    renderComponent();

    // Ждем, пока исчезнет состояние загрузки и форма заполнится
    await waitFor(() => {
      expect(screen.queryByText(/загрузка данных узла/i)).not.toBeInTheDocument();
    });

    // Проверяем, что форма заполнилась
    expect(screen.getByDisplayValue('Утренняя пробежка')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Бегать по 30 минут')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument(); // target_value

    // Проверяем тип
    // Используем getAllByText, так как "Время" может встречаться несколько раз (в метке и в описании типа)
    const timeElements = screen.getAllByText(/Время/i);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('должен вызывать updateNode при сабмите формы', async () => {
    (getNodeById as any).mockResolvedValue({
      id: 'test-node-1',
      name: 'Старое имя',
      node_type: 'binary',
      mass: 1,
      connector_ids: ['conn-1'],
    });
    (getUserConnectors as any).mockResolvedValue([{ id: 'conn-1', name: 'Спорт' }]);
    (updateNode as any).mockResolvedValue(true);

    renderComponent();

    // Ждем, пока данные загрузятся
    await waitFor(() => {
      expect(screen.queryByText(/загрузка данных узла/i)).not.toBeInTheDocument();
    });

    // Дополнительно ждем, пока поле заполнится (reset в useEffect может быть асинхронным в плане рендера)
    const nameInput = await screen.findByLabelText(/название узла/i);
    await waitFor(() => {
      expect((nameInput as HTMLInputElement).value).toBe('Старое имя');
    });

    // Изменяем имя
    fireEvent.change(nameInput, { target: { value: 'Новое имя' } });

    // Сабмит формы
    const submitButton = screen.getByRole('button', { name: /сохранить/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(updateNode).toHaveBeenCalledWith('test-node-1', expect.objectContaining({
        name: 'Новое имя',
      }));
      expect(toast.success).toHaveBeenCalledWith('Изменения сохранены');
    });
  });

  it('должен вызывать deleteNode с подтверждением', async () => {
    (getNodeById as any).mockResolvedValue({ id: 'test-node-1', name: 'Test', node_type: 'binary', mass: 1 });
    (getUserConnectors as any).mockResolvedValue([]);
    (deleteNode as any).mockResolvedValue(true);

    // Мокаем window.confirm, чтобы он возвращал true
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText(/загрузка данных узла/i)).not.toBeInTheDocument();
    });

    // Кликаем по кнопке удаления
    const deleteButton = screen.getByRole('button', { name: /удалить узел/i });
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(deleteNode).toHaveBeenCalledWith('test-node-1');
      expect(toast.success).toHaveBeenCalledWith('Узел удален');
    });

    confirmSpy.mockRestore();
  });
});
