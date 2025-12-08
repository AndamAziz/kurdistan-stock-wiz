import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Package, History } from "lucide-react";
import { ItemWithRelations } from "@/hooks/useItems";
import { StockHistoryDialog } from "./StockHistoryDialog";
import { ImagePreviewDialog } from "./ImagePreviewDialog";

interface MobileItemCardProps {
  item: ItemWithRelations;
  onView?: (item: ItemWithRelations) => void;
  index?: number;
}

const badgeVariants = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  default: 'bg-muted text-muted-foreground',
};

export function MobileItemCard({ item, onView, index = 0 }: MobileItemCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  const getStockStatus = () => {
    if (item.current_quantity === 0) {
      return { label: 'نەماوە', variant: 'destructive' as const };
    }
    if (item.current_quantity <= item.min_stock) {
      return { label: 'کەم', variant: 'warning' as const };
    }
    return { label: 'باش', variant: 'success' as const };
  };

  const getExpiryStatus = () => {
    if (!item.exp_date) return { label: '-', variant: 'default' as const };
    
    const today = new Date();
    const expDate = new Date(item.exp_date);
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { label: 'بەسەرچوو', variant: 'destructive' as const };
    }
    if (daysUntilExpiry <= 30) {
      return { label: `${daysUntilExpiry} ڕۆژ`, variant: 'warning' as const };
    }
    return { label: 'سەلامەت', variant: 'success' as const };
  };

  const stockStatus = getStockStatus();
  const expiryStatus = getExpiryStatus();

  return (
    <div 
      className="rounded-lg border border-border bg-card p-3 shadow-sm animate-fade-in active:scale-[0.98] transition-transform"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Item Image or Icon */}
        {item.image_url ? (
          <button
            type="button"
            onClick={() => setShowImagePreview(true)}
            className="h-12 w-12 rounded-lg overflow-hidden border border-border bg-muted shrink-0 hover:ring-2 hover:ring-primary/50 transition-all"
          >
            <img 
              src={item.image_url} 
              alt={item.name}
              className="h-full w-full object-cover"
            />
          </button>
        ) : (
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <Package className="h-5 w-5 text-primary" />
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium text-sm text-foreground truncate">{item.name}</h3>
                <p className="text-[10px] text-muted-foreground font-mono">{item.barcode}</p>
              </div>
              <div className="flex items-center shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => setShowHistory(true)}
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => onView?.(item)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          
          {/* Details Row */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {item.brands?.name && (
              <span className="truncate">{item.brands.name}</span>
            )}
            {item.categories?.name && (
              <>
                <span className="text-border">•</span>
                <span className="truncate">{item.categories.name}</span>
              </>
            )}
          </div>
          
          {/* Status Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold">{item.current_quantity}</span>
                <Badge 
                  variant="outline" 
                  className={cn("text-[9px] px-1.5 py-0", badgeVariants[stockStatus.variant])}
                >
                  {stockStatus.label}
                </Badge>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={cn("text-[9px] px-1.5 py-0", badgeVariants[expiryStatus.variant])}
            >
              {expiryStatus.label}
            </Badge>
          </div>
        </div>
      </div>

      <StockHistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
        itemId={item.id}
        itemName={item.name}
      />

      {item.image_url && (
        <ImagePreviewDialog
          open={showImagePreview}
          onOpenChange={setShowImagePreview}
          imageUrl={item.image_url}
          itemName={item.name}
        />
      )}
    </div>
  );
}
