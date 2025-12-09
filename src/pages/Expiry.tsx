import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useItems, ItemWithRelations } from "@/hooks/useItems";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { AlertTriangle, Clock, CalendarX, Loader2 } from "lucide-react";
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

type FilterType = 'all' | 'expired' | 'soon';

export default function Expiry() {
  const [filter, setFilter] = useState<FilterType>('all');
  const { data: items, isLoading } = useItems();
  const { settings } = useNotificationSettings();

  const { expiredItems, soonToExpireItems } = useMemo(() => {
    if (!items) return { expiredItems: [], soonToExpireItems: [] };

    const today = new Date();
    const reminderDate = new Date(today.getTime() + settings.reminderDays * 24 * 60 * 60 * 1000);

    const expired = items.filter(item => 
      item.exp_date && new Date(item.exp_date) < today
    );
    const soonExpire = items.filter(item => {
      if (!item.exp_date) return false;
      const expDate = new Date(item.exp_date);
      return expDate > today && expDate <= reminderDate;
    });

    return { expiredItems: expired, soonToExpireItems: soonExpire };
  }, [items, settings.reminderDays]);
  
  const getFilteredItems = () => {
    switch (filter) {
      case 'expired':
        return expiredItems;
      case 'soon':
        return soonToExpireItems;
      default:
        return [...expiredItems, ...soonToExpireItems];
    }
  };

  const filteredItems = getFilteredItems();

  const filters = [
    { id: 'all' as const, label: 'هەموو', count: expiredItems.length + soonToExpireItems.length, icon: CalendarX },
    { id: 'expired' as const, label: 'بەسەرچوو', count: expiredItems.length, icon: AlertTriangle },
    { id: 'soon' as const, label: 'نزیک بەسەرچوون', count: soonToExpireItems.length, icon: Clock },
  ];

  const getExpiryStatus = (item: ItemWithRelations) => {
    if (!item.exp_date) return { label: '-', variant: 'default' as const };
    
    const today = new Date();
    const expDate = new Date(item.exp_date);
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { label: 'بەسەرچوو', variant: 'destructive' as const, days: daysUntilExpiry };
    }
    if (daysUntilExpiry <= settings.reminderDays) {
      return { label: `${daysUntilExpiry} ڕۆژ`, variant: 'warning' as const, days: daysUntilExpiry };
    }
    return { label: 'سەلامەت', variant: 'success' as const, days: daysUntilExpiry };
  };

  const badgeVariants = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    default: 'bg-muted text-muted-foreground',
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-destructive/10 p-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">بەڕێوەبردنی بەسەرچوون</h1>
              <p className="mt-1 text-muted-foreground">
                چاودێری مادەی بەسەرچوو و نزیک بەسەرچوون
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 animate-slide-up">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                filter === f.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card text-muted-foreground hover:bg-muted border border-border"
              )}
            >
              <f.icon className="h-4 w-4" />
              <span>{f.label}</span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                filter === f.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-destructive/10 p-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مادەی بەسەرچوو</p>
                <p className="text-3xl font-bold text-destructive">{expiredItems.length}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-warning/10 p-3">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نزیک بەسەرچوون ({settings.reminderDays} ڕۆژ)</p>
                <p className="text-3xl font-bold text-warning">{soonToExpireItems.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-semibold">باڕکۆد</TableHead>
                <TableHead className="text-right font-semibold">ناوی بەرهەم</TableHead>
                <TableHead className="text-right font-semibold">براند</TableHead>
                <TableHead className="text-center font-semibold">ستۆک</TableHead>
                <TableHead className="text-center font-semibold">بەرواری بەسەرچوون</TableHead>
                <TableHead className="text-center font-semibold">دۆخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    هیچ مادەیەک نەدۆزرایەوە
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, index) => {
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
                      <TableCell className="text-muted-foreground">
                        {item.brands?.name || '-'}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {item.current_quantity}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {item.exp_date || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", badgeVariants[expiryStatus.variant])}
                        >
                          {expiryStatus.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
