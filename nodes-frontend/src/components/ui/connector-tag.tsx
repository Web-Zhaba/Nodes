import * as React from "react";
import { Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface ConnectorTagProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  color?: string;
  onRemove?: () => void;
  active?: boolean;
  interactive?: boolean;
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
}

export function ConnectorTag({
  name,
  color = "#8b5cf6",
  onRemove,
  active = true,
  interactive = false,
  variant = "solid",
  size = "md",
  className,
  ...props
}: ConnectorTagProps) {
  if (!active) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full text-xs font-medium cursor-pointer",
          "transition-all border-2 hover:scale-105 select-none",
          "bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/30",
          size === "md" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-[10px]",
          className
        )}
        {...props}
      >
        <Tag className={cn(size === "md" ? "h-3.5 w-3.5" : "h-2.5 w-2.5")} />
        #{name}
      </div>
    );
  }

  return (
    <Badge
      variant={variant === "solid" ? "secondary" : "outline"}
      className={cn(
        "flex items-center gap-1.5 h-auto font-medium transition-all select-none",
        variant === "ghost" && "bg-transparent border-transparent text-muted-foreground hover:text-foreground",
        size === "md" ? "px-3 py-1.5" : "px-1.5 py-0.5 text-[10px]",
        className
      )}
      style={{
        backgroundColor: variant === "solid" ? `${color}20` : undefined,
        border: variant !== "ghost" ? `2px solid ${color}${variant === "outline" ? "66" : ""}` : "none",
        color: variant === "ghost" ? undefined : color,
      }}
      {...props}
    >
      <Tag className={cn(size === "md" ? "h-3.5 w-3.5" : "h-2.5 w-2.5")} />
      #{name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
        >
          <X className={cn(size === "md" ? "h-3 w-3" : "h-2 w-2")} />
        </button>
      )}
    </Badge>
  );
}
