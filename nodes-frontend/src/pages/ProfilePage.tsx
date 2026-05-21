import { useState, useMemo, useEffect, useRef } from "react";
import { User } from 'lucide-react';
import { Shield } from 'lucide-react';
import { Zap } from 'lucide-react';
import { Palette } from 'lucide-react';
import { Settings2 } from 'lucide-react';
import { Globe } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

import { GeneralTab } from "@/features/profile/GeneralTab";
import { AppearanceTab } from "@/features/profile/AppearanceTab";
import { SecurityTab } from "@/features/profile/SecurityTab";
import { IntegrationsTab } from "@/features/profile/IntegrationsTab";
import { PrivacyTab } from "@/features/profile/PrivacyTab";
import { ProfileSaveButton } from "@/features/profile/components/ProfileSaveButton";
import { useThemeStore } from "@/store/useThemeStore";

interface ProfileFormValues {
  // General
  displayName: string;
  language: string;
  firstDay: string;
  resetTime: string;
  showGreeting: string;
  customGreeting: string;
  showRecommendations: boolean;
  
  // Privacy
  isPublic: boolean;
  publicSlug: string;
  bio: string;
  nodesPrivacy: Record<string, boolean>;
  coresPrivacy: Record<string, boolean>;

  // Appearance
  themeConfig: any;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("general");
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateConfig = useThemeStore(state => state.updateConfig);
  const originalThemeRef = useRef<any>(null);

  const methods = useForm<ProfileFormValues>({
    mode: "onChange",
    defaultValues: {
      displayName: "",
      language: "ru",
      firstDay: "1",
      resetTime: "00:00",
      showGreeting: "true",
      customGreeting: "",
      isPublic: false,
      publicSlug: "",
      bio: "",
      nodesPrivacy: {},
      coresPrivacy: {},
      themeConfig: {
        mode: "light",
        colors: { light: {}, dark: {} }
      }
    }
  });

  const { reset, handleSubmit } = methods;

