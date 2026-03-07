import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { LogOut } from "lucide-react";

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Вы вышли из системы");
    } catch (error) {
      toast.error("Ошибка при выходе");
    }
  };
  
export default function ProfilePage() {
    return (
        <div>
            <h1>Профиль</h1>
            <button
              onClick={handleSignOut}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-red-500/10 transition-colors border border-white/5 text-muted-foreground hover:text-red-500"
              title="Выйти"
            >
              <LogOut className="w-5 h-5 shrink-0" />
            </button>
        </div>
    )
}