import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { EditNodeForm } from '../EditNodeForm';
import { getNodeById, updateNode, deleteNode } from '../../nodeService';
import { getUserConnectors } from '@/features/connectors/connectorService';
import { toast } from 'sonner';

// Мокаем react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'common.loading': 'Загрузка...',
        'nodes.form.edit.title': 'Редактирование узла',
        'nodes.form.edit.delete': 'Удалить узел',
        'nodes.form.edit.deleteConfirm': 'Вы уверены? Это действие нельзя отменить.',
        'nodes.form.edit.success': 'Узел обновлен',
        'nodes.form.edit.error': 'Не удалось обновить узел',
        'nodes.form.fields.name': 'Название узла',
        'nodes.form.fields.type': 'Тип узла',
        'nodes.form.fields.targetValue': 'Целевое значение',
        'nodes.form.fields.units.minutes': 'мин',
        'nodes.form.fields.units.units': 'ед.',
        'nodes.form.fields.mass': 'Масса (сложность): 1.0',
        'nodes.form.fields.connectors': 'Коннекторы',
        'nodes.form.fields.color': 'Цвет узла',
        'nodes.form.fields.icon': 'Иконка',
        'nodes.form.fields.description': 'Описание (опционально)',
        'nodes.form.fields.descriptionPlaceholder': 'Краткое описание узла...',
        'nodes.form.fields.isFocusDefault': 'Узел по умолчанию для фокуса',
        'nodes.form.fields.isFocusDefaultDesc': 'Этот узел будет автоматически предлагаться при планировании нового дня.',
        'nodes.type.binary': 'Бинарный',
        'nodes.type.quantity': 'Количество',
        'nodes.type.duration': 'Длительность',
        'nodes.preview.title': 'Предпросмотр',
        'common.cancel': 'Отмена',
        'common.save': 'Сохранить',
        'nodes.form.edit.submitting': 'Сохранение...',
      };
      let result = translations[key] || key;
      if (options) {
        Object.entries(options).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v));
        });
      }
      return result;
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from 'react';

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

const renderComponent = () => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Suspense fallback={<div>Loading icons...</div>}>
          <EditNodeForm nodeId="test-node-1" />
        </Suspense>
      </MemoryRouter>
    </QueryClientProvider>
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

    expect(screen.getByText(/Загрузка/i)).toBeInTheDocument();
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
      expect(screen.queryByText(/Загрузка/i)).not.toBeInTheDocument();
    });

    // Проверяем, что форма заполнилась
    expect(screen.getByDisplayValue('Утренняя пробежка')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Бегать по 30 минут')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument(); // target_value

    // Проверяем тип
    const durationElements = screen.getAllByText(/Длительность/i);
    expect(durationElements.length).toBeGreaterThan(0);
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
      expect(screen.queryByText(/Загрузка/i)).not.toBeInTheDocument();
    });

    // Дополнительно ждем, пока поле заполнится (reset в useEffect может быть асинхронным в плане рендера)
    const nameInput = await screen.findByLabelText(/Название узла/i);
    await waitFor(() => {
      expect((nameInput as HTMLInputElement).value).toBe('Старое имя');
    });

    // Изменяем имя
    fireEvent.change(nameInput, { target: { value: 'Новое имя' } });

    // Сабмит формы
    const submitButton = screen.getByRole('button', { name: /Сохранить/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(updateNode).toHaveBeenCalledWith(
        'test-node-1',
        expect.objectContaining({ name: 'Новое имя' }),
        undefined
      );
      expect(toast.success).toHaveBeenCalledWith('Узел обновлен');
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
      expect(screen.queryByText(/Загрузка/i)).not.toBeInTheDocument();
    });

    // Кликаем по кнопке удаления
    const deleteButton = screen.getByRole('button', { name: /Удалить узел/i });
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(deleteNode).toHaveBeenCalledWith('test-node-1');
      expect(toast.success).toHaveBeenCalledWith('Узел обновлен');
    });

    confirmSpy.mockRestore();
  });
});
