import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  delay?: number;
}

const variantStyles = {
  default: {
    bg: 'bg-card',
    icon: 'bg-primary/10 text-primary',
    border: 'border-border',
  },
  success: {
    bg: 'bg-card',
    icon: 'bg-success/10 text-success',
    border: 'border-success/20',
  },
  warning: {
    bg: 'bg-card',
    icon: 'bg-warning/10 text-warning',
    border: 'border-warning/20',
  },
  danger: {
    bg: 'bg-card',
    icon: 'bg-destructive/10 text-destructive',
    border: 'border-destructive/20',
  },
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default', delay = 0 }: StatCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <div
      className={cn(
        "rounded-lg sm:rounded-xl border p-3 sm:p-4 lg:p-6 shadow-card card-hover animate-slide-up",
        styles.bg,
        styles.border
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-card-foreground">{value}</p>
          {trend && (
            <p className={cn(
              "text-[10px] sm:text-xs font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={cn("rounded-lg p-2 sm:p-2.5 lg:p-3 shrink-0", styles.icon)}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
        </div>
      </div>
    </div>
  );
}
