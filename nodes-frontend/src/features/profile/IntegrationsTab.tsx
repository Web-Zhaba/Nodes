import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { 
  Mail, Send, Bell, CalendarDays, Activity, 
  Clock, Zap, ExternalLink, ChevronRight, 
  Key, Plus, Copy, Check, Trash2, AlertCircle 
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationsService } from "./api/integrationsService";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg?: string;
  imgSrc?: string;
  isPlanned?: boolean;
  onClick?: () => void;
}

function IntegrationCard({ 
  title, 
  description, 
  icon: Icon, 
  iconBg = "bg-primary/10", 
  imgSrc, 
  isPlanned = false,
  onClick
}: IntegrationCardProps) {
  const { t } = useTranslation();
  
  return (
    <div className={cn(
      "group relative p-5 rounded-3xl border border-border/40 bg-muted/5 hover:bg-muted/10 transition-all duration-300 flex flex-col gap-4",
      isPlanned && "opacity-80"
    )}>
      <div className="flex items-start justify-between">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center p-2.5 shadow-sm transition-transform group-hover:scale-110 duration-300",
          imgSrc ? "bg-white" : iconBg
        )}>
          {imgSrc ? (
            <img src={imgSrc} alt={title} className="w-full h-full object-contain" />
          ) : (
            <Icon className="w-full h-full text-primary" />
          )}
        </div>
        
        {isPlanned ? (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            {t("profile.integrations.planned", "В планах")}
          </span>
        ) : (
          <Button 
            type="button"
            variant="ghost" 
            size="icon" 
            className="rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onClick}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-base flex items-center gap-2">
          {title}
          {!isPlanned && <ExternalLink className="w-3 h-3 opacity-40" />}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-auto pt-2">
        <Button 
          type="button"
          variant={isPlanned ? "secondary" : "outline"} 
          className="w-full rounded-xl text-xs h-9 font-medium border-border/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
          disabled={isPlanned}
          onClick={onClick}
        >
          {isPlanned ? t("profile.integrations.soon", "Скоро") : t("profile.integrations.manage", "Управление")}
        </Button>
      </div>
    </div>
  );
}

