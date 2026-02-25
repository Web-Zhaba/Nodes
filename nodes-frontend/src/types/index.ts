// Node entity types
export interface Node {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: string;
  frequency: string;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

// Connection entity types
export interface Connection {
  id: string;
  from_node_id: string;
  to_node_id: string;
  type: string;
  strength: number;
  created_at: string;
}

// Impulse entity types (выполнение узла)
export interface Impulse {
  id: string;
  node_id: string;
  completed_at: string;
  created_at: string;
}

// Profile entity types
export interface Profile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}
