import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NodeCardSkeletonProps {
  className?: string;
}

export function NodeCardSkeleton({ className }: NodeCardSkeletonProps) {
  return (
    <div className={cn("w-full max-w-md relative", className)}>
      <Card className="relative h-full flex flex-col bg-background/95 overflow-hidden border border-white/10 shadow-sm min-h-[220px]">
        <CardContent className="p-4 flex-1 mt-2 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Skeleton className="w-6 h-6 rounded-md bg-primary/20" />
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-5 w-3/4 bg-primary/20" />
              <div className="flex gap-1.5 mt-1.5">
                <Skeleton className="h-3 w-16 rounded-full bg-primary/20" />
                <Skeleton className="h-3 w-12 rounded-full bg-primary/20" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-full bg-primary/10" />
            <Skeleton className="h-3 w-4/5 bg-primary/10" />
          </div>

          {/* Stability Bar */}
          <div className="pt-2 space-y-2">
            <Skeleton className="h-3 w-16 bg-primary/20" />
            <Skeleton className="h-1.5 w-full bg-primary/20" />
          </div>
        </CardContent>

        {/* Controls block */}
        <div className="p-4 bg-gradient-to-t from-muted/20 to-transparent border-t border-muted/30 mt-auto min-h-[80px] flex items-center">
          <Skeleton className="h-12 w-full rounded-xl bg-primary/20 shadow-sm" />
        </div>
      </Card>
    </div>
  );
}