export function IntegrationsTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPro } = useSubscription(user?.id);
  const queryClient = useQueryClient();
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => integrationsService.getApiKeys(),
    enabled: isPro && showApiKeys
  });
  const createKeyMutation = useMutation({
    mutationFn: (name: string) => integrationsService.createApiKey(name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      setNewKeySecret(data.api_key);
      toast.success(t("profile.integrations.api.created", "API ключ успешно создан"));
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => integrationsService.deleteApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success(t("profile.integrations.api.deleted_success", "API ключ успешно удален"));
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t("common.copied", "Скопировано"));
  };
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 sm:p-8 shadow-xl">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t("profile.integrations.title", "Интеграции")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("profile.integrations.subtitle", "Связь Второго мозга с внешним миром.")}</p>
          </div>
          {showApiKeys && (
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => setShowApiKeys(false)}
              className="text-xs rounded-xl"
            >
              {t("common.back", "Назад")}
            </Button>
          )}
        </div>
        
        <AnimatePresence mode="wait">
          {!showApiKeys ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <IntegrationCard 
                title="Google Calendar"
                description={t("profile.integrations.gcalDesc", "Двусторонняя синхронизация Импульсов и событий.")}
                icon={CalendarDays}
                iconBg="bg-[#4285F4]/10"
                isPlanned
              />
              
              <IntegrationCard 
                title="Telegram Bot"
                description={t("profile.integrations.telegramDesc", "Быстрая отметка импульсов и уведомления через мессенджер.")}
                icon={Send}
                iconBg="bg-[#26A5E4]/10"
                isPlanned
              />

              <IntegrationCard 
                title={t("profile.integrations.emailTitle", "Email Рассылки")}
                description={t("profile.integrations.emailDesc", "Еженедельные отчеты о стабильности и напоминания на почту.")}
                icon={Mail}
                iconBg="bg-amber-500/10"
                isPlanned
              />

              <IntegrationCard 
                title={t("profile.integrations.webPushTitle", "Browser Notifications")}
                description={t("profile.integrations.webPushDesc", "Мгновенные уведомления о необходимости запустить импульс.")}
                icon={Bell}
                iconBg="bg-rose-500/10"
                isPlanned
              />

              <IntegrationCard 
                title="Apple / Google Health"
                description={t("profile.integrations.healthDesc", "Автоматические импульсы на основе физической активности.")}
                icon={Activity}
                iconBg="bg-emerald-500/10"
                isPlanned
              />

              <IntegrationCard 
                title="API / Webhooks"
                description={t("profile.integrations.apiDesc", "Для разработчиков: программное управление вашими узлами.")}
                icon={Clock}
                iconBg="bg-indigo-500/10"
                onClick={() => setShowApiKeys(true)}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="api-keys"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {!isPro ? (
                <div className="p-12 border-2 border-dashed border-border/40 rounded-[2rem] flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">{t("profile.integrations.api.proOnly", "Доступно только в Pro")}</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      {t("profile.integrations.api.proDesc", "Генерация API ключей доступна пользователям с активной подпиской Nodes Pro.")}
                    </p>
                  </div>
                  <Button type="button" variant="default" className="rounded-2xl px-8 font-bold">
                    {t("profile.subscription.upgrade", "Перейти на Pro")}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Key className="w-5 h-5 text-primary" />
                      {t("profile.integrations.api.keysList", "Ваши API ключи")}
                    </h3>
                    <Button 
                      type="button"
                      onClick={() => createKeyMutation.mutate(t("profile.integrations.api.defaultName", "Мой ключ"))}
                      disabled={createKeyMutation.isPending}
                      className="rounded-xl h-9 text-xs gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t("profile.integrations.api.generate", "Создать ключ")}
                    </Button>
                  </div>

                  {newKeySecret && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-primary/5 border border-primary/20 rounded-2xl space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-primary uppercase tracking-wider">
                            {t("profile.integrations.api.saveKey", "Сохраните этот ключ")}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {t("profile.integrations.api.saveKeyDesc", "Он будет показан только один раз. После закрытия страницы восстановить его будет невозможно.")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-background/50 border border-border/40 rounded-xl p-3">
                        <code className="text-xs font-mono flex-1 break-all select-all">
                          {newKeySecret}
                        </code>
                        <Button 
                          type="button"
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleCopy(newKeySecret)}
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] h-6 px-2 ml-auto block"
                        onClick={() => setNewKeySecret(null)}
                      >
                        {t("common.close", "Закрыть")}
                      </Button>
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    {isLoading ? (
                      <div className="h-20 animate-pulse bg-muted/20 rounded-2xl" />
                    ) : apiKeys?.length === 0 ? (
                      <div className="p-8 border border-dashed border-border/40 rounded-2xl text-center">
                        <p className="text-xs text-muted-foreground">{t("profile.integrations.api.noKeys", "У вас пока нет активных ключей.")}</p>
                      </div>
                    ) : (
                      apiKeys?.map((key) => (
                        <div 
                          key={key.id}
                          className="p-4 bg-muted/5 border border-border/40 rounded-2xl flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Key className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{key.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {key.last_used_at 
                                  ? `${t("profile.integrations.api.lastUsed", "Использован")}: ${new Date(key.last_used_at).toLocaleDateString()}`
                                  : t("profile.integrations.api.neverUsed", "Никогда не использовался")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                              onClick={() => {
                                if (window.confirm(t("profile.integrations.api.deleteConfirm", "Вы уверены, что хотите удалить этот API ключ?"))) {
                                  deleteKeyMutation.mutate(key.id);
                                }
                              }}
                              disabled={deleteKeyMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!showApiKeys && (
        <div className="p-6 rounded-[2rem] border border-dashed border-border/60 bg-muted/5 flex flex-col items-center text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Zap className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm">{t("profile.integrations.suggestTitle", "Есть идея для интеграции?")}</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {t("profile.integrations.suggestDesc", "Мы постоянно расширяем возможности связи. Напишите нам, что бы вы хотели видеть.")}
            </p>
          </div>
          <Button type="button" variant="link" className="text-primary text-xs font-bold uppercase tracking-widest">
            {t("profile.integrations.suggestButton", "Предложить идею")}
          </Button>
        </div>
      )}
    </div>
  );
}
