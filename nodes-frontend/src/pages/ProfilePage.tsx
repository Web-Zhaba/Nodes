import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { LogOut, User, Shield, Zap, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Вы вышли из системы");
    } catch (error) {
      toast.error("Ошибка при выходе");
    }
  };
  
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-8 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Профиль</h1>
          <p className="text-muted-foreground text-sm">Управление вашей цифровой сущностью</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleSignOut}
          className="rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      {/* User Info Card */}
      <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 opacity-40 group-hover:opacity-70 transition-opacity" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">{user?.email?.split('@')[0] || 'Оператор'}</h2>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider rounded-md border border-primary/20">
                Level 1 Architect
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: Shield, label: "Безопасность", desc: "Управление доступом" },
          { icon: Zap, label: "Синхронизация", desc: "Облачные импульсы" },
          { icon: Settings, label: "Настройки", desc: "Интерфейс и систем" },
        ].map((item, i) => (
          <div 
            key={i}
            className="p-4 rounded-2xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-background border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Version Info */}
      <div className="text-center opacity-30 text-[10px] uppercase tracking-[0.2em] pt-8">
        Nodes Protocol v0.4.2 // Status: Stable
      </div>
    </div>
  );
}