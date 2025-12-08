import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ArrowDownToLine, ArrowUpFromLine, RefreshCw, History } from "lucide-react";
import { format } from "date-fns";

interface StockHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
}

export function StockHistoryDialog({ 
  open, 
  onOpenChange, 
  itemId,
  itemName 
}: StockHistoryDialogProps) {
  const { data: movements, isLoading } = useQuery({
    queryKey: ['stock_movements', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open && !!itemId,
  });

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <ArrowDownToLine className="h-4 w-4" />;
      case 'OUT':
        return <ArrowUpFromLine className="h-4 w-4" />;
      case 'ADJUST':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getMovementStyle = (type: string) => {
    switch (type) {
      case 'IN':
        return 'bg-success/10 text-success border-success/20';
      case 'OUT':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'ADJUST':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return '';
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'IN':
        return 'داخڵکردن';
      case 'OUT':
        return 'دەرکردن';
      case 'ADJUST':
        return 'ڕاستکردنەوە';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            مێژووی جوڵەی ستۆک
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{itemName}</p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : movements && movements.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {movements.map((movement, index) => (
                <div 
                  key={movement.id} 
                  className="rounded-lg border border-border bg-muted/30 p-4 animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`gap-1 ${getMovementStyle(movement.movement_type)}`}>
                        {getMovementIcon(movement.movement_type)}
                        {getMovementLabel(movement.movement_type)}
                      </Badge>
                      <span className="font-semibold">
                        {movement.movement_type === 'ADJUST' ? (
                          `→ ${movement.quantity}`
                        ) : movement.movement_type === 'IN' ? (
                          `+${movement.quantity}`
                        ) : (
                          `-${movement.quantity}`
                        )}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(movement.created_at), 'yyyy/MM/dd HH:mm')}
                    </span>
                  </div>
                  
                  {movement.note && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {movement.note}
                    </p>
                  )}
                  
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>بەروار: {movement.movement_date}</span>
                    {(movement.profiles as any)?.full_name && (
                      <span>لەلایەن: {(movement.profiles as any).full_name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mb-3 opacity-50" />
            <p>هیچ جوڵەیەک تۆمارنەکراوە</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}