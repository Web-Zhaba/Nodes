import { Link } from "react-router-dom";
import { Github } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface AppFooterProps {
  className?: string;
}

/**
 * Общий футер приложения — используется и в Layout, и на публичных страницах.
 */
export function AppFooter({ className }: AppFooterProps) {
  const { t } = useTranslation();
  return (
    <footer
      className={cn(
        "border-t border-border/40 py-5 transition-colors duration-300",
        className
      )}
    >
      <div className="container mx-auto max-w-7xl px-6 flex items-center justify-between text-muted-foreground opacity-70 hover:opacity-100 transition-opacity">
        <div className="text-[10px] sm:text-xs font-medium tracking-widest uppercase flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {t("common.footer.systemOnline", { logo: t("common.logo") })}
        </div>
        <div className="flex items-center gap-5">
          <Link
            to="/privacy"
            className="text-[10px] font-bold uppercase tracking-widest hover:text-foreground transition-colors"
          >
            {t("legal.privacy.title", "Privacy")}
          </Link>
          <Link
            to="/terms"
            className="text-[10px] font-bold uppercase tracking-widest hover:text-foreground transition-colors"
          >
            {t("legal.terms.title", "Terms")}
          </Link>
          <a
            href="https://github.com/Web-Zhaba/Nodes"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground hover:scale-110 transition-all"
            title="GitHub"
          >
            <Github className="w-4 h-4" />
            <span className="sr-only">GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
