import { useEffect, useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { publicService } from "@/features/public-sharing/api/public.service";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Globe } from 'lucide-react';
import { Lock } from 'lucide-react';
import { Link2 } from 'lucide-react';
import { Copy } from 'lucide-react';
import { Check } from 'lucide-react';
import { User } from 'lucide-react';
import { Zap } from 'lucide-react';
import { Layers } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { Node, Core } from "@/types";
import { useTranslation } from "react-i18next";

// =====================================================
// PrivacyTab — управление публичностью профиля и узлов
// =====================================================

export function PrivacyTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { register, watch, setValue, setError, clearErrors, formState: { errors } } = useFormContext();
  const nodesPrivacy = watch("nodesPrivacy") || {};
  const coresPrivacy = watch("coresPrivacy") || {};
  const slugError = errors.publicSlug?.message as string | undefined;
  
  const [copiedProfile, setCopiedProfile] = useState(false);
  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watch значения для UI и зависимостей
  const isPublic = watch("isPublic");
  const publicSlug = watch("publicSlug");

  // Загружаем данные профиля (для валидации slug)
  const { data: privacy } = useQuery({
    queryKey: ["privacy", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_public, public_slug, bio")
        .eq("id", user!.id)
        .single();
      return data ?? { is_public: false, public_slug: "", bio: "" };
    },
    enabled: !!user?.id,
  });

  // Загружаем узлы пользователя
  const { data: nodes = [] } = useQuery<Node[]>({
    queryKey: ["nodes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("nodes")
        .select("id, name, node_type, color, is_public")
        .eq("user_id", user.id)
        .order("name");
      return (data ?? []) as Node[];
    },
    enabled: !!user?.id,
  });

  // Загружаем ядра пользователя
  const { data: rawCores = [] } = useQuery({
    queryKey: ["cores-list", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("cores")
        .select("id, name, color, is_public")
        .eq("user_id", user.id)
        .order("name");
      return (data ?? []) as Pick<Core, "id" | "name" | "color" | "is_public">[];
    },
    enabled: !!user?.id,
  });

  // Удалены индивидуальные мутации (toggleNodePublic, toggleCorePublic), 
  // так как теперь сохранение происходит пакетно через ProfilePage

  // 2. ЭФФЕКТЫ

  // Валидация slug в реальном времени
  useEffect(() => {
    if (!publicSlug) { clearErrors("publicSlug"); return; }
    const isValidFormat = /^[a-z0-9_-]{3,30}$/.test(publicSlug);
    if (!isValidFormat) {
      setError("publicSlug", { 
        type: "manual", 
        message: t("profile.privacy.slugHint", "Только строчные буквы, цифры, _ и - (3–30 символов)") 
      });
      return;
    }
    clearErrors("publicSlug");
    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current);
    slugDebounceRef.current = setTimeout(async () => {
      if (publicSlug === privacy?.public_slug) return;
      const available = await publicService.isSlugAvailable(publicSlug);
      if (!available) {
        setError("publicSlug", { 
          type: "manual", 
          message: t("profile.privacy.slugOccupied", "Этот slug уже занят") 
        });
      }
    }, 500);
  }, [publicSlug, privacy?.public_slug, t, setError, clearErrors]);

  // Синхронизация тогглов из БД при первой загрузке (если они еще не в форме)
  useEffect(() => {
    if (nodes.length > 0 && Object.keys(nodesPrivacy).length === 0) {
      const initial: Record<string, boolean> = {};
      nodes.forEach(n => initial[n.id] = n.is_public ?? false);
      setValue("nodesPrivacy", initial);
    }
  }, [nodes, nodesPrivacy, setValue]);

  useEffect(() => {
    if (rawCores.length > 0 && Object.keys(coresPrivacy).length === 0) {
      const initial: Record<string, boolean> = {};
      rawCores.forEach(c => initial[c.id] = c.is_public ?? false);
      setValue("coresPrivacy", initial);
    }
  }, [rawCores, coresPrivacy, setValue]);

  // 3. ОБРАБОТЧИКИ
  
  const handleNodeToggle = (nodeId: string, current: boolean) => {
    setValue("nodesPrivacy", { ...nodesPrivacy, [nodeId]: !current }, { shouldDirty: true });
  };

  const handleCoreToggle = (coreId: string, current: boolean) => {
    setValue("coresPrivacy", { ...coresPrivacy, [coreId]: !current }, { shouldDirty: true });
  };

  const profileUrl = `${window.location.origin}/share/u/${publicSlug}`;

  const copyProfileLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopiedProfile(true);
    setTimeout(() => setCopiedProfile(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Public Profile Toggle */}
      <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            {t("profile.privacy.publicProfile", "Public Profile")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("profile.privacy.publicProfileDesc", "Open your neural graph to the world. A public link allows anyone to see your active nodes and their stability.")}
          </p>
        </div>

        {/* Toggle row */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-border/40 bg-background/30">
          <div className="flex items-center gap-3">
            {isPublic
              ? <Globe className="w-4 h-4 text-green-400" />
              : <Lock className="w-4 h-4 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium">{isPublic ? t("profile.privacy.profileIsPublic", "Profile is public") : t("profile.privacy.profileIsPrivate", "Profile is private")}</p>
              <p className="text-xs text-muted-foreground">
                {isPublic ? t("profile.privacy.publicLinkDesc", "Your graph is available via the link") : t("profile.privacy.privateLinkDesc", "Only you see your nodes")}
              </p>
            </div>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={(v) => setValue("isPublic", v, { shouldDirty: true })}
          />
        </div>

        {/* Slug + Bio (conditionally visible) */}
        <AnimatePresence>
          {isPublic && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6 overflow-hidden"
            >
              {/* Unified Slug & Link Section */}
                <div className={cn(
                  "relative group bg-background/30 border border-border/40 rounded-2xl p-4 transition-all duration-300",
                  "focus-within:border-primary/50 focus-within:bg-background/50 focus-within:shadow-[0_0_20px_-10px_rgba(var(--primary),0.3)]",
                  slugError && "border-destructive/40 bg-destructive/5"
                )}>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 flex items-center gap-1.5">
                        <Link2 className="w-3 h-3" />
                        {t("profile.privacy.publicSlugLabel", "Neural Identity")}
                      </span>
                      <div className="flex items-center gap-1">
                        <AnimatePresence mode="wait">
                          {copiedProfile && (
                            <motion.span 
                              initial={{ opacity: 0, x: 5 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 5 }}
                              className="text-[10px] font-bold text-green-400 uppercase mr-2"
                            >
                              {t("common.copied", "Copied")}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={copyProfileLink}
                          className="h-6 w-6 rounded-lg hover:bg-primary/20 hover:text-primary transition-all active:scale-95"
                        >
                          {copiedProfile ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-1 overflow-hidden">
                      <span className="text-[10px] sm:text-xs font-mono text-muted-foreground/50 truncate shrink-0">
                        nodes.life/share/u/
                      </span>
                      <input
                        {...register("publicSlug")}
                        placeholder={t("profile.privacy.slugPlaceholder", "nickname")}
                        className={cn(
                          "bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-lg font-mono tracking-tight text-foreground w-full",
                          slugError && "text-destructive"
                        )}
                      />
                    </div>
                  </div>
                
                {slugError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive mt-1 px-1 flex items-center gap-1.5"
                  >
                    <div className="w-1 h-1 rounded-full bg-destructive" />
                    {slugError}
                  </motion.p>
                )}
              </div>

              {/* Bio Section */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2 px-1">
                  <User className="w-3.5 h-3.5" />
                  {t("profile.privacy.bio", "Profile Description (BIO)")}
                </Label>
                <div className="bg-background/30 border border-border/40 rounded-2xl p-4 focus-within:border-primary/40 focus-within:bg-background/50 transition-all">
                  <textarea
                    {...register("bio")}
                    rows={3}
                    placeholder={t("profile.privacy.bioPlaceholder", "Brief description of your life architecture...")}
                    className="w-full bg-transparent border-none p-0 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0 resize-none leading-relaxed"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Core privacy controls */}
      <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            {t("profile.privacy.coresPrivacy", "Cores Privacy")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("profile.privacy.coresPrivacyDesc", "Public cores will be visible on the graph as gravitational centers.")}
          </p>
        </div>

        {rawCores.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {t("profile.privacy.noCores", "No cores created yet")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rawCores.map((core) => {
              const isCorePublic = !!coresPrivacy[core.id];
              return (
                <div
                  key={core.id}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-xl border transition-all",
                    isCorePublic
                      ? "border-primary/20 bg-primary/5"
                      : "border-border/30 bg-background/20"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: core.color ?? "#6366f1" }}
                    />
                    <p className="text-sm font-medium truncate">{core.name}</p>
                  </div>
                  <Switch
                    checked={isCorePublic}
                    onCheckedChange={() => handleCoreToggle(core.id, isCorePublic)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Node privacy controls */}
      <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            {t("profile.privacy.nodesPrivacy", "Nodes Privacy")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("profile.privacy.nodesPrivacyDesc", "Choose which nodes to display on the public graph.")}
          </p>
        </div>

        {nodes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {t("profile.privacy.noNodes", "No nodes created yet")}
          </div>
        ) : (
          <div className="space-y-2">
            {nodes.map((node) => {
              const isNodePublic = !!nodesPrivacy[node.id];
              return (
                <div
                  key={node.id}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-xl border transition-all",
                    isNodePublic
                      ? "border-primary/20 bg-primary/5"
                      : "border-border/30 bg-background/20"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: node.color ?? "#6366f1" }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{node.name}</p>
                      <p className="text-xs text-muted-foreground">{node.node_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <Switch
                      checked={isNodePublic}
                      onCheckedChange={() => handleNodeToggle(node.id, isNodePublic)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
