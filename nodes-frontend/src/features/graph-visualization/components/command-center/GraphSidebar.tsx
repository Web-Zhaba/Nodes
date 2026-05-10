import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { X, Layers, TrendingUp, Share2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { CoreSidebarCard } from "@/features/core-management/components/CoreSidebarCard";
import { motion, AnimatePresence } from "motion/react";

export interface GraphCommandCenterNode {
  id: string;
  name: string;
  node_type: string;
  color?: string;
  icon?: string;
  stability_score: number;
  share_token?: string;
}

export interface GraphCommandCenterCore {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  stability_score: number;
  description?: string;
}

interface GraphSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: GraphCommandCenterNode[];
  cores: GraphCommandCenterCore[];
  coresMap: Record<string, any>;
  nodesMap: Record<string, any>;
  coreConnectors?: Record<string, any>;
  connectors?: Record<string, any>;
  readOnly?: boolean;
  
  selectedNodeId: string | null;
  selectedCoreId: string | null;
  onSelectNode: (id: string | null) => void;
  onSelectCore: (id: string | null) => void;

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
}

export function GraphSidebar({
  isOpen,
  onClose,
  nodes,
  cores,
  coresMap,
  nodesMap,
  coreConnectors = {},
  connectors = {},
  readOnly,
  selectedNodeId,
  selectedCoreId,
  onSelectNode,
  onSelectCore,
  isCreating,
  isEditing,
  onToggleCreating,
  onToggleEditing,
  onNodeNavigate,
  renderNodeCard,
  renderCoreActions,
  renderCreateForm,
  renderEditForm,
  renderExtraContent,
}: GraphSidebarProps) {
  const { t } = useTranslation();

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const selectedCore = selectedCoreId ? coresMap[selectedCoreId] : null;

  return (
    <>
      {/* Sidebar overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-background/10 backdrop-blur-[2px] transition-all duration-500 z-20",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <div
        className={cn(
          "absolute bg-background/95 backdrop-blur-2xl z-30 transition-all duration-500 ease-in-out flex flex-col shadow-2xl overflow-hidden",
          "bottom-0 left-0 w-full h-[85%] rounded-t-[3rem] border-t border-border/40 p-6",
          "md:top-0 md:bottom-0 md:left-auto md:right-0 md:w-[420px] md:h-full md:rounded-none md:border-t-0 md:border-l md:p-8",
          isOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">
              Command Center
            </h3>
            <p className="text-sm font-bold text-primary flex items-center gap-2">
              <Layers className="w-4 h-4" />
              {readOnly ? t("graph.sidebar.neuralInsights", "Neural Insights") : t("graph.sidebar.graphControl", "Graph Control")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-2xl h-10 w-10 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-4 custom-scrollbar">
          {/* Create Form */}
          {isCreating && !readOnly && renderCreateForm && (
            <AnimatePresence mode="wait">
              <motion.div
                key="create-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleCreating?.(false)}
                    className="rounded-xl h-8 w-8"
                  >
                    <Share2 className="w-4 h-4 rotate-180" />
                  </Button>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    {t("graph.sidebar.creating", "Creating")}
                  </span>
                </div>
                {renderCreateForm()}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Overview */}
          {!selectedNodeId && !selectedCoreId && !isCreating && (
            <AnimatePresence mode="wait">
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {!readOnly && onToggleCreating && (
                  <div className="flex items-center justify-end px-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-xl gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                      onClick={() => onToggleCreating(true)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t("graph.sidebar.newNode", "New Node")}
                    </Button>
                  </div>
                )}

                {cores.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">
                      {t("graph.sidebar.cores", "Cores")}
                    </p>
                    {cores.map(core => (
                      <button
                        key={core.id}
                        onClick={() => onSelectCore(core.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border/40 hover:border-primary/30 bg-background hover:bg-primary/5 transition-all text-left"
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${core.color || "#6366f1"}20` }}
                        >
                          <DynamicIcon name={core.icon || "layers"} className="w-4 h-4" style={{ color: core.color || "#6366f1" }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{core.name}</p>
                        </div>
                        <p className="text-xs font-black ml-auto shrink-0" style={{ color: core.color || "#6366f1" }}>
                          {Math.round(core.stability_score)}%
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">
                    {t("graph.sidebar.entities", "Neural Entities")}
                  </p>
                  {nodes.map(node => (
                    <button
                      key={node.id}
                      onClick={() => onSelectNode(node.id)}
                      className="w-full group flex items-center justify-between p-3.5 rounded-2xl bg-background border border-border/40 hover:border-primary/40 transition-all hover:shadow-lg text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${node.color || "#6366f1"}15` }}
                        >
                          <DynamicIcon name={node.icon || "zap"} className="w-4 h-4" style={{ color: node.color }} />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{node.name}</p>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground opacity-60">{node.node_type}</p>
                        </div>
                      </div>
                      <p className="text-xs font-black shrink-0" style={{ color: node.color }}>
                        {Math.round(node.stability_score)}%
                      </p>
                    </button>
                  ))}
                </div>

                {!readOnly && renderExtraContent?.(selectedNodeId, selectedCoreId)}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Selected Core */}
          {selectedCoreId && selectedCore && !isCreating && (
            <AnimatePresence mode="wait">
              <motion.div
                key="core"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (isEditing && onToggleEditing) {
                        onToggleEditing(false);
                      } else {
                        onSelectCore(null);
                      }
                    }}
                    className="rounded-xl h-8 w-8"
                  >
                    <Share2 className="w-4 h-4 rotate-180" />
                  </Button>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    {isEditing ? t("graph.sidebar.coreSettings", "Core Settings") : t("graph.sidebar.coreDetails", "Core Details")}
                  </span>
                </div>

                {isEditing && !readOnly && renderEditForm ? (
                  renderEditForm(selectedCoreId)
                ) : (
                  <>
                    <CoreSidebarCard
                      core={selectedCore}
                      nodes={nodesMap}
                      coreConnectors={coreConnectors}
                      connectors={connectors}
                      isSelected={true}
                      actionButtons={!readOnly ? renderCoreActions?.(selectedCoreId) : undefined}
                    />
                    {selectedCore.description && (
                      <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          {selectedCore.description}
                        </p>
                      </div>
                    )}
                    {!readOnly && renderExtraContent?.(selectedNodeId, selectedCoreId)}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Selected Node */}
          {selectedNodeId && selectedNode && (
            <AnimatePresence mode="wait">
              <motion.div
                key="node"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onSelectNode(null)} className="rounded-xl h-8 w-8">
                    <Share2 className="w-4 h-4 rotate-180" />
                  </Button>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    {t("graph.sidebar.nodeDetails", "Node Details")}
                  </span>
                </div>

                {readOnly ? (
                  <div className="space-y-3">
                    <div
                      className="p-5 rounded-2xl border"
                      style={{ borderColor: `${selectedNode.color}30`, background: `${selectedNode.color}08` }}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${selectedNode.color}, ${selectedNode.color}bb)` }}
                        >
                          <DynamicIcon name={selectedNode.icon || "zap"} className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold">{selectedNode.name}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">{selectedNode.node_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{t("analytics.nodeStats.stability", "Stability")}</span>
                        <span className="font-black text-lg" style={{ color: selectedNode.color }}>
                          {Math.round(selectedNode.stability_score)}%
                        </span>
                      </div>
                    </div>
                    {selectedNode.share_token && onNodeNavigate && (
                      <Button
                        variant="default"
                        className="w-full rounded-2xl h-11 font-bold shadow-xl shadow-primary/20"
                        onClick={() => onNodeNavigate(selectedNode.share_token!)}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {t("graph.sidebar.openAnalytics", "Open Detailed Analytics")}
                      </Button>
                    )}
                  </div>
                ) : (
                  renderNodeCard?.(selectedNodeId)
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </>
  );
}
