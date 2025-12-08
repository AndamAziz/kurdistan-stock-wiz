import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  threshold: number;
  isRefreshing: boolean;
}

export function PullToRefreshIndicator({ 
  pullDistance, 
  threshold, 
  isRefreshing 
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;
  const opacity = Math.min(progress * 1.5, 1);
  
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div 
      className="flex items-center justify-center transition-all duration-200 overflow-hidden"
      style={{ height: pullDistance || (isRefreshing ? 50 : 0) }}
    >
      <div 
        className={cn(
          "flex items-center justify-center rounded-full bg-primary/10 p-2",
          isRefreshing && "animate-spin"
        )}
        style={{ 
          opacity,
          transform: isRefreshing ? undefined : `rotate(${rotation}deg)`
        }}
      >
        <RefreshCw className="h-5 w-5 text-primary" />
      </div>
    </div>
  );
}
