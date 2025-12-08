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
    iconBg: 'bg-gradient-to-br from-primary/20 to-primary/5',
    iconColor: 'text-primary',
    border: 'border-border hover:border-primary/30',
    glow: 'hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.2)]',
  },
  success: {
    bg: 'bg-card',
    iconBg: 'bg-gradient-to-br from-success/20 to-success/5',
    iconColor: 'text-success',
    border: 'border-success/20 hover:border-success/40',
    glow: 'hover:shadow-[0_0_20px_-5px_hsl(var(--success)/0.2)]',
  },
  warning: {
    bg: 'bg-card',
    iconBg: 'bg-gradient-to-br from-warning/20 to-warning/5',
    iconColor: 'text-warning',
    border: 'border-warning/20 hover:border-warning/40',
    glow: 'hover:shadow-[0_0_20px_-5px_hsl(var(--warning)/0.2)]',
  },
  danger: {
    bg: 'bg-card',
    iconBg: 'bg-gradient-to-br from-destructive/20 to-destructive/5',
    iconColor: 'text-destructive',
    border: 'border-destructive/20 hover:border-destructive/40',
    glow: 'hover:shadow-[0_0_20px_-5px_hsl(var(--destructive)/0.2)]',
  },
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default', delay = 0 }: StatCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl sm:rounded-2xl border p-4 sm:p-5 lg:p-6",
        "shadow-sm hover:shadow-lg transition-all duration-300 ease-out",
        "transform hover:-translate-y-0.5 animate-slide-up",
        styles.bg,
        styles.border,
        styles.glow
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/20 pointer-events-none" />
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2 sm:space-y-3 min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground/80 truncate">
            {title}
          </p>
          <p className={cn(
            "text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight number-display",
            variant === 'success' && 'text-success',
            variant === 'warning' && 'text-warning',
            variant === 'danger' && 'text-destructive',
            variant === 'default' && 'text-foreground'
          )}>
            {value}
          </p>
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
              trend.isPositive 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}>
              <span className="text-sm">{trend.isPositive ? '↑' : '↓'}</span>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        
        {/* Icon container with enhanced styling */}
        <div className={cn(
          "shrink-0 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 lg:p-4",
          "transition-transform duration-300 hover:scale-105",
          "shadow-sm",
          styles.iconBg
        )}>
          <Icon className={cn(
            "h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 transition-all duration-300",
            styles.iconColor
          )} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}