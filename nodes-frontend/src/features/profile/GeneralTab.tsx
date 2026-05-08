import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth.service";
import { useProfileQuery, useUpdateProfileMutation } from "./hooks/useProfileQuery";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Save, Loader2 } from "lucide-react";

// Под-компоненты секций
import { IdentitySection } from "./sections/IdentitySection";
import { RegionalSection } from "./sections/RegionalSection";
import { GreetingSection } from "./sections/GreetingSection";

interface GeneralFormValues {
  displayName: string;
  resetTime: string;
  firstDay: string;
  language: string;
  showGreeting: string;
  customGreeting: string;
}

export function GeneralTab() {
  const { user } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfileQuery(user?.id);
  const updateProfile = useUpdateProfileMutation();

  const form = useForm<GeneralFormValues>({
    defaultValues: {
      displayName: "",
      resetTime: "00:00",
      firstDay: "1",
      language: "ru",
      showGreeting: "true",
      customGreeting: "Привет, {name}",
    },
  });

  const { reset, handleSubmit, formState: { isDirty, isSubmitting } } = form;

  // Синхронизация формы с данными профиля
  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.display_name || "",
        resetTime: profile.daily_reset_time || "00:00",
        firstDay: String(profile.first_day_of_week ?? 1),
        language: profile.language || "ru",
        showGreeting: String(profile.show_greeting ?? true),
        customGreeting: profile.custom_greeting || "Привет, {name}",
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: GeneralFormValues) => {
    if (!user?.id) return;

    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        updates: {
          display_name: data.displayName,
          daily_reset_time: data.resetTime,
          first_day_of_week: parseInt(data.firstDay),
          language: data.language,
          show_greeting: data.showGreeting === "true",
          custom_greeting: data.customGreeting,
        },
      });
      
      toast.success("Настройки успешно сохранены");
      reset(data); // Сбрасываем isDirty
    } catch (err) {
      toast.error("Не удалось сохранить изменения");
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast.success("Сессия завершена");
    } catch (error) {
      toast.error("Ошибка при выходе");
    }
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <IdentitySection form={form} isLoading={isSubmitting} email={user?.email || ""} />

        <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-8">
          <div>
            <h2 className="text-xl font-bold">Системные настройки</h2>
            <p className="text-sm text-muted-foreground">Конфигурация окружения вашего узла.</p>
          </div>

          <RegionalSection form={form} isLoading={isSubmitting} />
          
          <div className="border-t border-border/40 pt-8">
            <GreetingSection form={form} isLoading={isSubmitting} />
          </div>

          {/* Logout Section inside the main card but at the bottom */}
          <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm font-bold text-destructive">Выход из системы</p>
              <p className="text-xs text-muted-foreground">Завершить текущую сессию управления</p>
            </div>
            <Button 
              type="button"
              variant="destructive" 
              className="rounded-xl w-full sm:w-auto bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground border-destructive/20 transition-all duration-300"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти из аккаунта
            </Button>
          </div>
        </div>

        {/* Floating Save Button */}
        <AnimatePresence>
          {isDirty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 right-8 z-50"
            >
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="rounded-full h-14 px-8 shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Сохранить изменения
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
