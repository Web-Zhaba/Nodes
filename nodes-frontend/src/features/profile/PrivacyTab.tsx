import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { publicService } from "@/features/public-sharing/api/public.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Globe, Lock, Link2, Copy, Check, Loader2,
  Share2, User, Zap, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { Node } from "@/types";
import { useTranslation } from "react-i18next";

// =====================================================
// PrivacyTab — управление публичностью профиля и узлов
// =====================================================

interface PrivacyFormValues {
  isPublic: boolean;
  publicSlug: string;
  bio: string;
}

/** Загружаем текущие настройки приватности прямо из БД */
async function fetchPrivacySettings(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("is_public, public_slug, bio")
    .eq("id", userId)
    .single();
  return data ?? { is_public: false, public_slug: "", bio: "" };
}

export function PrivacyTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copiedProfile, setCopiedProfile] = useState(false);
  const [nodeToggles, setNodeToggles] = useState<Record<string, boolean>>({});
  const [coreToggles, setCoreToggles] = useState<Record<string, boolean>>({});
  const [slugError, setSlugError] = useState("");
  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<PrivacyFormValues>({
    defaultValues: { isPublic: false, publicSlug: "", bio: "" },
  });
  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = form;

  // Watch значения для UI и зависимостей
  const isPublic = watch("isPublic");
  const publicSlug = watch("publicSlug");

  // Загружаем данные профиля
  const { data: privacy, isLoading: privacyLoading } = useQuery({
    queryKey: ["privacy", user?.id],
    queryFn: () => fetchPrivacySettings(user!.id),
    enabled: !!user?.id,
  });

  // Загружаем узлы пользователя через React Query
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
      return (data ?? []) as any[];
    },
    enabled: !!user?.id,
  });

  // 1. МУТАЦИИ
  
  const updatePrivacy = useMutation({
    mutationFn: async (data: PrivacyFormValues) => {
      if (!user?.id) return;
      await publicService.updateProfilePrivacy(user.id, {
        is_public: data.isPublic,
        public_slug: data.publicSlug || undefined,
        bio: data.bio,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["privacy", user?.id] });
      toast.success(t("profile.privacy.saveSuccess", "Настройки приватности сохранены"));
    },
    onError: () => toast.error(t("profile.privacy.saveError", "Не удалось сохранить настройки")),
  });

  const toggleNodePublic = useMutation({
    mutationFn: async ({ nodeId, isPublic }: { nodeId: string; isPublic: boolean }) => {
      await publicService.updateNodePrivacy(nodeId, isPublic);
    },
    onError: (_, vars) => {
      setNodeToggles((prev) => ({ ...prev, [vars.nodeId]: !vars.isPublic }));
      toast.error(t("profile.privacy.toggleNodeError", "Не удалось обновить узел"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes", user?.id] });
    }
  });

  const toggleCorePublic = useMutation({
    mutationFn: async ({ coreId, isPublic }: { coreId: string; isPublic: boolean }) => {
      await publicService.updateCorePrivacy(coreId, isPublic);
    },
    onError: (_, vars) => {
      setCoreToggles((prev) => ({ ...prev, [vars.coreId]: !vars.isPublic }));
      toast.error(t("profile.privacy.toggleCoreError", "Не удалось обновить ядро"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cores-list", user?.id] });
    }
  });

  // 2. ЭФФЕКТЫ

  // Валидация slug в реальном времени
  useEffect(() => {
    if (!publicSlug) { setSlugError(""); return; }
    const isValidFormat = /^[a-z0-9_-]{3,30}$/.test(publicSlug);
    if (!isValidFormat) {
      setSlugError(t("profile.privacy.slugHint", "Только строчные буквы, цифры, _ и - (3–30 символов)"));
      return;
    }
    setSlugError("");
    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current);
    slugDebounceRef.current = setTimeout(async () => {
      if (publicSlug === privacy?.public_slug) return;
      const available = await publicService.isSlugAvailable(publicSlug);
      if (!available) setSlugError(t("profile.privacy.slugOccupied", "Этот slug уже занят"));
    }, 500);
  }, [publicSlug, privacy?.public_slug]);

  // Синхронизация формы с данными профиля
  useEffect(() => {
    if (privacy) {
      setValue("isPublic", privacy.is_public ?? false);
      setValue("publicSlug", privacy.public_slug ?? "");
      setValue("bio", privacy.bio ?? "");
    }
  }, [privacy, setValue]);

  // Синхронизация тогглов узлов из БД
  useEffect(() => {
    if (nodes.length > 0) {
      setNodeToggles(prev => {
        const next = { ...prev };
        nodes.forEach(n => {
          if (next[n.id] === undefined || !toggleNodePublic.isPending) {
            next[n.id] = n.is_public ?? false;
          }
        });
        return next;
      });
    }
  }, [nodes, toggleNodePublic.isPending]);

  // Синхронизация тогглов ядер
  useEffect(() => {
    if (rawCores.length > 0) {
      setCoreToggles(prev => {
        const next = { ...prev };
        rawCores.forEach(c => {
          if (next[c.id] === undefined || !toggleCorePublic.isPending) {
            next[c.id] = c.is_public ?? false;
          }
        });
        return next;
      });
    }
  }, [rawCores, toggleCorePublic.isPending]);

  // 3. ОБРАБОТЧИКИ
  
  const handleNodeToggle = (nodeId: string, current: boolean) => {
    const next = !current;
    setNodeToggles((prev) => ({ ...prev, [nodeId]: next }));
    toggleNodePublic.mutate({ nodeId, isPublic: next });
  };

  const handleCoreToggle = (coreId: string, current: boolean) => {
    const next = !current;
    setCoreToggles((prev) => ({ ...prev, [coreId]: next }));
    toggleCorePublic.mutate({ coreId, isPublic: next });
  };

  const profileUrl = `${window.location.origin}/share/u/${publicSlug}`;

  const copyProfileLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopiedProfile(true);
    setTimeout(() => setCopiedProfile(false), 2000);
  };

  const onSubmit = async (data: PrivacyFormValues) => {
    if (slugError) return;
    await updatePrivacy.mutateAsync(data);
  };

  if (privacyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

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
                transition={{ duration: 0.25 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Slug */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    {t("profile.privacy.publicSlug", "Public slug")}
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {window.location.host}/share/u/
                    </span>
                    <Input
                      {...register("publicSlug")}
                      placeholder={t("profile.privacy.slugPlaceholder", "your-nickname")}
                      className={cn(
                        "rounded-xl flex-1",
                        slugError && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                  </div>
                  {slugError && (
                    <p className="text-xs text-destructive">{slugError}</p>
                  )}
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("profile.privacy.bio", "Profile Bio")}</Label>
                  <textarea
                    {...register("bio")}
                    rows={2}
                    placeholder={t("profile.privacy.bioPlaceholder", "Brief description of your life architecture...")}
                    className="w-full rounded-xl border border-border/40 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                {/* Share link */}
                {publicSlug && !slugError && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                      {t("profile.privacy.yourGraphLink", "Your graph link")}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={profileUrl}
                        className="rounded-xl font-mono text-xs text-muted-foreground flex-1"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="rounded-xl flex-shrink-0"
                        onClick={copyProfileLink}
                      >
                        {copiedProfile
                          ? <Check className="w-4 h-4 text-green-400" />
                          : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !!slugError}
              className="rounded-xl"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
              {t("profile.privacy.saveButton", "Save Profile Settings")}
            </Button>
          </div>
        </div>
      </form>

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
              const isCorePublic = coreToggles[core.id] ?? false;
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
                    disabled={toggleCorePublic.isPending}
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
              const isNodePublic = nodeToggles[node.id] ?? false;
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
                      disabled={toggleNodePublic.isPending}
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
