import { useAnalyticsStore } from '../../../store/useAnalyticsStore';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe } from 'lucide-react';

export function GlobalControlBar() {
  const { focusEntity, clearFocus, nodes, error } = useAnalyticsStore();

  // Find the focused node to display its name
  const focusedNode = focusEntity?.type === 'node' 
    ? nodes.find(n => n.id === focusEntity.id) 
    : null;

  return (
    <header className="flex justify-between items-center mb-8 h-12">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Аналитика</h1>
        
        {/* Separator */}
        <div className="h-6 w-px bg-border/50 hidden md:block"></div>

        {/* Current Context Indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md border border-border/50">
          <Globe className="w-4 h-4" />
          <AnimatePresence mode="popLayout">
            <motion.span
              key={focusedNode ? focusedNode.id : 'global'}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {focusedNode ? (
                <span className="flex items-center gap-2">
                  Фокус: <span style={{ color: focusedNode.color }} className="font-semibold">{focusedNode.name}</span>
                </span>
              ) : (
                <span>Глобальный вид (Все узлы)</span>
              )}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {error && (
          <span className="text-sm text-destructive bg-destructive/10 px-3 py-1.5 rounded-md border border-destructive/20">
            {error}
          </span>
        )}
        
        {/* Reset Button */}
        <AnimatePresence>
          {focusEntity && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={clearFocus}
                className="gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/10 text-primary transition-all shadow-[0_0_15px_rgba(var(--primary),0.1)]"
              >
                <X className="w-4 h-4" />
                Вернуться к обычному виду
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
