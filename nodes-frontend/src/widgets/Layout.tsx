import { Link, useLocation, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Share2, BarChart3, User, Github, Twitter } from "lucide-react";
import { FloatingNavbar } from "@/components/ui/floating-navbar";

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Сегодня", icon: Home },
    { path: "/graph", label: "Сеть", icon: Share2 },
    { path: "/analytics", label: "Аналитика", icon: BarChart3 },
    { path: "/profile", label: "Профиль", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0 transition-colors duration-300">
      
      {/* Desktop & Mobile Top Navbar */}
      <FloatingNavbar />

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 backdrop-blur-xl border-t border-border/40 md:hidden px-4 mb-[env(safe-area-inset-bottom)]">
        <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/nodes');
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
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-7xl px-4 pt-24 pb-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="hidden md:block border-t border-border/40 py-6 mt-auto transition-colors duration-300">
        <div className="container mx-auto max-w-7xl px-4 flex items-center justify-between text-muted-foreground opacity-70 hover:opacity-100 transition-opacity">
          <div className="text-[10px] sm:text-xs font-medium tracking-widest uppercase flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            NODES — System Online
          </div>
          <div className="flex items-center space-x-5">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground hover:scale-110 transition-all" title="GitHub">
              <Github className="w-4 h-4" />
              <span className="sr-only">GitHub</span>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-foreground hover:scale-110 transition-all" title="X (Twitter)">
              <Twitter className="w-4 h-4" />
              <span className="sr-only">Twitter</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
