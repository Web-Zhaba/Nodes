import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { MessageSquare } from "lucide-react";

interface GreetingSectionProps {
  form: UseFormReturn<any>;
  isLoading: boolean;
}

export function GreetingSection({ form, isLoading }: GreetingSectionProps) {
  const showGreeting = form.watch("showGreeting");

  return (
    <div className="space-y-6">
      <div className="space-y-3 p-5 rounded-3xl border border-border/40 bg-muted/5">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <Label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Приветствие на главной</Label>
        </div>
        <Controller
          name="showGreeting"
          control={form.control}
          render={({ field }) => (
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              disabled={isLoading}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  field.value === "true" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/40 hover:bg-muted/10"
                }`}
              >
                <span className="font-medium text-sm">Показывать</span>
                <RadioGroupItem value="true" />
              </Label>
              <Label
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  field.value === "false" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/40 hover:bg-muted/10"
                }`}
              >
                <span className="font-medium text-sm">Скрыть</span>
                <RadioGroupItem value="false" />
              </Label>
            </RadioGroup>
          )}
        />
      </div>

      <AnimatePresence mode="wait">
        {showGreeting === "true" && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3 p-5 rounded-3xl border border-primary/20 bg-primary/5">
              <Label className="text-xs text-primary/70 uppercase tracking-widest font-bold">Текст приветствия</Label>
              <Input
                {...form.register("customGreeting")}
                placeholder="Привет, {name}"
                className="bg-background/50 border-primary/20 h-12 rounded-2xl px-4 text-lg font-medium focus:border-primary transition-all"
                disabled={isLoading}
              />
              <p className="text-[10px] text-muted-foreground px-1 italic">
                Используйте <code className="text-primary font-bold">{`{name}`}</code> для автоматической вставки вашего имени.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
