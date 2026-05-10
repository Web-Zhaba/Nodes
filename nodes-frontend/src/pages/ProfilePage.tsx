import { useState, useMemo } from "react";
import { User, Shield, Zap, Palette, Settings2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

import { GeneralTab } from "@/features/profile/GeneralTab";
import { AppearanceTab } from "@/features/profile/AppearanceTab";
import { SecurityTab } from "@/features/profile/SecurityTab";
import { IntegrationsTab } from "@/features/profile/IntegrationsTab";
import { PrivacyTab } from "@/features/profile/PrivacyTab";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("general");
  const { t } = useTranslation();

  const TABS = useMemo(() => [
    { id: "general", label: t("profile.tabs.general", "General"), icon: User },
    { id: "appearance", label: t("profile.tabs.appearance", "Appearance"), icon: Palette },
    { id: "security", label: t("profile.tabs.security", "Security"), icon: Shield },
    { id: "integrations", label: t("profile.tabs.integrations", "Integrations"), icon: Zap },
    { id: "privacy", label: t("profile.tabs.privacy", "Privacy"), icon: Globe },
  ], [t]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t("profile.settingsLabel", "Настройки системы")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/50">
            {t("profile.title", "Профиль")}
          </h1>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1 opacity-80 text-primary">
            <Settings2 className="w-3.5 h-3.5" />
            {t("profile.controlCenterLabel", "Центр управления")}
          </p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar Nav */}
        <nav className="flex flex-row md:flex-col gap-1 w-full md:w-64 shrink-0 overflow-x-auto pb-2 md:pb-0 sticky top-24 z-10 bg-background/50 backdrop-blur-md md:bg-transparent p-1 md:p-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap group",
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
    </div>
  );
}