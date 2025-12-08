import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { TopItemsTable } from "@/components/dashboard/TopItemsTable";
import { useItems } from "@/hooks/useItems";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Package,
  PackageCheck,
  AlertTriangle,
  PackageX,
  Clock,
  TrendingDown,
  Loader2,
  Bell,
} from "lucide-react";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: items, isLoading } = useItems();
  const { permission, requestPermission, checkAndNotify } = usePushNotifications();
  const { settings } = useNotificationSettings();

  const handleCheckNotifications = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        toast.error('ڕێگەپێدان بۆ ئاگادارکردنەوە پێویستە');
        return;
      }
    }
    await checkAndNotify(settings.reminderDays);
    toast.success('پشکنینی ئاگادارکردنەوەکان تەواو بوو');
  };

  const stats = useMemo(() => {
    if (!items) return null;

    const today = new Date();
    const reminderDate = new Date(today.getTime() + settings.reminderDays * 24 * 60 * 60 * 1000);

    const expiredItems = items.filter(item => 
      item.exp_date && new Date(item.exp_date) < today
    );
    const soonToExpire = items.filter(item => {
      if (!item.exp_date) return false;
      const expDate = new Date(item.exp_date);
      return expDate > today && expDate <= reminderDate;
    });
    const lowStockItems = items.filter(item => 
      item.current_quantity <= item.min_stock && item.current_quantity > 0
    );
    const outOfStock = items.filter(item => item.current_quantity === 0);
    const topMoving = [...items]
      .sort((a, b) => b.total_out - a.total_out)
      .slice(0, 5);

    return {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.current_quantity, 0),
      expiredItems,
      soonToExpire,
      lowStockItems,
      outOfStock,
      topMoving,
    };
  }, [items, settings.reminderDays]);

  if (isLoading || !stats) {
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
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="animate-fade-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">داشبۆرد</h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base text-muted-foreground">
              بەخێربێیت بۆ سیستمی بەڕێوەبردنی کۆگای باکوری خۆشەویست
            </p>
          </div>
          <Button
            onClick={handleCheckNotifications}
            variant="outline"
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">پشکنینی ئاگادارکردنەوەکان</span>
            <span className="sm:hidden">پشکنین</span>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="کۆی مادەکان"
            value={stats.totalItems}
            icon={Package}
            delay={0}
          />
          <StatCard
            title="کۆی ستۆک"
            value={stats.totalQuantity}
            icon={PackageCheck}
            variant="success"
            delay={100}
          />
          <StatCard
            title="بەسەرچوو"
            value={stats.expiredItems.length}
            icon={AlertTriangle}
            variant="danger"
            delay={200}
          />
          <StatCard
            title="نزیک بەسەرچوون"
            value={stats.soonToExpire.length}
            icon={Clock}
            variant="warning"
            delay={300}
          />
          <StatCard
            title="کەم ستۆک"
            value={stats.lowStockItems.length}
            icon={TrendingDown}
            variant="warning"
            delay={400}
          />
          <StatCard
            title="نەماوە"
            value={stats.outOfStock.length}
            icon={PackageX}
            variant="danger"
            delay={500}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Alerts */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground">
              ئاگادارکردنەوەکان
            </h2>
            <AlertsList
              expiredItems={stats.expiredItems.map(item => ({
                id: item.id,
                name: item.name,
                expDate: item.exp_date || '',
                quantity: item.current_quantity,
                minStock: item.min_stock,
              }))}
              lowStockItems={stats.lowStockItems.map(item => ({
                id: item.id,
                name: item.name,
                expDate: item.exp_date || '',
                quantity: item.current_quantity,
                minStock: item.min_stock,
              }))}
              soonToExpire={stats.soonToExpire.map(item => ({
                id: item.id,
                name: item.name,
                expDate: item.exp_date || '',
                quantity: item.current_quantity,
                minStock: item.min_stock,
              }))}
            />
          </div>

          {/* Top Moving Items */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground">
              زۆرترین فرۆشراو
            </h2>
            <TopItemsTable 
              items={stats.topMoving.map(item => ({
                id: item.id,
                name: item.name,
                brand: item.brands?.name || '-',
                quantity: item.current_quantity,
                minStock: item.min_stock,
                totalOut: item.total_out,
              }))} 
              title="5 مادەی زۆرترین خەرجکراو" 
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
