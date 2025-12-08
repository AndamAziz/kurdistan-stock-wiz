import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Package, Calendar, Tag, AlertTriangle, TrendingDown, PackageX, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ItemWithBrand {
  id: string;
  name: string;
  current_quantity: number;
  min_stock: number;
  exp_date?: string | null;
  brands?: { name: string } | null;
  categories?: { name: string } | null;
  barcode: string;
}

interface ItemsListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: ItemWithBrand[];
  type: 'expiring' | 'low-stock' | 'out-of-stock' | 'all-items' | 'expired';
}

export function ItemsListDialog({ open, onOpenChange, title, items, type }: ItemsListDialogProps) {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (type) {
      case 'expiring':
      case 'expired':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'low-stock':
        return <TrendingDown className="h-5 w-5 text-warning" />;
      case 'out-of-stock':
        return <PackageX className="h-5 w-5 text-destructive" />;
      default:
        return <Package className="h-5 w-5 text-primary" />;
    }
  };

  const getItemStatusBadge = (item: ItemWithBrand) => {
    if (type === 'expired') {
      return <Badge variant="destructive" className="text-[10px]">بەسەرچوو</Badge>;
    }
    if (type === 'expiring' && item.exp_date) {
      const daysLeft = Math.ceil((new Date(item.exp_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return <Badge variant="outline" className="text-[10px] border-warning text-warning">{daysLeft} ڕۆژ ماوە</Badge>;
    }
    if (type === 'low-stock') {
      return <Badge variant="outline" className="text-[10px] border-warning text-warning">کەم ستۆک</Badge>;
    }
    if (type === 'out-of-stock') {
      return <Badge variant="destructive" className="text-[10px]">نەماوە</Badge>;
    }
    return null;
  };

  const handleItemClick = (item: ItemWithBrand) => {
    onOpenChange(false);
    // Navigate to items page with search query set to item name
    navigate(`/items?search=${encodeURIComponent(item.name)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {getIcon()}
            {title}
            <Badge variant="secondary" className="mr-auto">{items.length}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>هیچ مادەیەک نییە</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="flex flex-col gap-2 p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{item.name}</h4>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {item.brands?.name && (
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            <Tag className="h-2.5 w-2.5 ml-1" />
                            {item.brands.name}
                          </Badge>
                        )}
                        {item.categories?.name && (
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            {item.categories.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {getItemStatusBadge(item)}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span className={item.current_quantity <= item.min_stock ? 'text-warning font-medium' : ''}>
                          {item.current_quantity}
                        </span>
                        <span className="text-muted-foreground/60">/ {item.min_stock}</span>
                      </span>
                      {item.exp_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(item.exp_date), 'yyyy/MM/dd')}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">{item.barcode}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}