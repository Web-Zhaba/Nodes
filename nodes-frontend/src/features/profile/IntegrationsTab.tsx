import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import Mail from "lucide-react/dist/esm/icons/mail";
import Send from "lucide-react/dist/esm/icons/send";
import Bell from "lucide-react/dist/esm/icons/bell";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days";
import Activity from "lucide-react/dist/esm/icons/activity";
import Clock from "lucide-react/dist/esm/icons/clock";
import Zap from "lucide-react/dist/esm/icons/zap";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import { cn } from "@/lib/utils";

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg?: string;
  imgSrc?: string;
  isPlanned?: boolean;
}

function IntegrationCard({ 
  title, 
  description, 
  icon: Icon, 
  iconBg = "bg-primary/10", 
  imgSrc, 
  isPlanned = false 
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
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
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
          variant={isPlanned ? "secondary" : "outline"} 
          className="w-full rounded-xl text-xs h-9 font-medium border-border/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
          disabled={isPlanned}
        >
          {isPlanned ? t("profile.integrations.soon", "Скоро") : t("profile.integrations.connect", "Подключить")}
        </Button>
      </div>
    </div>
  );
}

export function IntegrationsTab() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 sm:p-8 shadow-xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">{t("profile.integrations.title", "Интеграции")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("profile.integrations.subtitle", "Связь Второго мозга с внешним миром.")}</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            isPlanned
          />
        </div>
      </div>

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
        <Button variant="link" className="text-primary text-xs font-bold uppercase tracking-widest">
          {t("profile.integrations.suggestButton", "Предложить идею")}
        </Button>
      </div>
    </div>
  );
}
