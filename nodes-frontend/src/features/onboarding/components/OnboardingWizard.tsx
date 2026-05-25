import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { useOnboardingStore } from "../useOnboardingStore";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfileMutation } from "@/features/profile/hooks/useProfileQuery";
import { WelcomeStep, CreateNodeStep, FirstImpulseStep, CreateCoreStep, SeeGraphStep } from "./OnboardingSteps";

const TOTAL_STEPS = 5;

export function OnboardingWizard() {
  const { t } = useTranslation();
  const { step, isOpen } = useOnboardingStore();
  const { user } = useAuth();
  const updateProfile = useUpdateProfileMutation();

  const handleComplete = () => {
    if (user?.id) {
      updateProfile.mutate({
        userId: user.id,
        updates: { onboarding_completed: true },
      });
    }
  };

  if (!isOpen) return null;

  const steps = [
    <WelcomeStep key="welcome" />,
    <CreateNodeStep key="createNode" />,
    <FirstImpulseStep key="firstImpulse" />,
    <CreateCoreStep key="createCore" />,
    <SeeGraphStep key="seeGraph" onComplete={handleComplete} />,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {t("onboarding.progress", { current: step + 1, total: TOTAL_STEPS })}
            </span>
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={false}
              style={{ originX: 0, width: "100%" }}
              animate={{ scaleX: (step + 1) / TOTAL_STEPS }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {steps[step] || steps[0]}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
