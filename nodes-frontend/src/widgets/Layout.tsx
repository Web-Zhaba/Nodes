import { Link, useLocation, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Share2, BarChart3, User } from "lucide-react";
import { FloatingNavbar } from "@/components/ui/floating-navbar";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useProfileQuery } from "@/features/profile/hooks/useProfileQuery";
import { useAppStore } from "@/store/useAppStore";
import { useEffect } from "react";
import { AppFooter } from "@/components/AppFooter";
import { OnboardingWizard } from "@/features/onboarding/components/OnboardingWizard";

export default function Layout() {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile } = useProfileQuery(user?.id);
  const setLanguage = useAppStore((state) => state.setLanguage);

  // Sync language from profile on load
  useEffect(() => {
    if (profile?.language) {
      setLanguage(profile.language);
    }
  }, [profile?.language, setLanguage]);

  const navItems = [
    { path: "/", label: t("nav.dashboard", "Сегодня"), icon: Home },
    { path: "/graph", label: t("nav.graph", "Граф"), icon: Share2 },
    { path: "/analytics", label: t("nav.analytics", "Аналитика"), icon: BarChart3 },
    { path: "/profile", label: t("nav.profile", "Профиль"), icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0 transition-colors duration-300">

      {/* Desktop & Mobile Top Navbar */}
      <FloatingNavbar />

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-4 left-0 right-0 z-50 md:hidden px-4 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <div className="pointer-events-auto w-full max-w-sm flex items-center justify-between p-1 bg-background/40 backdrop-blur-xl border border-border/40 rounded-full shadow-lg gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/nodes');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative group flex flex-col items-center justify-center flex-1 h-14 rounded-full transition-colors duration-300",
                  isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] border border-primary/30 rounded-full opacity-90"
                    transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.8 }}
                    style={{ zIndex: 0 }}
                  />
                )}
                <Icon className={cn("relative z-10 w-5 h-5 transition-transform duration-300", isActive ? "-translate-y-1" : "")} />
                <span className={cn(
                  "relative z-10 text-[10px] font-bold tracking-tight transition-all duration-300",
                  isActive ? "opacity-100 translate-y-0.5" : "opacity-0 absolute translate-y-4 pointer-events-none"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-7xl px-4 pt-[max(env(safe-area-inset-top),8px)] md:pt-24 pb-6 md:pb-6">
        <Outlet />
      </main>

      <OnboardingWizard />

      {/* Footer */}
      <AppFooter className="hidden md:block mt-auto" />
    </div>
  );
}
