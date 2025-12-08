import { ItemWithRelations } from "@/hooks/useItems";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Package, Calendar, Scale, Tag, Building2, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface ItemDetailCardProps {
  item: ItemWithRelations;
  showFullDetails?: boolean;
}

export function ItemDetailCard({ item, showFullDetails = true }: ItemDetailCardProps) {
  const getExpiryStatus = () => {
    if (!item.exp_date) return null;
    
    const today = new Date();
    const expDate = new Date(item.exp_date);
    const daysUntilExpiry = differenceInDays(expDate, today);
    
    if (daysUntilExpiry < 0) {
      return { label: 'بەسەرچوو', variant: 'destructive' as const, days: daysUntilExpiry };
    }
    if (daysUntilExpiry <= 30) {
      return { label: `${daysUntilExpiry} ڕۆژ`, variant: 'warning' as const, days: daysUntilExpiry };
    }
    return { label: 'سەلامەت', variant: 'success' as const, days: daysUntilExpiry };
  };

  const expiryStatus = getExpiryStatus();

  const badgeVariants = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground">{item.name}</h3>
          <p className="text-sm text-muted-foreground font-mono">{item.barcode}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">براند</p>
            <p className="text-sm font-medium truncate">{item.brands?.name || "-"}</p>
          </div>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
          <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">هاوپۆل</p>
            <p className="text-sm font-medium truncate">{item.categories?.name || "-"}</p>
          </div>
        </div>

        {/* Unit/Weight */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
          <Scale className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">یەکە</p>
            <p className="text-sm font-medium">{item.unit}</p>
          </div>
        </div>

        {/* Current Stock */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5">
          <Package className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">ستۆکی ئێستا</p>
            <p className="text-sm font-semibold text-primary">{item.current_quantity}</p>
          </div>
        </div>
      </div>

      {/* Expiry Info */}
      {item.exp_date && (
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg",
          expiryStatus?.variant === 'destructive' && "bg-destructive/10",
          expiryStatus?.variant === 'warning' && "bg-warning/10",
          expiryStatus?.variant === 'success' && "bg-success/5",
        )}>
          <div className="flex items-center gap-2">
            {expiryStatus?.variant !== 'success' && (
              <AlertTriangle className={cn(
                "h-4 w-4",
                expiryStatus?.variant === 'destructive' && "text-destructive",
                expiryStatus?.variant === 'warning' && "text-warning",
              )} />
            )}
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">بەرواری بەسەرچوون:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{item.exp_date}</span>
            {expiryStatus && (
              <Badge 
                variant="outline" 
                className={cn("text-xs", badgeVariants[expiryStatus.variant])}
              >
                {expiryStatus.label}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Additional Details */}
      {showFullDetails && (
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
          {item.mfg_date && (
            <div className="flex justify-between">
              <span>بەرهەمهێنان:</span>
              <span>{item.mfg_date}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>کەمترین ستۆک:</span>
            <span>{item.min_stock}</span>
          </div>
          <div className="flex justify-between">
            <span>کۆی داخڵکراو:</span>
            <span className="text-success">{item.total_in}</span>
          </div>
          <div className="flex justify-between">
            <span>کۆی دەرکراو:</span>
            <span className="text-destructive">{item.total_out}</span>
          </div>
        </div>
      )}
    </div>
  );
}