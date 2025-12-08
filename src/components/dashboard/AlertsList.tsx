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
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card p-6">
        <p className="text-muted-foreground">هیچ ئاگادارکردنەوەیەک نییە ✓</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => {
        const styles = typeStyles[alert.type];
        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-center gap-4 rounded-lg border p-4 transition-all duration-300 animate-slide-up",
              styles.bg,
              styles.border
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn("rounded-lg p-2", styles.bg)}>
              <alert.icon className={cn("h-5 w-5", styles.icon)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{alert.title}</p>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
            </div>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium shrink-0", styles.badge)}>
              {styles.badgeText}
            </span>
          </div>
        );
      })}
    </div>
  );
}
