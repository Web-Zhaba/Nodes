import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/features/subscription/hooks/useSubscription'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Check, Zap, Palette, BarChart3, Download, Clock, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { UpgradeModal } from '@/features/subscription/components/UpgradeModal'
import { format } from 'date-fns'
import { ru, enUS } from 'date-fns/locale'
import { useQueryClient } from '@tanstack/react-query'

export function SubscriptionTab() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { isPro, expiresAt, isLoading } = useSubscription(user?.id)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Принудительно инвалидируем кэш при заходе на вкладку, 
  // чтобы пользователь сразу увидел результат оплаты
  useEffect(() => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['subscription', user.id] })
    }
  }, [user?.id, queryClient])

  const dateLocale = i18n.language === 'ru' ? ru : enUS
  const formattedDate = expiresAt 
    ? format(new Date(expiresAt), 'd MMMM yyyy', { locale: dateLocale })
    : ''

  const PRO_BENEFITS = [
    { icon: Zap,        label: t('profile.pro.features.nodes') },
    { icon: Star,       label: t('profile.pro.features.cores') },
    { icon: BarChart3,  label: t('profile.pro.features.analytics') },
    { icon: Download,   label: t('profile.pro.features.export') },
    { icon: Palette,    label: t('profile.pro.features.themes') },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Current Status Card */}
      <div className="relative overflow-hidden bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Zap className="w-32 h-32 text-primary" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                {isPro ? t('profile.pro.planName') : 'Nodes Free'}
              </h2>
              {isPro && (
                <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  Pro
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {isPro 
                ? t('profile.pro.active')
                : t('subscription.upgrade.description')
              }
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            {isPro && expiresAt && (
              <div className="flex items-center gap-2 text-sm font-medium bg-primary/5 border border-primary/10 px-4 py-2 rounded-xl">
                <Clock className="w-4 h-4 text-primary" />
                <span>{t('profile.pro.expiresAt', { date: formattedDate })}</span>
              </div>
            )}
            <Button 
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isPro ? t('profile.pro.extend', 'Продлить подписку') : t('profile.pro.upgrade')}
            </Button>
          </div>
        </div>
      </div>

      {/* Features Comparison */}
      <div className="bg-background/40 backdrop-blur-xl border border-border/40 rounded-[2rem] p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold">{isPro ? t('profile.pro.planName') : t('subscription.upgrade.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('profile.pro.price')}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PRO_BENEFITS.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:border-primary/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <benefit.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">{benefit.label}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-primary font-bold uppercase tracking-tighter">
                  <Check className="w-3 h-3" />
                  {isPro ? 'Included' : 'Pro Feature'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isPro && (
          <Button 
            type="button"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="w-full h-12 rounded-xl border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-primary font-bold transition-all"
          >
            {t('subscription.upgrade.button')}
          </Button>
        )}
      </div>

      <UpgradeModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
