import { cn } from "@/lib/utils";
import { AlertTriangle, PackageX, Clock } from "lucide-react";

interface AlertItem {
  id: string;
  name: string;
  expDate: string;
  quantity: number;
  minStock: number;
}

interface AlertsListProps {
  expiredItems: AlertItem[];
  lowStockItems: AlertItem[];
  soonToExpire: AlertItem[];
}

export function AlertsList({ expiredItems, lowStockItems, soonToExpire }: AlertsListProps) {
  const alerts = [
    ...expiredItems.map(item => ({
      id: `exp-${item.id}`,
      type: 'expired' as const,
      title: item.name,
      message: `بەسەرچووە لە ${item.expDate ? new Date(item.expDate).toLocaleDateString('ku') : '-'}`,
      icon: AlertTriangle,
    })),
    ...lowStockItems.map(item => ({
      id: `low-${item.id}`,
      type: 'lowStock' as const,
      title: item.name,
      message: `تەنها ${item.quantity} ماوە (کەمترین: ${item.minStock})`,
      icon: PackageX,
    })),
    ...soonToExpire.map(item => ({
      id: `soon-${item.id}`,
      type: 'soonExpire' as const,
      title: item.name,
      message: `دەبەسەرچێت لە ${item.expDate ? new Date(item.expDate).toLocaleDateString('ku') : '-'}`,
      icon: Clock,
    })),
  ].slice(0, 8);

  const typeStyles = {
    expired: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/20',
      icon: 'text-destructive',
      badge: 'bg-destructive text-destructive-foreground',
      badgeText: 'بەسەرچوو',
    },
    lowStock: {
      bg: 'bg-warning/10',
      border: 'border-warning/20',
      icon: 'text-warning',
      badge: 'bg-warning text-warning-foreground',
      badgeText: 'کەم ستۆک',
    },
    soonExpire: {
      bg: 'bg-accent/10',
      border: 'border-accent/20',
      icon: 'text-accent',
      badge: 'bg-accent text-accent-foreground',
      badgeText: 'نزیک بەسەرچوون',
    },
  };

  if (alerts.length === 0) {
    return (
      <div className="flex h-32 sm:h-40 lg:h-48 items-center justify-center rounded-lg sm:rounded-xl border border-border bg-card p-4 sm:p-6">
        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">هیچ ئاگادارکردنەوەیەک نییە ✓</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {alerts.map((alert, index) => {
        const styles = typeStyles[alert.type];
        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-center gap-2 sm:gap-3 lg:gap-4 rounded-lg border p-2.5 sm:p-3 lg:p-4 transition-all duration-300 animate-slide-up",
              styles.bg,
              styles.border
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn("rounded-md sm:rounded-lg p-1.5 sm:p-2", styles.bg)}>
              <alert.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5", styles.icon)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm lg:text-base font-medium text-foreground truncate">{alert.title}</p>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate">{alert.message}</p>
            </div>
            <span className={cn("rounded-full px-1.5 sm:px-2 lg:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] lg:text-xs font-medium shrink-0 hidden xs:inline-flex", styles.badge)}>
              {styles.badgeText}
            </span>
          </div>
        );
      })}
    </div>
  );
}
