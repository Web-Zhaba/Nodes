import { useState } from "react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { LogOut, User, Shield, Zap, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { GeneralTab } from "@/features/profile/GeneralTab";
import { AppearanceTab } from "@/features/profile/AppearanceTab";
import { SecurityTab } from "@/features/profile/SecurityTab";
import { IntegrationsTab } from "@/features/profile/IntegrationsTab";

const TABS = [
  { id: "general", label: "Общее", icon: User },
  { id: "appearance", label: "Внешний вид", icon: Palette },
  { id: "security", label: "Безопасность", icon: Shield },
  { id: "integrations", label: "Интеграции", icon: Zap },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("general");
  
  const handleSignOut = async () => {
    try {
      await authService.signOut();
      toast.success("Вы вышли из системы");
    } catch (error) {
      toast.error("Ошибка при выходе");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Профиль</h1>
          <p className="text-muted-foreground text-sm">Центр управления цифровой сущностью</p>
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

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar Nav */}
        <nav className="flex flex-row md:flex-col gap-2 w-full md:w-64 shrink-0 overflow-x-auto pb-2 md:pb-0 sticky top-24 z-10 bg-background/50 backdrop-blur-md md:bg-transparent p-1 rounded-2xl md:p-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0">
          {activeTab === "general" && <GeneralTab />}
          {activeTab === "appearance" && <AppearanceTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "integrations" && <IntegrationsTab />}
        </div>
      </div>
    </div>
  );
}