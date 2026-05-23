import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Check, Zap, Palette, BarChart3, Download, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { SUBSCRIPTION_PACKAGES, type SubscriptionPackageId } from '../types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Какая фича инициировала открытие — меняет заголовок */
  triggerFeature?: 'themes' | 'analytics_history' | 'export' | 'nodes_limit' | 'cores_limit' | 'default'
}

const FEATURE_ICONS = {
  themes: Palette,
  analytics_history: BarChart3,
  export: Download,
  nodes_limit: Zap,
  cores_limit: Zap,
  default: Sparkles,
}

export const UpgradeModal = ({ open, onOpenChange, triggerFeature = 'default' }: UpgradeModalProps) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackageId>('1m')
  const TriggerIcon = FEATURE_ICONS[triggerFeature]

  // Перемещаем PRO_FEATURES внутрь компонента, чтобы t() работала корректно
  const PRO_FEATURES = [
    { icon: Zap,        key: 'nodes',     label: t('profile.pro.features.nodes') },
    { icon: Palette,    key: 'themes',    label: t('profile.pro.features.themes') },
    { icon: BarChart3,  key: 'analytics', label: t('profile.pro.features.analytics') },
    { icon: Download,   key: 'export',    label: t('profile.pro.features.export') },
  ]

  const getTriggerText = () => {
    switch (triggerFeature) {
      case 'themes':            return t('subscription.upgrade.trigger.themes')
      case 'analytics_history': return t('subscription.upgrade.trigger.analytics_history')
      case 'export':            return t('subscription.upgrade.trigger.export')
      case 'nodes_limit':       return t('subscription.limit.nodes')
      case 'cores_limit':       return t('subscription.limit.cores')
      default:                  return t('subscription.upgrade.title')
    }
  }

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error(t('subscription.upgrade.errors.login'))
        return
      }

      const apiUrl = import.meta.env.VITE_DJANGO_API_URL || ''
      const response = await fetch(`${apiUrl}/payments/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          package_id: selectedPackage
        })
      })

      const data = await response.json()

      if (data.confirmation_url) {
        window.location.href = data.confirmation_url
      } else {
        throw new Error(data.message || t('subscription.upgrade.errors.init'))
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      toast.error(t('subscription.upgrade.errors.init'), {
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[2.5rem] border border-primary/20 bg-background/95 backdrop-blur-xl p-0 overflow-hidden shadow-2xl">
        {/* Gradient header */}
        <div className="relative px-8 pt-10 pb-6 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary)_0%,transparent_60%)] opacity-20" />
          <DialogHeader className="relative z-10 items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4 shadow-[0_10px_40px_rgba(var(--primary),0.3)] animate-pulse">
              <TriggerIcon className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {getTriggerText()}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
              {t('subscription.upgrade.description')}
            </p>
          </DialogHeader>
        </div>

        <div className="px-8 py-4 space-y-6">
          {/* Package Selection */}
          <div className="grid grid-cols-2 gap-3">
            {SUBSCRIPTION_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={cn(
                  "relative p-4 rounded-2xl border-2 transition-all duration-300 text-left group",
                  selectedPackage === pkg.id
                    ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                    : "border-border/40 hover:border-primary/30 bg-muted/20"
                )}
              >
                {pkg.discount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    -{pkg.discount}%
                  </div>
                )}
                <p className={cn(
                  "text-xs font-bold uppercase tracking-widest mb-1",
                  selectedPackage === pkg.id ? "text-primary" : "text-muted-foreground"
                )}>
                  {t(`subscription.upgrade.packages.${pkg.id}`)}
                </p>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-bold">{pkg.price}</span>
                  <span className="text-xs font-medium text-muted-foreground">₽</span>
                </div>
              </button>
            ))}
          </div>

          {/* Features list */}
          <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-border/20">
            {PRO_FEATURES.map(({ icon: Icon, key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-3 h-3 text-primary" />
                </div>
                <span className="text-[13px] font-medium opacity-90">{label}</span>
                <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Pricing + CTA */}
        <div className="px-8 pb-10 pt-2 space-y-4">
          <Button
            className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-primary"
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t('subscription.upgrade.processing')}</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {t('subscription.upgrade.button')}
              </>
            )}
          </Button>

          <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1.5 opacity-60">
            <Percent className="w-3 h-3" />
            {t('subscription.upgrade.footer')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
