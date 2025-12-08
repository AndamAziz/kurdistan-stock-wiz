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
        "relative overflow-hidden rounded-2xl border-2 p-4 sm:p-5 lg:p-6",
        "shadow-card hover:shadow-lg transition-all duration-300 ease-out",
        "transform hover:-translate-y-1 animate-slide-up",
        styles.bg
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Decorative background pattern */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-current" />
      </div>
      
      <div className="relative flex items-start justify-between gap-3">
        {/* Icon - positioned on the right for RTL */}
        <div className={cn(
          "shrink-0 rounded-xl p-3 lg:p-4",
          "transition-transform duration-300 hover:scale-110",
          "shadow-sm",
          styles.iconBg
        )}>
          <Icon className={cn(
            "h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7",
            styles.iconColor
          )} strokeWidth={2.5} />
        </div>
        
        {/* Content */}
        <div className="flex-1 text-left space-y-1.5 sm:space-y-2">
          <p className={cn(
            "text-xs sm:text-sm font-semibold truncate",
            styles.titleColor
          )}>
            {title}
          </p>
          <p className={cn(
            "text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight",
            "drop-shadow-sm",
            styles.valueColor
          )}
          style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {value}
          </p>
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
              trend.isPositive 
                ? "bg-success/15 text-success" 
                : "bg-destructive/15 text-destructive"
            )}>
              <span className="text-sm">{trend.isPositive ? '↑' : '↓'}</span>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}