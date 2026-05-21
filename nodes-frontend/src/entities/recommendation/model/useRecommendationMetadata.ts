import { Video, Book, FileText, GraduationCap, Github, Code, Newspaper, ShoppingCart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Recommendation } from "@/types";

export const useRecommendationMetadata = (content_type: Recommendation["content_type"], source: string) => {
  const Icon = ({
    video: Video,
    book: Book,
    article: FileText,
    course: GraduationCap,
  } as Record<string, LucideIcon>)[content_type] || FileText;

  // Специфические иконки и цвета для источников
  const sourceMeta = ({
    YouTube: { icon: Video, color: "#FF0000" },
    "Google Books": { icon: Book, color: "#4285F4" },
    GitHub: { icon: Github, color: "#ffffff" },
    Habr: { icon: Code, color: "#65a3be" },
    Stepik: { icon: GraduationCap, color: "#32cd32" },
    Admitad: { icon: ShoppingCart, color: "#ff4500" },
  } as Record<string, { icon: LucideIcon; color: string }>)[source] || { icon: Newspaper, color: "#888888" };

  return { Icon, sourceMeta };
};
