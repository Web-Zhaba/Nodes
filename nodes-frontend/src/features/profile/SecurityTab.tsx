import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Globe } from 'lucide-react';
import { Github } from 'lucide-react';
import { Chrome } from 'lucide-react';
import { Link2 } from 'lucide-react';
import { Unlink2 } from 'lucide-react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import { config } from "@/config";

export function SecurityTab() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const { t, i18n } = useTranslation();

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
      toast.error(t("profile.security.emailNotFound", "Электронная почта не найдена"));
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await authService.resetPasswordForEmail(user.email, `${config.siteUrl}/auth/callback`);
      if (error) throw error;
      toast.success(t("profile.security.resetEmailSent", "Письмо со ссылкой для сброса отправлено на вашу почту"));
    } catch (error: any) {
      toast.error(t("profile.security.resetEmailError", "Ошибка при отправке письма"), {
        description: error.message,
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOutOthers = async () => {
    try {
      const { error } = await authService.signOutOthers();
      if (error) throw error;
      toast.success(t("profile.security.signOutOthersSuccess", "Вы вышли на всех остальных устройствах"));
      fetchSessions();
    } catch (error: any) {
      toast.error(t("profile.security.signOutOthersError", "Ошибка при выходе из других сессий"), {
        description: error.message,
      });
    }
  };

  const getLocaleString = () => {
    return i18n.language === "ru" ? "ru-RU" : "en-US";
  };

  return (
    <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-8 shadow-xl space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full overflow-hidden">
      <div className="px-1 sm:px-0">
        <h2 className="text-lg sm:text-xl font-bold">{t("profile.security.title", "Безопасность")}</h2>
        <p className="text-[11px] sm:text-sm text-muted-foreground">{t("profile.security.subtitle", "Управление цифровым следом.")}</p>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border/40 bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold">{t("profile.security.resetPassword", "Сброс пароля")}</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{t("profile.security.resetPasswordDesc", "Отправить ссылку для сброса на почту")}</p>
          </div>
          <Button 
            type="button"
            variant="secondary" 
            className="rounded-lg sm:rounded-xl w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
            onClick={handleResetPasswordEmail}
            disabled={isUpdatingPassword}
          >
            {t("profile.security.resetButton", "Сбросить")}
          </Button>
        </div>
        
        {/* Connected Accounts Section */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border/40 bg-muted/10 space-y-3 sm:space-y-4">
          <div className="px-1 sm:px-0">
            <h3 className="text-sm sm:text-base font-bold">{t("profile.security.connectedAccounts", "Связанные аккаунты")}</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{t("profile.security.connectedAccountsDesc", "Дополнительные способы входа в систему")}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {[
              { id: 'google', name: 'Google', icon: Chrome, color: 'text-orange-500' },
              { id: 'github', name: 'GitHub', icon: Github, color: 'text-foreground' }
            ].map((provider) => {
              const identity = user?.identities?.find(i => i.provider === provider.id);
              const isLinked = !!identity;

              return (
                <div key={provider.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-background rounded-lg sm:rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <provider.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", provider.color)} />
                    <div>
                      <p className="text-[13px] sm:text-sm font-bold">{provider.name}</p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                        {isLinked ? t("profile.security.connected", "Подключено") : t("profile.security.notConnected", "Не подключено")}
                      </p>
                    </div>
                  </div>
                  
                  {isLinked ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 sm:h-8 px-2 text-[9px] sm:text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      onClick={async () => {
                        if (!identity) return;
                        const { error } = await supabase.auth.unlinkIdentity(identity);
                        if (error) {
                          toast.error(t("profile.security.unlinkError", { error: error.message }));
                        } else {
                          toast.success(t("profile.security.unlinkSuccess", { provider: provider.name }));
                          window.location.reload(); // Reload to refresh identities
                        }
                      }}
                    >
                      <Unlink2 className="w-3 h-3 mr-1" />
                      {t("profile.security.unlink", "Отвязать")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 sm:h-8 px-2 text-[9px] sm:text-[10px] rounded-lg border-border/40"
                      onClick={() => authService.signInWithOAuth(provider.id as any)}
                    >
                      <Link2 className="w-3 h-3 mr-1" />
                      {t("profile.security.link", "Привязать")}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border/40 bg-muted/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold">{t("profile.security.sessionManagement", "Управление сессиями")}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{t("profile.security.sessionManagementDesc", "Устройства, имеющие доступ к аккаунту")}</p>
            </div>
            <Button 
              type="button"
              variant="destructive" 
              size="sm" 
              className="rounded-lg sm:rounded-xl w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-10"
              onClick={handleSignOutOthers}
            >
              {t("profile.security.signOutOthers", "Выйти на других устройствах")}
            </Button>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {isLoadingSessions ? (
              <div className="flex items-center justify-center p-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sessions.length > 0 ? (
              sessions.map((session, index) => {
                const isCurrent = index === 0;
                const userAgent = session.user_agent || t("profile.security.unknownDevice", "Неизвестное устройство");
                const isMobile = userAgent.toLowerCase().includes('mobile');
                
                return (
                  <div key={session.id} className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-background rounded-lg sm:rounded-xl border border-border/50">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {isMobile ? <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-primary opacity-70" /> : <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] sm:text-sm font-bold truncate">
                            {isCurrent 
                              ? t("profile.security.currentSession", "Текущая сессия") 
                              : isMobile 
                                ? t("profile.security.mobileDevice", "Мобильное устройство") 
                                : t("profile.security.computer", "Компьютер")}
                          </p>
                          {isCurrent && (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] shrink-0" title={t("profile.security.active", "Активно")} />
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate" title={userAgent}>
                          {userAgent}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground opacity-70 mt-0.5 sm:mt-1 break-words whitespace-normal">
                          IP: {session.ip || "Unknown"} • {t("profile.security.updatedAt", { date: new Date(session.updated_at).toLocaleString(getLocaleString()) })}
                        </p>
                      </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-background rounded-lg sm:rounded-xl border border-border/50">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] sm:text-sm font-bold truncate">{t("profile.security.currentSession", "Текущая сессия")}</p>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] shrink-0" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t("profile.security.webClient", "Web-клиент (Это устройство)")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
