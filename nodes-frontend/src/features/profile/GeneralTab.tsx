/**
 * Copyright (c) 2026 Web-Zhaba. All rights reserved.
 * Refactored to Local-First Offline General Settings Tab
 */

import { useAuth } from "@/hooks/useAuth";
import { useProfileQuery } from "./hooks/useProfileQuery";
import { useUpdateProfileMutation } from "./hooks/useProfileQuery";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import { useOnboardingStore } from "@/features/onboarding/useOnboardingStore";

// Sections
import { IdentitySection } from "./sections/IdentitySection";
import { RegionalSection } from "./sections/RegionalSection";
import { GreetingSection } from "./sections/GreetingSection";

export function GeneralTab() {
  const { user } = useAuth();
  const { isLoading: isProfileLoading } = useProfileQuery(user?.id);
  const { t } = useTranslation();
  const form = useFormContext();
  const updateProfile = useUpdateProfileMutation();
  const openOnboarding = useOnboardingStore((s) => s.open);

  const {
    formState: { isSubmitting },
  } = form;

  const handleRestartOnboarding = () => {
    if (user?.id) {
      updateProfile.mutate({ userId: user.id, updates: { onboarding_completed: false } });
    }
    openOnboarding();
  };

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <IdentitySection form={form} isLoading={isSubmitting} />

      <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-4 sm:p-8 shadow-xl space-y-8">
        <div>
          <h2 className="text-xl font-bold">{t("profile.general.systemSettings", "System Settings")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("profile.general.systemSettingsDesc", "Configuration of your node environment.")}
          </p>
        </div>

        <RegionalSection form={form} isLoading={isSubmitting} />

        <div className="border-t border-border/40 pt-8">
          <GreetingSection form={form} isLoading={isSubmitting} />
        </div>

        <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold">{t("profile.general.restartOnboarding", "Restart Onboarding")}</p>
            <p className="text-xs text-muted-foreground">
              {t("profile.general.restartOnboardingDesc", "Run the getting-started wizard again")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl w-full sm:w-auto transition-all duration-300"
            onClick={handleRestartOnboarding}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t("profile.general.restartOnboardingButton", "Restart")}
          </Button>
        </div>
      </div>
    </div>
  );
}
