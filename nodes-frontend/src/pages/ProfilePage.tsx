/**
 * Copyright (c) 2026 Web-Zhaba. All rights reserved.
 * Refactored to Local-First Offline Profile & Settings Page
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { User, Palette, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { GeneralTab } from "@/features/profile/GeneralTab";
import { AppearanceTab } from "@/features/profile/AppearanceTab";
import { DataTab } from "@/features/profile/DataTab";
import { ProfileSaveButton } from "@/features/profile/components/ProfileSaveButton";
import { useThemeStore } from "@/store/useThemeStore";
import { useLocalDatabase } from "@/store/useLocalDatabase";

interface ProfileFormValues {
  // General
  displayName: string;
  language: string;
  firstDay: string;
  resetTime: string;
  showGreeting: string;
  customGreeting: string;
  showRecommendations: boolean;

  // Appearance
  themeConfig: any;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("general");
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateConfig = useThemeStore((state) => state.updateConfig);
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
      showRecommendations: false,
      themeConfig: {
        mode: "dark",
        colors: { light: {}, dark: {} },
      },
    },
  });

  const { reset, handleSubmit } = methods;

  // Load profile data locally
  const { data: combinedData } = useQuery({
    queryKey: ["profile-full-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const state = useLocalDatabase.getState();
      return {
        profile: state.profile,
        nodes: state.nodes,
        cores: state.cores,
      };
    },
    enabled: !!user?.id,
  });

  // Sync form values
  useEffect(() => {
    if (combinedData) {
      const { profile } = combinedData;
      const rawThemeConfig = profile.theme_config || {};
      const themeConfig = {
        mode: rawThemeConfig.mode || "dark",
        colors: {
          light: rawThemeConfig.colors?.light || {},
          dark: rawThemeConfig.colors?.dark || {},
        },
      };

      reset({
        displayName: profile.display_name || "",
        language: profile.language || "ru",
        firstDay: (profile.first_day_of_week ?? 1).toString(),
        resetTime: profile.daily_reset_time || "00:00",
        showGreeting: profile.show_greeting ? "true" : "false",
        customGreeting: profile.custom_greeting || "",
        showRecommendations: profile.show_recommendations ?? false,
        themeConfig: themeConfig,
      });

      originalThemeRef.current = themeConfig;
      updateConfig(themeConfig);
    }
  }, [combinedData, reset, updateConfig]);

  // Revert preview theme on unmount if not saved
  useEffect(() => {
    return () => {
      if (originalThemeRef.current) {
        updateConfig(originalThemeRef.current);
      }
    };
  }, [updateConfig]);

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!user?.id) return;
      
      const db = useLocalDatabase.getState();
      
      // Update local profile
      db.updateProfile({
        display_name: data.displayName,
        language: data.language,
        first_day_of_week: parseInt(data.firstDay),
        daily_reset_time: data.resetTime,
        show_greeting: data.showGreeting === "true",
        custom_greeting: data.customGreeting,
        show_recommendations: data.showRecommendations,
        theme_config: data.themeConfig,
      });
    },
    onSuccess: (_, variables) => {
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
        description: error.message,
      });
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate(data);
  };

  const TABS = useMemo(
    () => [
      { id: "general", label: t("profile.tabs.general", "General"), icon: User },
      { id: "appearance", label: t("profile.tabs.appearance", "Appearance"), icon: Palette },
      { id: "data", label: t("profile.tabs.data", "Данные"), icon: Settings2 },
    ],
    [t]
  );

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-3 sm:p-6 max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-24 w-full overflow-hidden"
      >
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
          {/* Sidebar Nav */}
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
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="profile-tab-active"
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <tab.icon
                    className={cn("relative z-10 w-4 h-4 transition-transform duration-300", isActive && "scale-110")}
                  />
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
                {activeTab === "data" && <DataTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <ProfileSaveButton isSubmitting={updateProfile.isPending} />
      </form>
    </FormProvider>
  );
}