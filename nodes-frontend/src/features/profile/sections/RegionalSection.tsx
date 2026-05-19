import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { Globe } from 'lucide-react';
import { Calendar } from 'lucide-react';
import { Clock } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";
import { useEffect } from "react";

interface RegionalSectionProps {
  form: UseFormReturn<any>;
  isLoading: boolean;
}

export function RegionalSection({ form, isLoading }: RegionalSectionProps) {
  const { t } = useTranslation();
  const setLanguage = useAppStore((state) => state.setLanguage);
  
  // Watch for language changes in the form and update global state
  const formLanguage = form.watch("language");
  
  useEffect(() => {
    if (formLanguage) {
      setLanguage(formLanguage);
    }
  }, [formLanguage, setLanguage]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3 p-5 rounded-3xl border border-border/40 bg-muted/5">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-primary" />
          <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            {t("profile.regional.resetTime", "Время сброса суток")}
          </Label>
        </div>
        <Input
          type="time"
          {...form.register("resetTime")}
          className="bg-background/50 border-border/40 h-12 rounded-2xl px-4 text-lg font-medium"
          disabled={isLoading}
        />
        <p className="text-[10px] text-muted-foreground px-1">
          {t("profile.regional.resetTimeDesc", "Когда система считает, что наступил следующий день.")}
        </p>
      </div>

      <div className="space-y-3 p-5 rounded-3xl border border-border/40 bg-muted/5">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-primary" />
          <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            {t("profile.regional.firstDayOfWeek", "Начало недели")}
          </Label>
        </div>
        <Controller
          name="firstDay"
          control={form.control}
          render={({ field }) => (
            <RadioGroup
              onValueChange={field.onChange}
              value={String(field.value)}
              disabled={isLoading}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  String(field.value) === "1" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/40 hover:bg-muted/10"
                }`}
              >
                <span className="font-medium">{t("common.days.mon", "Пн")}</span>
                <RadioGroupItem value="1" />
              </Label>
              <Label
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  String(field.value) === "0" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/40 hover:bg-muted/10"
                }`}
              >
                <span className="font-medium">{t("common.days.sun", "Вс")}</span>
                <RadioGroupItem value="0" />
              </Label>
            </RadioGroup>
          )}
        />
      </div>

      <div className="space-y-3 p-5 rounded-3xl border border-border/40 bg-muted/5 md:col-span-2">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-primary" />
          <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
            {t("profile.regional.language", "Язык интерфейса")}
          </Label>
        </div>
        <Controller
          name="language"
          control={form.control}
          render={({ field }) => (
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              disabled={isLoading}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <Label
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  field.value === "ru" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/40 hover:bg-muted/10"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium uppercase tracking-tight">{t("profile.regional.langRu", "Русский")}</span>
                </div>
                <RadioGroupItem value="ru" />
              </Label>
              <Label
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  field.value === "en" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/40 hover:bg-muted/10"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium uppercase tracking-tight">{t("profile.regional.langEn", "English")}</span>
                </div>
                <RadioGroupItem value="en" />
              </Label>
            </RadioGroup>
          )}
        />
      </div>
    </div>
  );
}
