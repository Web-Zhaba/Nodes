import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { Lightbulb } from 'lucide-react';
import { useTranslation } from "react-i18next";

interface RecommendationsSectionProps {
  form: UseFormReturn<any>;
  isLoading: boolean;
}

export function RecommendationsSection({ form, isLoading }: RecommendationsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 p-5 rounded-3xl border border-border/40 bg-muted/5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Lightbulb className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold block mb-1">
              {t("profile.recommendations.title", "Персонализированные идеи")}
            </Label>
            <p className="text-xs text-muted-foreground/60 leading-tight">
              {t("profile.recommendations.desc", "Предлагать контент на основе ваших привычек в отдельном разделе?")}
            </p>
          </div>
        </div>
        <Controller
          name="showRecommendations"
          control={form.control}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isLoading}
            />
          )}
        />
      </div>
    </div>
  );
}
