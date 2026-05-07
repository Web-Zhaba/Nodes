import { useAuth } from "@/hooks/useAuth";
import { User, Globe } from "lucide-react";

export function GeneralTab() {
  const { user } = useAuth();

  return (
    <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold mb-6">Основная информация</h2>
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner shrink-0">
          <User className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="text-xl font-bold truncate">{user?.email?.split('@')[0] || 'Оператор'}</h3>
          <p className="text-muted-foreground text-sm truncate">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider rounded-md border border-primary/20">
              Level 1 Architect
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Язык системы</label>
            <div className="p-3 bg-muted/20 border border-border/40 rounded-xl flex items-center justify-between opacity-50 cursor-not-allowed">
              <span className="text-sm">Русский (RU)</span>
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Часовой пояс</label>
            <div className="p-3 bg-muted/20 border border-border/40 rounded-xl opacity-50 cursor-not-allowed">
              <span className="text-sm">Auto (Detect)</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground italic">Глубокая локализация будет доступна в следующих обновлениях.</p>
      </div>
    </div>
  );
}
