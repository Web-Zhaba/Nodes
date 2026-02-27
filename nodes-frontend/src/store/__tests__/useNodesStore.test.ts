import { describe, it, expect, beforeEach } from 'vitest';
import { useNodesStore, createDefaultNode, createDefaultCore } from '../useNodesStore';
import type { Node, Core, Connector } from '@/types';

// Моковые данные
const mockNode: Node = {
  id: 'node-1',
  user_id: 'user-1',
  name: 'Утренняя пробежка',
  node_type: 'duration',
  mass: 5,
  target_value: 30,
  stability_score: 50,
  completion_count: 10,
  category: 'default',
  frequency: 'daily',
  color: '#ff0000',
  icon: 'Activity',
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
};

const mockCore: Core = {
  id: 'core-1',
  user_id: 'user-1',
  name: 'Здоровье',
  description: 'Всё, что связано со здоровьем',
  color: '#00ff00',
  icon: 'Heart',
  stability_score: 60,
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
};

const mockConnector: Connector = {
  id: 'conn-1',
  user_id: 'user-1',
  name: 'Спорт',
  color: '#0000ff',
  is_mainline: true,
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
};

describe('useNodesStore', () => {
  const initialState = useNodesStore.getState();

  beforeEach(() => {
    // Сбрасываем состояние перед каждым тестом
    useNodesStore.setState(initialState, true);
  });

  describe('Состояние узлов (Nodes)', () => {
    it('должен инициализироваться с пустым массивом узлов', () => {
      const state = useNodesStore.getState();
      expect(state.nodes).toEqual([]);
    });

    it('должен корректно устанавливать узлы через setNodes', () => {
      useNodesStore.getState().setNodes([mockNode]);
      expect(useNodesStore.getState().nodes).toEqual([mockNode]);
    });

    it('должен добавлять новый узел через addNode', () => {
      useNodesStore.getState().addNode(mockNode);
      expect(useNodesStore.getState().nodes).toContainEqual(mockNode);
      expect(useNodesStore.getState().nodes.length).toBe(1);
    });

    it('должен обновлять существующий узел через updateNode', () => {
      useNodesStore.getState().setNodes([mockNode]);

      const updates = { name: 'Вечерняя пробежка', mass: 10 };
      useNodesStore.getState().updateNode(mockNode.id, updates);

      const updatedNode = useNodesStore.getState().nodes.find(n => n.id === mockNode.id);
      expect(updatedNode?.name).toBe('Вечерняя пробежка');
      expect(updatedNode?.mass).toBe(10);
      // Остальные свойства не должны измениться
      expect(updatedNode?.node_type).toBe('duration');
    });

    it('должен удалять узел через removeNode', () => {
      useNodesStore.getState().setNodes([mockNode]);
      expect(useNodesStore.getState().nodes.length).toBe(1);

      useNodesStore.getState().removeNode(mockNode.id);
      expect(useNodesStore.getState().nodes.length).toBe(0);
    });

    it('должен обновлять стабильность узла через updateNodeStability', () => {
      useNodesStore.getState().setNodes([mockNode]);

      useNodesStore.getState().updateNodeStability(mockNode.id, 99);

      const updatedNode = useNodesStore.getState().nodes.find(n => n.id === mockNode.id);
      expect(updatedNode?.stability_score).toBe(99);
    });
  });

  describe('Сегодняшние значения (Today Values)', () => {
    it('должен инициализироваться с пустым объектом todayValues', () => {
      expect(useNodesStore.getState().todayValues).toEqual({});
    });

    it('должен устанавливать значения через setTodayValues', () => {
      useNodesStore.getState().setTodayValues(mockNode.id, true, 15);

      const todayValues = useNodesStore.getState().todayValues;
      expect(todayValues[mockNode.id]).toEqual({ isCompleted: true, value: 15 });
    });

    it('должен обновлять только количество через updateTodayQuantity', () => {
      useNodesStore.getState().setTodayValues(mockNode.id, false, 0);

      useNodesStore.getState().updateTodayQuantity(mockNode.id, 20);

      const todayValues = useNodesStore.getState().todayValues;
      expect(todayValues[mockNode.id]).toEqual({ isCompleted: false, value: 20 });
    });
  });

  describe('Состояние ядер (Cores)', () => {
    it('должен управлять ядрами (set, add, update, remove)', () => {
      // Add
      useNodesStore.getState().addCore(mockCore);
      expect(useNodesStore.getState().cores).toEqual([mockCore]);

      // Update
      useNodesStore.getState().updateCore(mockCore.id, { name: 'Спорт и здоровье' });
      expect(useNodesStore.getState().cores[0].name).toBe('Спорт и здоровье');

      // Set multiple
      const secondCore = { ...mockCore, id: 'core-2' };
      useNodesStore.getState().setCores([mockCore, secondCore]);
      expect(useNodesStore.getState().cores.length).toBe(2);

      // Remove
      useNodesStore.getState().removeCore(mockCore.id);
      expect(useNodesStore.getState().cores).toEqual([secondCore]);
    });
  });

  describe('Состояние коннекторов (Connectors)', () => {
    it('должен управлять коннекторами (set, add, update, remove)', () => {
      // Add
      useNodesStore.getState().addConnector(mockConnector);
      expect(useNodesStore.getState().connectors).toEqual([mockConnector]);

      // Update
      useNodesStore.getState().updateConnector(mockConnector.id, { color: '#ffffff' });
      expect(useNodesStore.getState().connectors[0].color).toBe('#ffffff');

      // Set multiple
      const secondConn = { ...mockConnector, id: 'conn-2' };
      useNodesStore.getState().setConnectors([mockConnector, secondConn]);
      expect(useNodesStore.getState().connectors.length).toBe(2);

      // Remove
      useNodesStore.getState().removeConnector(mockConnector.id);
      expect(useNodesStore.getState().connectors).toEqual([secondConn]);
    });
  });

  describe('Хелперы', () => {
    it('createDefaultNode должен создавать корректный шаблон узла', () => {
      const node = createDefaultNode('user-123', 'Новая привычка', 'quantity');

      expect(node.user_id).toBe('user-123');
      expect(node.name).toBe('Новая привычка');
      expect(node.node_type).toBe('quantity');
      expect(node.mass).toBe(1.0);
      expect(node.stability_score).toBe(0);
      expect(node.target_value).toBe(10); // Установлен дефолтный таргет

      // Binary узел не должен иметь target_value
      const binaryNode = createDefaultNode('user-123', 'Просто задача', 'binary');
      expect(binaryNode.target_value).toBeUndefined();
    });

    it('createDefaultCore должен создавать корректный шаблон ядра', () => {
      const core = createDefaultCore('user-123', 'Карьера');

      expect(core.user_id).toBe('user-123');
      expect(core.name).toBe('Карьера');
      expect(core.stability_score).toBe(0);
    });
  });
});
