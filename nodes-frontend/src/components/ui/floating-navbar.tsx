import * as React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Home, Share2, BarChart3, User } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavItem {
  icon: React.ElementType;
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home, href: '/', label: 'Сегодня' },
  { icon: Share2, href: '/graph', label: 'Сеть' },
  { icon: BarChart3, href: '/analytics', label: 'Аналитика' },
];

export function FloatingNavbar() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 sm:pt-6 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-5xl px-4 flex items-center justify-between gap-4">
        
        {/* Left Island: Logo */}
        <Link
          to="/"
          className="flex items-center justify-center h-10 md:h-12 px-4 bg-background/40 backdrop-blur-xl border border-border/40 rounded-2xl hover:bg-white/5 transition-colors shadow-sm shrink-0"
        >
          <span className="font-bold text-lg md:text-xl tracking-widest text-foreground">NODES</span>
        </Link>

        {/* Center Island: Primary Navigation */}
        <nav className="hidden md:flex items-center p-1 bg-background/40 backdrop-blur-xl border border-border/40 rounded-full shadow-sm text-foreground gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href || (item.href === '/' && location.pathname === '/nodes');

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'relative group flex items-center justify-center px-4 h-10 rounded-full transition-colors duration-300',
                  isActive
                    ? 'text-primary-foreground font-medium hover:-translate-y-0.5 transition-all duration-500'
                    : 'text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-primary/90 border border-primary/30 rounded-full shadow-md"
                    transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.8 }}
                    style={{ zIndex: 0 }}
                  />
                )}
                <item.icon className="relative z-10 w-4 h-4 mr-2" />
                <span className="relative z-10 text-sm font-semibold tracking-wide">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right Island: Theme & Profile */}
        <div className="flex items-center justify-center bg-background/40 backdrop-blur-xl border border-border/40 rounded-full p-1 shadow-sm h-10 md:h-12 px-2 gap-2 shrink-0">
          <ThemeToggle />
          <Link
            to="/profile"
            className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
            title="Профиль"
          >
            <User className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
          </Link>
        </div>

      </div>
    </header>
  );
}
