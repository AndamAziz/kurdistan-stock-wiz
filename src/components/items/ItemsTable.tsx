import { useState } from "react";
import { Item } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, History } from "lucide-react";
import { StockHistoryDialog } from "./StockHistoryDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ItemsTableProps {
  items: Item[];
  onView?: (item: Item) => void;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
}

export function ItemsTable({ items, onView, onEdit, onDelete }: ItemsTableProps) {
  const [historyItem, setHistoryItem] = useState<{ id: string; name: string } | null>(null);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);

  const getStockStatus = (item: Item) => {
    if (item.quantity === 0) {
      return { label: 'نەماوە', variant: 'destructive' as const };
    }
    if (item.quantity <= item.minStock) {
      return { label: 'کەم', variant: 'warning' as const };
    }
    return { label: 'باش', variant: 'success' as const };
  };

  const getExpiryStatus = (item: Item) => {
    const today = new Date();
    const expDate = new Date(item.expDate);
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { label: 'بەسەرچوو', variant: 'destructive' as const };
    }
    if (daysUntilExpiry <= 30) {
      return { label: `${daysUntilExpiry} ڕۆژ`, variant: 'warning' as const };
    }
    return { label: 'سەلامەت', variant: 'success' as const };
  };

  const badgeVariants = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const handleConfirmDelete = () => {
    if (deleteItem && onDelete) {
      onDelete(deleteItem);
    }
    setDeleteItem(null);
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-semibold">باڕکۆد</TableHead>
              <TableHead className="text-right font-semibold">ناو</TableHead>
              <TableHead className="text-right font-semibold">براند</TableHead>
              <TableHead className="text-right font-semibold">هاوپۆل</TableHead>
              <TableHead className="text-center font-semibold">ستۆک</TableHead>
              <TableHead className="text-center font-semibold">بەسەرچوون</TableHead>
              <TableHead className="text-center font-semibold">کردارەکان</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  هیچ مادەیەک نەدۆزرایەوە
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => {
                const stockStatus = getStockStatus(item);
                const expiryStatus = getExpiryStatus(item);
                
                return (
                  <TableRow 
                    key={item.id} 
                    className="animate-fade-in hover:bg-muted/30 transition-colors"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {item.barcode}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.brand}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-secondary/50">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold">{item.quantity}</span>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", badgeVariants[stockStatus.variant])}
                        >
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", badgeVariants[expiryStatus.variant])}
                      >
                        {expiryStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => setHistoryItem({ id: item.id, name: item.name })}
                          title="مێژووی جوڵە"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => onView?.(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-accent"
                          onClick={() => onEdit?.(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteItem(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <StockHistoryDialog
          open={!!historyItem}
          onOpenChange={(open) => !open && setHistoryItem(null)}
          itemId={historyItem?.id || ''}
          itemName={historyItem?.name || ''}
        />
      </div>

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>دڵنیای لە سڕینەوە؟</AlertDialogTitle>
            <AlertDialogDescription>
              ئایا دڵنیای دەتەوێت مادەی "{deleteItem?.name}" بسڕیتەوە؟ ئەم کردارە ناگەڕێتەوە.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              سڕینەوە
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
