import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLocalDatabase } from "@/store/useLocalDatabase";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Edit2, Calendar, CheckCircle2, Circle, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn, getCaretCoordinates } from "@/lib/utils";

interface NodeWorkspaceSheetProps {
  nodeId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

type SaveStatus = "stored" | "editing" | "saving";
type TabMode = "preview" | "editor";
type NodeTabMode = "guidelines" | "daily";

export const NodeWorkspaceSheet: React.FC<NodeWorkspaceSheetProps> = ({
  nodeId,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const translate = t;
  
  const [tabMode, setTabMode] = useState<TabMode>("preview");
  const [nodeTab, setNodeTab] = useState<NodeTabMode>("guidelines");
  const [markdownContent, setMarkdownContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("stored");

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toLocaleDateString("sv"); // 'YYYY-MM-DD'
  });

  // Fetch local DB state & actions
  const nodes = useLocalDatabase((state) => state.nodes);
  const wikiPages = useLocalDatabase((state) => state.wikiPages || {});

  const queryClient = useQueryClient();

  const node = useLocalDatabase((state) =>
    nodeId ? state.nodes.find((n) => n.id === nodeId) : null
  );
  const core = useLocalDatabase((state) =>
    node?.core_id ? state.cores.find((c) => c.id === node.core_id) : null
  );
  const impulses = useLocalDatabase((state) => state.impulses);

  const updateNode = useLocalDatabase((state) => state.updateNode);
  const updateImpulseComment = useLocalDatabase((state) => state.updateImpulseComment);
  const recordImpulse = useLocalDatabase((state) => state.recordImpulse);

  // Wiki links autocomplete states
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [triggerPosition, setTriggerPosition] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Get list of all linkable targets for the wiki-parser
  const existingTargets = useMemo(() => {
    return [
      ...nodes.map((n) => n.name),
      ...Object.keys(wikiPages),
    ];
  }, [nodes, wikiPages]);

  // Selected date impulse
  const dailyImpulse = useMemo(() => {
    if (!nodeId) return null;
    return impulses.find((i) => i.node_id === nodeId && i.completed_at === selectedDate) || null;
  }, [impulses, nodeId, selectedDate]);

  // Sync content when selection or tab changes
  useEffect(() => {
    if (node) {
      if (nodeTab === "guidelines") {
        setMarkdownContent(node.markdown_content || "");
      } else {
        setMarkdownContent(dailyImpulse?.comment || "");
      }
      setSaveStatus("stored");
    }
  }, [nodeId, node, nodeTab, dailyImpulse, selectedDate]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!node) return;

    if (nodeTab === "guidelines") {
      const original = node.markdown_content || "";
      if (markdownContent === original) return;

      setSaveStatus("editing");
      const timer = setTimeout(() => {
        setSaveStatus("saving");
        updateNode(node.id, { markdown_content: markdownContent });
        setSaveStatus("stored");
      }, 600);
      return () => clearTimeout(timer);
    } else {
      const original = dailyImpulse?.comment || "";
      if (markdownContent === original) return;

      setSaveStatus("editing");
      const timer = setTimeout(() => {
        setSaveStatus("saving");
        updateImpulseComment(node.id, selectedDate, markdownContent);
        queryClient.invalidateQueries({ queryKey: ["impulses"] });
        setSaveStatus("stored");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [markdownContent, node, nodeTab, selectedDate, dailyImpulse, updateNode, updateImpulseComment, queryClient]);

  // Quick date selections
  const quickDates = useMemo(() => {
    const list = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("sv");
      const label = i === 0 ? translate("common.days.today", "Сегодня") : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
      list.push({ dateStr, label });
    }
    return list;
  }, [translate]);

  // Toggle habit completion on current date
  const handleToggleDailyCompletion = () => {
    if (!node) return;
    
    // Determine the target value when completing
    let targetVal = 1;
    if (node.node_type === "quantity") {
      targetVal = node.target_value || 10;
    } else if (node.node_type === "duration") {
      targetVal = (node.target_value || 30) * 60;
    }
    
    const value = dailyImpulse && dailyImpulse.value >= targetVal ? 0 : targetVal;
    recordImpulse(node.id, value, selectedDate, false);
    queryClient.invalidateQueries({ queryKey: ["impulses"] });
    queryClient.invalidateQueries({ queryKey: ["nodes"] });
  };

  const isCompleted = useMemo(() => {
    if (!node) return false;
    if (!dailyImpulse) return false;
    if (node.node_type === "binary") {
      return dailyImpulse.value > 0;
    }
    const targetVal = node.node_type === "duration" 
      ? (node.target_value || 30) * 60 
      : (node.target_value || 10);
    return dailyImpulse.value >= targetVal;
  }, [node, dailyImpulse]);

  // Autocomplete helper check
  const triggerAutocompleteCheck = useCallback((text: string, cursorPos: number) => {
    const textBefore = text.substring(0, cursorPos);
    const lastBrackets = textBefore.lastIndexOf("[[");
    if (lastBrackets !== -1) {
      const query = textBefore.substring(lastBrackets + 2);
      if (!query.includes("]]") && !query.includes("\n")) {
        const filtered = existingTargets.filter((target) =>
          target.toLowerCase().includes(query.toLowerCase())
        );
        if (filtered.length > 0) {
          setSuggestions(filtered);
          setTriggerPosition(lastBrackets);
          setShowSuggestions(true);

          if (textareaRef.current) {
            const caretCoords = getCaretCoordinates(textareaRef.current, cursorPos);
            setCoords(caretCoords);
          }
          return;
        }
      }
    }
    setShowSuggestions(false);
  }, [existingTargets]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setMarkdownContent(val);
    triggerAutocompleteCheck(val, cursorPos);
  };

  const handleTextareaSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    triggerAutocompleteCheck(target.value, target.selectionStart);
  };

  const handleTextareaScroll = () => {
    if (showSuggestions && textareaRef.current) {
      const caretCoords = getCaretCoordinates(textareaRef.current, textareaRef.current.selectionStart);
      setCoords(caretCoords);
    }
  };

  const handleTextareaBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 180);
  };

  const selectSuggestion = useCallback((index: number) => {
    if (index < 0 || index >= suggestions.length) return;
    const target = suggestions[index];
    const textBefore = markdownContent.substring(0, triggerPosition);
    const textAfter = markdownContent.substring(textareaRef.current?.selectionStart || 0);
    const newContent = `${textBefore}[[${target}]]${textAfter}`;
    
    setMarkdownContent(newContent);
    setShowSuggestions(false);
    
    const newCursorPos = triggerPosition + target.length + 4;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  }, [suggestions, markdownContent, triggerPosition]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectSuggestion(activeSuggestionIndex);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
      }
    }
  };

  if (!node) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl border-l border-primary/10 bg-background/90 backdrop-blur-xl p-0 flex flex-col h-full shadow-2xl"
      >
        {/* Panel Header */}
        <SheetHeader className="p-6 border-b border-border/20 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <SheetTitle className="text-xl font-bold tracking-tight text-foreground truncate">
                {node.name}
              </SheetTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {core && (
                  <span
                    className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium border"
                    style={{
                      color: core.color,
                      borderColor: `${core.color}30`,
                      backgroundColor: `${core.color}10`,
                    }}
                  >
                    {core.name}
                  </span>
                )}
                <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {node.node_type === "binary" ? translate("node.type.binary", "Бинарный") : 
                   node.node_type === "quantity" ? translate("node.type.quantity", "Количественный") : 
                   translate("node.type.duration", "Таймер")}
                </span>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                  {translate("node.stability", "Стабильность")}: {Math.round(node.stability_score)}%
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Tab Controls & Auto-save Status */}
        <div className="px-6 py-3 border-b border-border/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-muted/20">
          
          {/* Subtabs for Guidelines vs Daily Notes */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-background/55 border border-border/40">
            <button
              type="button"
              onClick={() => {
                setNodeTab("guidelines");
                setSaveStatus("stored");
              }}
              className={cn(
                "px-2.5 py-1 text-[11px] font-bold rounded transition-all",
                nodeTab === "guidelines"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {translate("node.notes.tab.guidelines", "Инструкция")}
            </button>
            <button
              type="button"
              onClick={() => {
                setNodeTab("daily");
                setSaveStatus("stored");
              }}
              className={cn(
                "px-2.5 py-1 text-[11px] font-bold rounded transition-all",
                nodeTab === "daily"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {translate("node.notes.tab.daily", "Дневник")}
            </button>
          </div>

          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background/50 border border-border/40">
              <Button
                type="button"
                variant={tabMode === "preview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTabMode("preview")}
                className="rounded-lg px-3 py-1.5 text-xs font-medium h-7 transition-all"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                {translate("node.notes.preview", "Просмотр")}
              </Button>
              <Button
                type="button"
                variant={tabMode === "editor" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTabMode("editor")}
                className="rounded-lg px-3 py-1.5 text-xs font-medium h-7 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                {translate("node.notes.edit", "Редактор")}
              </Button>
            </div>

            {/* Sync status labels */}
            <div className="text-[10px] font-mono tracking-wider">
              {saveStatus === "stored" && (
                <span className="text-emerald-400 font-semibold">[READY]</span>
              )}
              {saveStatus === "editing" && (
                <span className="text-yellow-400 font-semibold animate-pulse">[EDITING]</span>
              )}
              {saveStatus === "saving" && (
                <span className="text-primary font-semibold animate-pulse">[SAVING]</span>
              )}
            </div>
          </div>
        </div>

        {/* Node Daily Log Action Subheader */}
        {nodeTab === "daily" && (
          <div className="px-6 py-3 border-b border-primary/5 flex flex-col gap-3 bg-primary/5 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSaveStatus("stored");
                  }}
                  className="h-8 text-xs bg-background/60 border-primary/15 rounded-lg w-32"
                />
              </div>

              {/* Completion Toggle */}
              <button
                type="button"
                onClick={handleToggleDailyCompletion}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-all",
                  isCompleted
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-background/40 hover:bg-background/70 border-border/60 text-muted-foreground hover:text-foreground"
                )}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {translate("node.completedToday", "Выполнено")}
                  </>
                ) : (
                  <>
                    <Circle className="w-3.5 h-3.5" />
                    {translate("node.notCompletedToday", "Выполнить")}
                  </>
                )}
              </button>
            </div>

            {/* Quick date buttons */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {quickDates.map((qd) => (
                <button
                  key={qd.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(qd.dateStr);
                    setSaveStatus("stored");
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-semibold border transition-all shrink-0",
                    selectedDate === qd.dateStr
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background/40 hover:bg-background/70 border-border/60 text-muted-foreground"
                  )}
                >
                  {qd.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Note Body */}
        <div className="flex-1 min-h-0 relative">
          {tabMode === "editor" ? (
            <div className="absolute inset-0 p-6">
              <textarea
                ref={textareaRef}
                value={markdownContent}
                onChange={handleTextareaChange}
                onSelect={handleTextareaSelect}
                onKeyDown={handleKeyDown}
                onBlur={handleTextareaBlur}
                onScroll={handleTextareaScroll}
                placeholder={
                  nodeTab === "daily"
                    ? "Напишите отчет за этот день..."
                    : "# Заметки по привычке&#10;&#10;Запишите здесь инструкции, правила, полезные ссылки или чек-листы.&#10;&#10;Вы можете использовать [[Вики-ссылки]] для связывания заметок."
                }
                className="w-full h-full bg-background/30 hover:bg-background/40 focus:bg-background/50 border border-primary/10 focus:border-primary/30 rounded-2xl p-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none resize-none transition-all duration-300 leading-relaxed"
                autoFocus
              />

              {/* Autocomplete Suggestions Popup */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  style={{ 
                    left: `${coords.left + 24}px`, 
                    top: `${coords.top + 24}px`, 
                    transform: "translateY(-100%) translateY(-6px)" 
                  }}
                  className="absolute w-52 max-h-40 overflow-y-auto bg-background/95 border border-primary/20 rounded-lg shadow-xl p-1 z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-1 duration-100"
                >
                  {suggestions.map((target, idx) => {
                    const matchingNode = nodes.find(n => n.name === target);
                    return (
                      <button
                        key={target}
                        type="button"
                        onClick={() => selectSuggestion(idx)}
                        className={cn(
                          "w-full text-left px-2 py-1 rounded transition-all flex items-center justify-between text-[11px] leading-tight",
                          idx === activeSuggestionIndex
                            ? "bg-primary/20 text-foreground font-semibold"
                            : "hover:bg-muted-foreground/5 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {matchingNode ? (
                            <span 
                              className="w-1.5 h-1.5 rounded-full shrink-0" 
                              style={{ backgroundColor: matchingNode.color }} 
                            />
                          ) : (
                            <FileText className="w-2.5 h-2.5 text-muted-foreground/60 shrink-0" />
                          )}
                          <span className="truncate">{target}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6">
                <MarkdownRenderer content={markdownContent} />
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
