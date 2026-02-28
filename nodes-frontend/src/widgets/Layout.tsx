import { Link, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { Home, Share2, BarChart3, User } from "lucide-react";

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Сегодня", icon: Home },
    { path: "/graph", label: "Сеть", icon: Share2 },
    { path: "/analytics", label: "Аналитика", icon: BarChart3 },
    { path: "/profile", label: "Профиль", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
            <span className="font-bold text-xl tracking-tighter">NODES</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.filter(i => i.path !== '/profile').map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-sm font-semibold transition-all hover:text-primary relative py-1",
                  location.pathname === item.path
                    ? "text-foreground after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <Link to="/profile" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors border border-white/5">
              <User className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 backdrop-blur-xl border-t border-white/5 md:hidden px-4 safe-area-bottom">
        <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/30 group transition-colors"
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/20 text-primary scale-110" : "text-muted-foreground group-hover:text-primary"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-[10px] mt-1 font-bold tracking-tight transition-colors",
                  isActive ? "text-primary opacity-100" : "text-muted-foreground opacity-70 group-hover:text-primary"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="hidden md:block border-t py-6 mt-auto">
        <div className="container mx-auto max-w-7xl px-4 text-center text-[10px] sm:text-sm text-muted-foreground font-medium tracking-wide">
          <span className="font-bold">NODES</span> — Трекер жизни нового поколения
        </div>
      </footer>
    </div>
  );
}
