import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function SecurityTab() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const { data, error } = await authService.getActiveSessions();
      if (error) {
        console.error("Error fetching sessions:", error);
      } else if (data) {
        const sorted = data.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        setSessions(sorted);
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleResetPasswordEmail = async () => {
    if (!user?.email) {
      toast.error("Электронная почта не найдена");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await authService.resetPasswordForEmail(user.email, `${window.location.origin}/auth/callback`);
      if (error) throw error;
      toast.success("Письмо со ссылкой для сброса отправлено на вашу почту");
    } catch (error: any) {
      toast.error(error.message || "Ошибка при отправке письма");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOutOthers = async () => {
    try {
      const { error } = await authService.signOutOthers();
      if (error) throw error;
      toast.success("Вы вышли на всех остальных устройствах");
      fetchSessions();
    } catch (error: any) {
      toast.error(error.message || "Ошибка при выходе из других сессий");
    }
  };

  return (
    <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-bold">Безопасность</h2>
        <p className="text-sm text-muted-foreground">Управление цифровым следом.</p>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 rounded-2xl border border-border/40 bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold">Сброс пароля</h3>
            <p className="text-xs text-muted-foreground">Отправить ссылку для сброса на почту</p>
          </div>
          <Button 
            variant="secondary" 
            className="rounded-xl w-full sm:w-auto"
            onClick={handleResetPasswordEmail}
            disabled={isUpdatingPassword}
          >
            Сбросить
          </Button>
        </div>
        
        <div className="p-4 rounded-2xl border border-border/40 bg-muted/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold">Управление сессиями</h3>
              <p className="text-xs text-muted-foreground">Устройства, имеющие доступ к аккаунту</p>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              className="rounded-xl w-full sm:w-auto"
              onClick={handleSignOutOthers}
            >
              Выйти на других устройствах
            </Button>
          </div>
          <div className="space-y-3">
            {isLoadingSessions ? (
              <div className="flex items-center justify-center p-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sessions.length > 0 ? (
              sessions.map((session, index) => {
                const isCurrent = index === 0;
                const userAgent = session.user_agent || "Неизвестное устройство";
                const isMobile = userAgent.toLowerCase().includes('mobile');
                
                return (
                  <div key={session.id} className="flex items-center gap-4 p-3 bg-background rounded-xl border border-border/50">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {isMobile ? <Globe className="w-5 h-5 text-primary opacity-70" /> : <Globe className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">
                          {isCurrent ? "Текущая сессия" : isMobile ? "Мобильное устройство" : "Компьютер"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate" title={userAgent}>
                          {userAgent}
                        </p>
                        <p className="text-[10px] text-muted-foreground opacity-70 mt-1">
                          IP: {session.ip || "Неизвестен"} • Обновлено: {new Date(session.updated_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                      {isCurrent && (
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] shrink-0" title="Активно" />
                      )}
                  </div>
                );
              })
            ) : (
              <div className="flex items-center gap-4 p-3 bg-background rounded-xl border border-border/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">Текущая сессия</p>
                  <p className="text-xs text-muted-foreground truncate">Web-клиент (Это устройство)</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] shrink-0" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
