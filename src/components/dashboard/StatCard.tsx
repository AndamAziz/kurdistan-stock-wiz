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
    bg: 'bg-card border-border/60',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    valueColor: 'text-foreground',
    titleColor: 'text-muted-foreground',
  },
  success: {
    bg: 'bg-gradient-to-br from-success/10 to-success/5 border-success/30',
    iconBg: 'bg-success/20',
    iconColor: 'text-success',
    valueColor: 'text-success',
    titleColor: 'text-success/80',
  },
  warning: {
    bg: 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30',
    iconBg: 'bg-warning/20',
    iconColor: 'text-warning',
    valueColor: 'text-warning',
    titleColor: 'text-warning/80',
  },
  danger: {
    bg: 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/30',
    iconBg: 'bg-destructive/20',
    iconColor: 'text-destructive',
    valueColor: 'text-destructive',
    titleColor: 'text-destructive/80',
  },
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default', delay = 0 }: StatCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 p-3 sm:p-4 lg:p-5",
        "shadow-card hover:shadow-lg transition-all duration-300 ease-out",
        "transform hover:-translate-y-0.5 animate-slide-up",
        styles.bg
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Decorative background pattern */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-current" />
      </div>
      
      <div className="relative flex flex-col gap-2 sm:gap-3">
        {/* Header with icon and title */}
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            "text-[11px] sm:text-xs lg:text-sm font-bold tracking-wide",
            styles.titleColor
          )}>
            {title}
          </p>
          <div className={cn(
            "shrink-0 rounded-lg p-1.5 sm:p-2",
            "shadow-sm",
            styles.iconBg
          )}>
            <Icon className={cn(
              "h-4 w-4 sm:h-5 sm:w-5",
              styles.iconColor
            )} strokeWidth={2.5} />
          </div>
        </div>
        
        {/* Value - Large and prominent */}
        <p className={cn(
          "text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-right",
          "drop-shadow-sm leading-none",
          styles.valueColor
        )}
        style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
        </p>
        
        {trend && (
          <div className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold self-end",
            trend.isPositive 
              ? "bg-success/15 text-success" 
              : "bg-destructive/15 text-destructive"
          )}>
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
}