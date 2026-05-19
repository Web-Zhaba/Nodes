import { motion, AnimatePresence } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { Loader2 } from 'lucide-react';
import { Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface ProfileSaveButtonProps {
  isSubmitting: boolean;
  onSave?: () => void;
}

export const ProfileSaveButton = ({ isSubmitting, onSave }: ProfileSaveButtonProps) => {
  const { t } = useTranslation();
  const { formState: { isDirty, isValid } } = useFormContext();

  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="bg-background/40 backdrop-blur-3xl border border-primary/20 rounded-3xl p-2 shadow-[0_25px_50px_-12px_rgba(var(--primary),0.25)]">
            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              onClick={onSave}
              className={cn(
                "w-full h-14 rounded-2xl text-base font-bold transition-all duration-500",
                "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                "hover:scale-[1.02] hover:shadow-primary/40 active:scale-[0.98]",
                "disabled:opacity-50 disabled:grayscale disabled:scale-100",
                "relative overflow-hidden group"
              )}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine" />
              
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <Save className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              )}
              <span className="tracking-tight relative z-10">
                {t("profile.saveChanges", "Сохранить изменения")}
              </span>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
