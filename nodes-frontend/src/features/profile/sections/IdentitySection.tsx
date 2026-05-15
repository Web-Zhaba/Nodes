import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import Check from "lucide-react/dist/esm/icons/check";
import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface IdentitySectionProps {
  form: UseFormReturn<any>;
  isLoading: boolean;
  email: string;
}

export function IdentitySection({ form, isLoading, email }: IdentitySectionProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-3xl border border-border/40 bg-muted/5">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
        <span className="text-3xl font-bold text-primary">
          {form.watch("displayName")?.charAt(0).toUpperCase() || "?"}
        </span>
      </div>
      <div className="flex-1 space-y-1 w-full min-w-0">
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <div className="flex items-center gap-2 w-full">
              <Input
                id="displayName"
                {...form.register("displayName")}
                className="bg-background/50 border-primary/30 h-10 rounded-xl"
                autoFocus
                disabled={isLoading}
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="shrink-0 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                onClick={() => setIsEditingName(false)}
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold tracking-tight truncate max-w-[300px]">
                {form.watch("displayName") || t("profile.identity.anonymousNode", "Анонимный узел")}
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsEditingName(true)}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate px-1">
          {email || "node-operator@system.nodes"}
        </p>
      </div>
    </div>
  );
}
