import { useState } from "react";
import type { GraphData } from "@/entities/graph/model/types";
import { GraphSidebar, type GraphCommandCenterNode, type GraphCommandCenterCore } from "./command-center/GraphSidebar";
import { GraphViewport } from "./command-center/GraphViewport";

interface GraphCommandCenterProps {
  graphData: GraphData;
  nodes: GraphCommandCenterNode[];
  cores: GraphCommandCenterCore[];
  coresMap: Record<string, any>;
  nodesMap: Record<string, any>;
  coreConnectors?: Record<string, any>;
  connectors?: Record<string, any>;
  readOnly?: boolean;
  isCreating?: boolean;
  isEditing?: boolean;
  onToggleCreating?: (val: boolean) => void;
  onToggleEditing?: (val: boolean) => void;
  onNodeNavigate?: (shareToken: string) => void;
  renderNodeCard?: (nodeId: string) => React.ReactNode;
  renderCoreActions?: (coreId: string) => React.ReactNode;
  renderCreateForm?: () => React.ReactNode;
  renderEditForm?: (coreId: string) => React.ReactNode;
  renderExtraContent?: (selectedNodeId: string | null, selectedCoreId: string | null) => React.ReactNode;
  isLoading?: boolean;
}

/**
 * GraphCommandCenter — контейнер, объединяющий визуализацию графа и панель управления (Sidebar).
 * Отвечает за состояние выбора узла/ядра и открытие сайдбара.
 */
export function GraphCommandCenter(props: GraphCommandCenterProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedCoreId, setSelectedCoreId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleGraphClick = (id: string, kind: "node" | "core") => {
    if (kind === "node") {
      setSelectedNodeId(id);
      setSelectedCoreId(null);
    } else {
      setSelectedCoreId(id);
      setSelectedNodeId(null);
    }
    if (props.onToggleCreating) props.onToggleCreating(false);
    if (props.onToggleEditing) props.onToggleEditing(false);
    setIsSidebarOpen(true);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <GraphViewport
        graphData={props.graphData}
        onNodeClick={handleGraphClick}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      <GraphSidebar
        {...props}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedNodeId={selectedNodeId}
        selectedCoreId={selectedCoreId}
        onSelectNode={(id) => {
          setSelectedNodeId(id);
          if (id) setSelectedCoreId(null);
        }}
        onSelectCore={(id) => {
          setSelectedCoreId(id);
          if (id) setSelectedNodeId(null);
        }}
      />
    </div>
  );
}
