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
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full bg-primary/20" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 bg-primary/20" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full bg-primary/20" />
                </div>
              </div>
            </div>
            <Skeleton className="w-8 h-8 rounded-full bg-primary/20 shrink-0" />
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
        <div className="p-4 pt-0 mt-auto">
          <Skeleton className="h-12 w-full rounded-xl bg-primary/20 shadow-sm" />
        </div>
      </Card>
    </div>
  );
}
