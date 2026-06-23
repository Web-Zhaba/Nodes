import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocalDatabase } from "@/store/useLocalDatabase";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Eye, 
  Edit2, 
  Search, 
  Settings, 
  BookOpen, 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Circle,
  ArrowLeft
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { cn, getCaretCoordinates } from "@/lib/utils";

type SaveStatus = "stored" | "editing" | "saving";
type TabMode = "preview" | "editor";
type ListFilter = "all" | "has_notes";
type SelectionType = "node" | "wiki";
type NodeTabMode = "guidelines" | "daily";

export default function NotesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Zustand state
  const nodes = useLocalDatabase((state) => state.nodes);
  const cores = useLocalDatabase((state) => state.cores);
  const impulses = useLocalDatabase((state) => state.impulses);
  const wikiPages = useLocalDatabase((state) => state.wikiPages || {});
  
  const updateNode = useLocalDatabase((state) => state.updateNode);
  const updateWikiPage = useLocalDatabase((state) => state.updateWikiPage);
  const deleteWikiPage = useLocalDatabase((state) => state.deleteWikiPage);
  const updateImpulseComment = useLocalDatabase((state) => state.updateImpulseComment);
  const recordImpulse = useLocalDatabase((state) => state.recordImpulse);

  // Selection states
  const [selectedType, setSelectedType] = useState<SelectionType>("wiki");
  const [selectedId, setSelectedId] = useState<string | null>("Главная");
  const [activeTab, setActiveTab] = useState<"list" | "editor">("list");
  
  // Workspace UI states
  const [tabMode, setTabMode] = useState<TabMode>("preview");
  const [nodeTab, setNodeTab] = useState<NodeTabMode>("guidelines");
  const [searchQuery, setSearchQuery] = useState("");
  const [listFilter, setListFilter] = useState<ListFilter>("has_notes");
  
  // Custom wiki creation states
  const [newWikiTitle, setNewWikiTitle] = useState("");
  const [isCreatingWiki, setIsCreatingWiki] = useState(false);

  // Content editing state
  const [markdownContent, setMarkdownContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("stored");

  // Wiki links autocomplete states
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [triggerPosition, setTriggerPosition] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Daily note selection state (default to today)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toLocaleDateString("sv"); // 'YYYY-MM-DD'
  });

  // Calculate quick date select buttons (last 5 days)
  const quickDates = useMemo(() => {
    const list = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("sv");
      const label = i === 0 ? t("common.days.today", "Сегодня") : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
      list.push({ dateStr, label });
    }
    return list;
  }, [t]);

  // Selected item hooks
  const selectedNode = useMemo(() => {
    if (selectedType !== "node") return null;
    return nodes.find((n) => n.id === selectedId) || null;
  }, [nodes, selectedType, selectedId]);

  const selectedCore = useMemo(() => {
    if (!selectedNode?.core_id) return null;
    return cores.find((c) => c.id === selectedNode.core_id) || null;
  }, [cores, selectedNode]);

  // Daily impulse for the selected node and date
  const dailyImpulse = useMemo(() => {
    if (selectedType !== "node" || !selectedId) return null;
    return impulses.find((i) => i.node_id === selectedId && i.completed_at === selectedDate) || null;
  }, [impulses, selectedType, selectedId, selectedDate]);

  // Completion status check helper
  const isCompleted = useMemo(() => {
    if (selectedType !== "node" || !selectedNode) return false;
    if (!dailyImpulse) return false;
    if (selectedNode.node_type === "binary") {
      return dailyImpulse.value > 0;
    }
    const targetVal = selectedNode.node_type === "duration" 
      ? (selectedNode.target_value || 30) * 60 
      : (selectedNode.target_value || 10);
    return dailyImpulse.value >= targetVal;
  }, [selectedType, selectedNode, dailyImpulse]);

  // Load content when selection changes
  useEffect(() => {
    if (selectedType === "wiki") {
      setMarkdownContent(wikiPages[selectedId || ""] || "");
      setSaveStatus("stored");
    } else if (selectedType === "node" && selectedNode) {
      if (nodeTab === "guidelines") {
        setMarkdownContent(selectedNode.markdown_content || "");
      } else {
        setMarkdownContent(dailyImpulse?.comment || "");
      }
      setSaveStatus("stored");
    } else {
      setMarkdownContent("");
    }
  }, [selectedType, selectedId, selectedNode, nodeTab, dailyImpulse, selectedDate, wikiPages]);

  // Debounced auto-save effect
  useEffect(() => {
    if (selectedType === "wiki" && selectedId) {
      const original = wikiPages[selectedId] || "";
      if (markdownContent === original) return;

      setSaveStatus("editing");
      const timer = setTimeout(() => {
        setSaveStatus("saving");
        updateWikiPage(selectedId, markdownContent);
        setSaveStatus("stored");
      }, 600);
      return () => clearTimeout(timer);
    } 
    
    if (selectedType === "node" && selectedNode) {
      if (nodeTab === "guidelines") {
        const original = selectedNode.markdown_content || "";
        if (markdownContent === original) return;

        setSaveStatus("editing");
        const timer = setTimeout(() => {
          setSaveStatus("saving");
          updateNode(selectedNode.id, { markdown_content: markdownContent });
          setSaveStatus("stored");
        }, 600);
        return () => clearTimeout(timer);
      } else {
        const original = dailyImpulse?.comment || "";
        if (markdownContent === original) return;

        setSaveStatus("editing");
        const timer = setTimeout(() => {
          setSaveStatus("saving");
          updateImpulseComment(selectedNode.id, selectedDate, markdownContent);
          queryClient.invalidateQueries({ queryKey: ["impulses"] });
          setSaveStatus("stored");
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [
    markdownContent, 
    selectedType, 
    selectedId, 
    selectedNode, 
    nodeTab, 
    selectedDate, 
    dailyImpulse, 
    wikiPages, 
    updateWikiPage, 
    updateNode, 
    updateImpulseComment,
    queryClient
  ]);

  // Get list of all linkable targets for the wiki-parser
  const existingTargets = useMemo(() => {
    return [
      ...nodes.map((n) => n.name),
      ...Object.keys(wikiPages),
    ];
  }, [nodes, wikiPages]);

  // Wiki Link Navigation click handler
  const handleWikiLinkClick = useCallback((target: string) => {
    // 1. Check if it's a Node
    const nodeMatch = nodes.find(n => n.name.toLowerCase() === target.toLowerCase());
    if (nodeMatch) {
      setSelectedType("node");
      setSelectedId(nodeMatch.id);
      setNodeTab("guidelines");
      setActiveTab("editor");
      return;
    }

    // 2. Check if it's an existing Wiki page
    const pageKeys = Object.keys(wikiPages);
    const pageMatch = pageKeys.find(p => p.toLowerCase() === target.toLowerCase());
    if (pageMatch) {
      setSelectedType("wiki");
      setSelectedId(pageMatch);
      setActiveTab("editor");
      return;
    }

    // 3. Create it as a new Wiki page (Obsidian style)
    updateWikiPage(target, `# ${target}\n\nНачните писать здесь...`);
    setSelectedType("wiki");
    setSelectedId(target);
    setActiveTab("editor");
  }, [nodes, wikiPages, updateWikiPage]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (node.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (listFilter === "has_notes") {
        return !!node.markdown_content && node.markdown_content.trim() !== "";
      }
      return true;
    });
  }, [nodes, searchQuery, listFilter]);

  // Filtered custom wiki pages
  const filteredWikiPages = useMemo(() => {
    return Object.keys(wikiPages).filter(title => 
      title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [wikiPages, searchQuery]);

  // Create new wiki page action
  const handleCreateWikiPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWikiTitle.trim()) return;
    
    const title = newWikiTitle.trim();
    if (!wikiPages[title]) {
      updateWikiPage(title, `# ${title}\n\nНачните писать здесь...`);
    }
    
    setSelectedType("wiki");
    setSelectedId(title);
    setNewWikiTitle("");
    setIsCreatingWiki(false);
  };

  // Toggle habit completion on current date
  const handleToggleDailyCompletion = () => {
    if (!selectedNode) return;
    
    // Determine the target value when completing
    let targetVal = 1;
    if (selectedNode.node_type === "quantity") {
      targetVal = selectedNode.target_value || 10;
    } else if (selectedNode.node_type === "duration") {
      targetVal = (selectedNode.target_value || 30) * 60;
    }
    
    const value = dailyImpulse && dailyImpulse.value >= targetVal ? 0 : targetVal;
    recordImpulse(selectedNode.id, value, selectedDate, false);
    queryClient.invalidateQueries({ queryKey: ["impulses"] });
    queryClient.invalidateQueries({ queryKey: ["nodes"] });
  };

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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pt-4 pb-20 md:pb-12 h-[calc(100vh-5rem)] flex flex-col gap-6 relative">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[250px] opacity-20 mix-blend-screen"
          style={{
            background: "radial-gradient(ellipse at center, var(--primary) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
            {t("nav.notes", "Заметки и База Знаний")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/50">
            {t("wiki.title", "База знаний")}
          </h1>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1 opacity-80 text-primary">
            <BookOpen className="w-3.5 h-3.5" />
            {t("wiki.subtitle", "Карты и инструкции узлов действия")}
          </p>
        </div>
      </header>

      {/* Obsidian-Style split viewport */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 border border-primary/10 rounded-[2rem] bg-background/40 backdrop-blur-xl overflow-hidden shadow-2xl">
        
        {/* Left Side: Note browser list (4 cols) */}
        <div className={cn(
          "col-span-1 md:col-span-4 border-b md:border-b-0 md:border-r border-primary/10 flex flex-col min-h-0 bg-background/20",
          activeTab === "list" ? "flex" : "hidden md:flex"
        )}>
          
          {/* Search box */}
          <div className="p-4 border-b border-primary/10 space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("wiki.search", "Поиск узла или страницы...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 border-primary/10 focus-visible:ring-primary/20 h-9 rounded-xl text-sm"
              />
            </div>

            {/* List filters for Nodes */}
            <div className="flex p-0.5 rounded-lg bg-background/35 border border-border/40 gap-0.5">
              <button
                type="button"
                onClick={() => setListFilter("has_notes")}
                className={cn(
                  "flex-1 text-center py-1 rounded-md text-xs font-semibold transition-all",
                  listFilter === "has_notes"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("wiki.filter.hasNotes", "С заметками")}
              </button>
              <button
                type="button"
                onClick={() => setListFilter("all")}
                className={cn(
                  "flex-1 text-center py-1 rounded-md text-xs font-semibold transition-all",
                  listFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("wiki.filter.all", "Все узлы")}
              </button>
            </div>
          </div>

          {/* Combined Scrollable List */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-6">
              
              {/* SECTION 1: WIKI PAGES */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>{t("wiki.section.wiki", "Свободные страницы")}</span>
                  <button 
                    type="button"
                    onClick={() => setIsCreatingWiki(!isCreatingWiki)}
                    className="hover:text-primary transition-colors p-0.5"
                    title={t("wiki.addPage", "Добавить страницу")}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {isCreatingWiki && (
                  <form onSubmit={handleCreateWikiPage} className="flex gap-2 px-2 py-1 shrink-0">
                    <Input
                      type="text"
                      placeholder={t("wiki.newPagePlaceholder", "Название страницы...")}
                      value={newWikiTitle}
                      onChange={(e) => setNewWikiTitle(e.target.value)}
                      className="h-8 text-xs bg-background/50 rounded-lg"
                      autoFocus
                    />
                    <Button type="submit" size="sm" className="h-8 rounded-lg text-xs px-3">
                      {t("common.create", "Создать")}
                    </Button>
                  </form>
                )}

                <div className="space-y-1">
                  {filteredWikiPages.map((title) => (
                    <div 
                      key={title}
                      className={cn(
                        "w-full rounded-xl flex items-center justify-between px-3 py-2 border transition-all duration-200 group text-sm font-semibold",
                        selectedType === "wiki" && selectedId === title
                          ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted-foreground/5"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedType("wiki");
                          setSelectedId(title);
                          setActiveTab("editor");
                        }}
                        className="flex-1 text-left truncate flex items-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{title}</span>
                      </button>
                      
                      {title !== "Главная" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWikiPage(title);
                            if (selectedId === title) {
                              setSelectedType("wiki");
                              setSelectedId("Главная");
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-1"
                          title={t("common.delete", "Удалить страницу")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: NODES GUIDELINES */}
              <div className="space-y-2">
                <div className="px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("wiki.section.nodes", "Заметки по привычкам")}
                </div>
                <div className="space-y-1">
                  {filteredNodes.map((node) => {
                    const nodeCore = node.core_id ? cores.find((c) => c.id === node.core_id) : null;
                    const wordCount = node.markdown_content?.trim() 
                      ? node.markdown_content.trim().split(/\s+/).length 
                      : 0;

                    return (
                      <button
                        key={node.id}
                        onClick={() => {
                          setSelectedType("node");
                          setSelectedId(node.id);
                          setActiveTab("editor");
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 border transition-all duration-200 group",
                          selectedType === "node" && selectedId === node.id
                            ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted-foreground/5"
                        )}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: node.color }}
                            />
                            <p className={cn(
                              "font-semibold text-sm truncate leading-none transition-colors",
                              selectedType === "node" && selectedId === node.id ? "text-primary" : "text-foreground"
                            )}>
                              {node.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] opacity-80 pl-4.5">
                            {nodeCore && (
                              <span style={{ color: nodeCore.color }}>
                                {nodeCore.name}
                              </span>
                            )}
                            {wordCount > 0 && (
                              <span className="text-muted-foreground">
                                {wordCount} {t("wiki.words", "слов")}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-muted/40 px-1.5 py-0.5 rounded-md text-foreground">
                          {Math.round(node.stability_score)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </ScrollArea>
        </div>

        {/* Right Side: Notes Editor Workspace (8 cols) */}
        <div className={cn(
          "col-span-1 md:col-span-8 flex flex-col min-h-0 bg-background/5",
          activeTab === "editor" ? "flex" : "hidden md:flex"
        )}>
          {selectedId ? (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Workspace Header */}
              <div className="px-6 py-4 border-b border-primary/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 bg-muted/10">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setActiveTab("list")}
                      className="md:hidden h-8 w-8 -ml-2 text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    {selectedType === "node" && selectedNode ? (
                      <>
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: selectedNode.color }}
                        />
                        <h2 className="text-lg font-bold text-foreground truncate">
                          {selectedNode.name}
                        </h2>
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5 text-primary opacity-80 shrink-0" />
                        <h2 className="text-lg font-bold text-foreground truncate">
                          {selectedId}
                        </h2>
                      </>
                    )}
                  </div>
                  
                  {/* Meta details */}
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    {selectedType === "node" && selectedNode && (
                      <>
                        {selectedCore && (
                          <span
                            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium border"
                            style={{
                              color: selectedCore.color,
                              borderColor: `${selectedCore.color}30`,
                              backgroundColor: `${selectedCore.color}10`,
                            }}
                          >
                            {selectedCore.name}
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {selectedNode.node_type === "binary" ? t("node.type.binary", "Бинарный") : 
                           selectedNode.node_type === "quantity" ? t("node.type.quantity", "Количественный") : 
                           t("node.type.duration", "Таймер")}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          {t("node.stability", "Стабильность")}: {Math.round(selectedNode.stability_score)}%
                        </span>
                      </>
                    )}
                    {selectedType === "wiki" && (
                      <span className="inline-flex items-center rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {t("wiki.type.free", "Свободная страница")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  {/* Node Specific Sub-Tabs (Guidelines vs Daily Log) */}
                  {selectedType === "node" && (
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
                        {t("node.notes.tab.guidelines", "Инструкция")}
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
                        {t("node.notes.tab.daily", "Дневник дня")}
                      </button>
                    </div>
                  )}

                  {/* Mode Toggles */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background/50 border border-border/40">
                    <Button
                      type="button"
                      variant={tabMode === "preview" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setTabMode("preview")}
                      className="rounded-lg px-3 py-1 text-xs font-semibold h-7"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      {t("node.notes.preview", "Просмотр")}
                    </Button>
                    <Button
                      type="button"
                      variant={tabMode === "editor" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setTabMode("editor")}
                      className="rounded-lg px-3 py-1 text-xs font-semibold h-7"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      {t("node.notes.edit", "Редактор")}
                    </Button>
                  </div>

                  {selectedType === "node" && selectedNode && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-white/10 rounded-lg hover:text-primary"
                      onClick={() => navigate(`/nodes/edit/${selectedNode.id}`)}
                      title={t("node.edit", "Редактировать параметры узла")}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Node Daily Log Action Subheader */}
              {selectedType === "node" && nodeTab === "daily" && selectedNode && (
                <div className="px-6 py-3 border-b border-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary/5 shrink-0">
                  
                  {/* Date Input */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSaveStatus("stored");
                      }}
                      className="h-8 text-xs bg-background/60 border-primary/15 rounded-lg w-36"
                    />
                    
                    {/* Quick date buttons */}
                    <div className="hidden lg:flex gap-1.5">
                      {quickDates.map((qd) => (
                        <button
                          key={qd.dateStr}
                          type="button"
                          onClick={() => {
                            setSelectedDate(qd.dateStr);
                            setSaveStatus("stored");
                          }}
                          className={cn(
                            "px-2 py-1 rounded text-[10px] font-semibold border transition-all",
                            selectedDate === qd.dateStr
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background/40 hover:bg-background/70 border-border/60 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {qd.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Completion Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleDailyCompletion}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all self-start md:self-auto",
                      isCompleted
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-background/40 hover:bg-background/70 border-border/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {t("node.completedToday", "Выполнено")}
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        {t("node.notCompletedToday", "Отметить выполнение")}
                      </>
                    )}
                  </button>

                </div>
              )}

              {/* Status & Character count */}
              <div className="px-6 py-2 border-b border-primary/5 flex items-center justify-between text-[10px] font-mono tracking-wider bg-muted/5 shrink-0">
                <div className="text-muted-foreground">
                  {markdownContent.length} {t("wiki.chars", "символов")}
                </div>
                <div>
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

              {/* Note Content Area */}
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
                        selectedType === "node" && nodeTab === "daily"
                          ? "Напишите отчет за этот день. Как прошло выполнение привычки? Какие сложности возникли?"
                          : "Начните писать здесь в формате Markdown...\n\nВы можете использовать [[Вики-ссылки]] для связывания заметок."
                      }
                      className="w-full h-full bg-background/30 hover:bg-background/40 focus:bg-background/50 border border-primary/10 focus:border-primary/30 rounded-2xl p-6 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none resize-none transition-all duration-300 leading-relaxed"
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
                    <div className="p-8">
                      {markdownContent.trim() === "" ? (
                        <div className="text-center py-20 text-muted-foreground space-y-4">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground/20" />
                          <div>
                            <p className="text-sm font-semibold">{t("wiki.noNotesTitle", "Заметка пуста")}</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                              {t("wiki.noNotesDesc", "Переключитесь в режим редактора для добавления информации.")}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setTabMode("editor")}
                            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/10 rounded-lg text-xs"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            {t("wiki.writeNote", "Написать заметку")}
                          </Button>
                        </div>
                      ) : (
                        <MarkdownRenderer 
                          content={markdownContent} 
                          onWikiLinkClick={handleWikiLinkClick}
                          existingTargets={existingTargets}
                        />
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          ) : (
            /* Empty State when no node exists or selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center shadow-[0_0_40px_rgba(var(--primary),0.05)]">
                <BookOpen className="w-8 h-8 text-primary opacity-60" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">{t("wiki.noSelectedTitle", "Выберите страницу")}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                  {t("wiki.noSelectedDesc", "Выберите узел или свободную страницу из левой панели для чтения, редактирования или создания заметок. Здесь будет храниться база знаний ваших действий.")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
