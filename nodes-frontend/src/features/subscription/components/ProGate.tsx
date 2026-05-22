import { useState, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { UpgradeModal } from './UpgradeModal'
import { useSubscription } from '../hooks/useSubscription'
import { useAuth } from '@/hooks/useAuth'
import type { ProFeature } from '../types'

interface ProGateProps {
  /** Какая фича защищена */
  feature: ProFeature
  /** Контент, который нужно показать Pro-пользователям */
  children: ReactNode
  /** Если true — дочерний элемент рендерится, но покрыт оверлеем (blur + замочек).
   *  Если false — вместо children рендерится заглушка. По умолчанию true. */
  overlay?: boolean
  /** Дополнительные классы для wrapper-div */
  className?: string
}

/**
 * ProGate — обёртка над любым UI-элементом.
 * Для Pro-пользователей: рендерит children как есть.
 * Для Free-пользователей: показывает blur-оверлей с замочком → клик открывает UpgradeModal.
 */
export const ProGate = ({ feature, children, overlay = true, className = '' }: ProGateProps) => {
  const { user } = useAuth()
  const { isPro, isLoading } = useSubscription(user?.id)
  const [modalOpen, setModalOpen] = useState(false)

  // Пока грузится статус — показываем детей, но блокируем взаимодействие (защита от "быстрых кликов")
  if (isLoading) {
    return (
      <div className={`opacity-50 pointer-events-none ${className}`}>
        {children}
      </div>
    )
  }

  if (isPro) return <>{children}</>

  if (!overlay) {
    // Режим без оверлея: рендерим заглушку вместо children
    return (
      <>
        <div
          onClick={() => setModalOpen(true)}
          className={`relative flex items-center gap-2 opacity-50 cursor-pointer hover:opacity-70 transition-opacity ${className}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
          aria-label="Доступно в Pro"
        >
          <div className="pointer-events-none flex gap-2">
            {children}
          </div>
          <Lock className="w-3.5 h-3.5 shrink-0" />
        </div>
        <UpgradeModal open={modalOpen} onOpenChange={setModalOpen} triggerFeature={feature} />
      </>
    )
  }

  // Режим с оверлеем: children рендерится, но недоступен
  return (
    <>
      <div
        className={`relative group ${className}`}
        onClick={() => setModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
        aria-label="Доступно в Pro — нажмите для подробностей"
      >
        {/* Контент размыт и недоступен для взаимодействия */}
        <div className="pointer-events-none select-none blur-[2px] opacity-60 transition-all duration-200 group-hover:blur-[3px]">
          {children}
        </div>

        {/* Оверлей с замочком */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer">
          <div className="bg-background/80 backdrop-blur-md border border-primary/30 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg shadow-primary/10 transition-transform duration-200 group-hover:scale-105">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary">Pro</span>
          </div>
        </div>
      </div>

      <UpgradeModal open={modalOpen} onOpenChange={setModalOpen} triggerFeature={feature} />
    </>
  )
}
