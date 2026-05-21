import { useAnalyticsStore } from '../../../store/useAnalyticsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Globe } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function GlobalControlBar() {
  const { t } = useTranslation();
  const { focusEntity, clearFocus, nodes, error } = useAnalyticsStore();

  // Find the focused node to display its name
  const focusedNode = focusEntity?.type === 'node' 
    ? nodes.find(n => n.id === focusEntity.id) 
    : null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
        {/* Current Context Indicator / Reset Button */}
        <button 
          onClick={focusedNode ? clearFocus : undefined}
          className={cn(
            "flex items-center gap-2 text-xs sm:text-sm px-4 py-2 rounded-xl border transition-all truncate max-w-[200px] sm:max-w-none",
            focusedNode 
              ? "bg-primary/10 border-primary/30 text-primary cursor-pointer hover:bg-primary/20 hover:border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]" 
              : "bg-muted/30 border-border/50 text-muted-foreground cursor-default"
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={focusedNode ? 'x' : 'globe'}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="shrink-0"
            >
              {focusedNode ? <X className="w-3.5 h-3.5 sm:w-4 h-4" /> : <Globe className="w-3.5 h-3.5 sm:w-4 h-4" />}
            </motion.div>
          </AnimatePresence>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={focusedNode ? focusedNode.id : 'global'}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="truncate font-bold tracking-tight"
            >
              {focusedNode ? (
                <span className="flex items-center gap-1.5 sm:gap-2 truncate">
                  <span className="hidden xs:inline">{t("analytics.focus")}</span> <span style={{ color: focusedNode.color ?? undefined }} className="truncate">{focusedNode.name}</span>
                </span>
              ) : (
                <span>{t("analytics.allNodes")}</span>
              )}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {error && (
          <span className="text-xs sm:text-sm text-destructive bg-destructive/10 px-3 py-1.5 rounded-md border border-destructive/20 w-full sm:w-auto text-center">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