  // Загружаем данные профиля, узлов и ядер
  const { data: combinedData } = useQuery({
    queryKey: ["profile-full-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const [profileRes, nodesRes, coresRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("nodes").select("id, is_public").eq("user_id", user.id),
        supabase.from("cores").select("id, is_public").eq("user_id", user.id)
      ]);

      if (profileRes.error) throw profileRes.error;
      
      return {
        profile: profileRes.data,
        nodes: nodesRes.data || [],
        cores: coresRes.data || []
      };
    },
    enabled: !!user?.id,
  });

  // Синхронизируем форму с загруженными данными
  useEffect(() => {
    if (combinedData) {
      const { profile, nodes, cores } = combinedData;
      const themeConfig = profile.theme_config || {
        mode: "light",
        colors: { light: {}, dark: {} }
      };

      const nodesPrivacy: Record<string, boolean> = {};
      nodes.forEach(n => nodesPrivacy[n.id] = n.is_public || false);

      const coresPrivacy: Record<string, boolean> = {};
      cores.forEach(c => coresPrivacy[c.id] = c.is_public || false);

      reset({
        displayName: profile.display_name || "",
        language: profile.language || "ru",
        firstDay: (profile.first_day_of_week ?? 1).toString(),
        resetTime: profile.daily_reset_time || "00:00",
        showGreeting: profile.show_greeting ? "true" : "false",
        customGreeting: profile.custom_greeting || "",
        showRecommendations: profile.show_recommendations ?? true,
        isPublic: profile.is_public || false,
        publicSlug: profile.public_slug || "",
        bio: profile.bio || "",
        nodesPrivacy,
        coresPrivacy,
        themeConfig: themeConfig,
      });

      // Сохраняем эталонную тему для возможного отката
      originalThemeRef.current = themeConfig;
      updateConfig(themeConfig);
    }
  }, [combinedData, reset, updateConfig]);

  // Эффект для отката темы при уходе со страницы без сохранения
  useEffect(() => {
    return () => {
      if (originalThemeRef.current) {
        console.log("ProfilePage unmount: reverting to last saved theme", originalThemeRef.current);
        updateConfig(originalThemeRef.current);
      }
    };
  }, [updateConfig]);

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!user?.id) return;
      console.log("Saving profile changes...", data);
      
      // 1. Сохраняем профиль
      const profilePromise = supabase
        .from("profiles")
        .update({
          display_name: data.displayName,
          language: data.language,
          first_day_of_week: parseInt(data.firstDay),
          daily_reset_time: data.resetTime,
          show_greeting: data.showGreeting === "true",
          custom_greeting: data.customGreeting,
          show_recommendations: data.showRecommendations,
          is_public: data.isPublic,
          public_slug: data.publicSlug || null,
          bio: data.bio,
          theme_config: data.themeConfig,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      // 2. Сохраняем приватность узлов (пакетно)
      const nodePromises = Object.entries(data.nodesPrivacy).map(([id, isPublic]) => 
        supabase.from("nodes").update({ is_public: isPublic }).eq("id", id)
      );

      // 3. Сохраняем приватность ядер (пакетно)
      const corePromises = Object.entries(data.coresPrivacy).map(([id, isPublic]) => 
        supabase.from("cores").update({ is_public: isPublic }).eq("id", id)
      );

      const results = await Promise.all([profilePromise, ...nodePromises, ...corePromises]);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: (_, variables) => {
      // Применяем тему к DOM сразу после сохранения
      updateConfig(variables.themeConfig);
      originalThemeRef.current = variables.themeConfig;

      queryClient.invalidateQueries({ queryKey: ["profile-full-settings", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["nodes", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["cores-list", user?.id] });
      toast.success(t("profile.saveSuccess", "Все настройки успешно сохранены"));

      reset(variables);
    },
    onError: (error: any) => {
      toast.error(t("profile.saveError", "Ошибка при сохранении настроек"), {
        description: error.message
      });
    }
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate(data);
  };

  const TABS = useMemo(() => [
    { id: "general", label: t("profile.tabs.general", "General"), icon: User },
    { id: "appearance", label: t("profile.tabs.appearance", "Appearance"), icon: Palette },
    { id: "security", label: t("profile.tabs.security", "Security"), icon: Shield },
    { id: "integrations", label: t("profile.tabs.integrations", "Integrations"), icon: Zap },
    { id: "privacy", label: t("profile.tabs.privacy", "Privacy"), icon: Globe },
  ], [t]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-3 sm:p-6 max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-24 w-full overflow-hidden">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-0.5 sm:mb-1">
              {t("profile.settingsLabel", "Настройки системы")}
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/50">
              {t("profile.title", "Профиль")}
            </h1>
            <p className="text-[10px] sm:text-sm font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1 opacity-80 text-primary">
              <Settings2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {t("profile.controlCenterLabel", "Центр управления")}
            </p>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
          {/* Sidebar Nav - Stretched on mobile */}
          <nav className="flex flex-row md:flex-col gap-1 w-full md:w-64 shrink-0 overflow-x-auto scrollbar-hide sticky top-20 z-10 bg-background/80 backdrop-blur-xl md:bg-transparent p-1 md:p-0 md:border-none overflow-hidden">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 md:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-xl text-[11px] sm:text-sm font-medium transition-all duration-300 whitespace-nowrap group",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="profile-tab-active"
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <tab.icon className={cn("relative z-10 w-4 h-4 transition-transform duration-300", isActive && "scale-110")} />
                  <span className="relative z-10 hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Content Area */}
          <div className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, x: -5 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -10, x: 5 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {activeTab === "general" && <GeneralTab />}
                {activeTab === "appearance" && <AppearanceTab />}
                {activeTab === "security" && <SecurityTab />}
                {activeTab === "integrations" && <IntegrationsTab />}
                {activeTab === "privacy" && <PrivacyTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <ProfileSaveButton isSubmitting={updateProfile.isPending} />
      </form>
    </FormProvider>
  );
}