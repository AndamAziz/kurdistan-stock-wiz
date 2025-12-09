import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { TopItemsTable } from "@/components/dashboard/TopItemsTable";
import { ItemsListDialog } from "@/components/dashboard/ItemsListDialog";
import { StockValueReportDialog } from "@/components/reports/StockValueReportDialog";
import { useItems, useStockMovements } from "@/hooks/useItems";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useUserRoles } from "@/hooks/useUserRoles";
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
  BellOff,
  DollarSign,
  TrendingUp,
  Wallet,
  FileText,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";

export default function Dashboard() {
  const { data: items, isLoading } = useItems();
  const { data: movements, isLoading: movementsLoading } = useStockMovements();
  const { permission, requestPermission, checkAndNotify } = usePushNotifications();
  const { settings, updateSettings } = useNotificationSettings();
  const { isAdmin } = useUserRoles();
  
  // Dialog states
  const [soonToExpireOpen, setSoonToExpireOpen] = useState(false);
  const [lowStockOpen, setLowStockOpen] = useState(false);
  const [outOfStockOpen, setOutOfStockOpen] = useState(false);
  const [allItemsOpen, setAllItemsOpen] = useState(false);
  const [expiredOpen, setExpiredOpen] = useState(false);
  const [stockReportOpen, setStockReportOpen] = useState(false);
  
  const isNotificationsEnabled = settings.interval !== 'off';

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

    // Calculate total sales from stock movements
    const totalSales = movements
      ?.filter(m => m.movement_type === 'OUT')
      .reduce((sum, m) => sum + ((m.price as number || 0) * m.quantity), 0) || 0;

    // Calculate total purchases from stock movements
    const totalPurchases = movements
      ?.filter(m => m.movement_type === 'IN')
      .reduce((sum, m) => sum + ((m.price as number || 0) * m.quantity), 0) || 0;

    // Calculate total stock value based on IN movements price per item
    // This is an estimation - total value = sum of (current_quantity * average_purchase_price)
    const stockValueByItem = new Map<string, { totalCost: number; totalQty: number }>();
    movements?.filter(m => m.movement_type === 'IN').forEach(m => {
      const existing = stockValueByItem.get(m.item_id) || { totalCost: 0, totalQty: 0 };
      existing.totalCost += (m.price as number || 0) * m.quantity;
      existing.totalQty += m.quantity;
      stockValueByItem.set(m.item_id, existing);
    });

    let totalStockValue = 0;
    items.forEach(item => {
      const purchaseData = stockValueByItem.get(item.id);
      if (purchaseData && purchaseData.totalQty > 0) {
        const avgPrice = purchaseData.totalCost / purchaseData.totalQty;
        totalStockValue += item.current_quantity * avgPrice;
      }
    });

    return {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.current_quantity, 0),
      expiredItems,
      soonToExpire,
      lowStockItems,
      outOfStock,
      topMoving,
      totalSales,
      totalPurchases,
      totalStockValue,
    };
  }, [items, movements, settings.reminderDays]);

  if (isLoading || movementsLoading || !stats) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString();
  };

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
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isAdmin && (
              <Button
                onClick={() => setStockReportOpen(true)}
                variant="default"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">ڕاپۆرتی نرخ</span>
                <span className="sm:hidden">ڕاپۆرت</span>
              </Button>
            )}
            <div className="flex items-center gap-3 px-3 py-2 rounded-full bg-muted/80 border border-border shadow-sm">
              <Switch
                checked={isNotificationsEnabled}
                onCheckedChange={async (checked) => {
                  if (checked) {
                    // First request permission if needed
                    if (permission !== 'granted') {
                      const granted = await requestPermission();
                      if (!granted) {
                        toast.error('ڕێگەپێدان بۆ ئاگادارکردنەوە پێویستە');
                        return;
                      }
                    }
                    // Enable notifications
                    updateSettings({ interval: '1hour' });
                    await checkAndNotify(settings.reminderDays);
                    toast.success('ئاگادارکردنەوەکان چالاک کران ✓');
                  } else {
                    // Disable notifications
                    updateSettings({ interval: 'off' });
                    toast.info('ئاگادارکردنەوەکان ناچالاک کران');
                  }
                }}
                className="data-[state=checked]:bg-green-500"
              />
              {isNotificationsEnabled ? (
                <Bell className="h-5 w-5 text-green-500" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <span className={`text-sm font-medium ${isNotificationsEnabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                {isNotificationsEnabled ? 'چالاک' : 'ناچالاک'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid - Financial stats only for Admin */}
        {isAdmin && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
            <StatCard
              title="کۆی فرۆشراو"
              value={`${formatCurrency(stats.totalSales)} د.ع`}
              icon={DollarSign}
              variant="success"
              delay={0}
            />
            <StatCard
              title="کۆی کڕاو"
              value={`${formatCurrency(stats.totalPurchases)} د.ع`}
              icon={TrendingUp}
              delay={50}
            />
            <StatCard
              title="نرخی ستۆک"
              value={`${formatCurrency(stats.totalStockValue)} د.ع`}
              icon={Wallet}
              variant="success"
              delay={75}
            />
            <StatCard
              title="کۆی مادەکان"
              value={stats.totalItems}
              icon={Package}
              delay={100}
              clickable
              onClick={() => setAllItemsOpen(true)}
            />
          </div>
        )}

        {/* Basic Stats - visible to all (without total stock) */}
        {!isAdmin && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
            <StatCard
              title="کۆی مادەکان"
              value={stats.totalItems}
              icon={Package}
              delay={100}
              clickable
              onClick={() => setAllItemsOpen(true)}
            />
          </div>
        )}

        {/* Alerts Stats - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
          <StatCard
            title="بەسەرچوو"
            value={stats.expiredItems.length}
            icon={AlertTriangle}
            variant="danger"
            delay={150}
            clickable
            onClick={() => setExpiredOpen(true)}
          />
          <StatCard
            title="نزیک بەسەرچوون"
            value={stats.soonToExpire.length}
            icon={Clock}
            variant="warning"
            delay={200}
            clickable
            onClick={() => setSoonToExpireOpen(true)}
          />
          <StatCard
            title="کەم ستۆک"
            value={stats.lowStockItems.length}
            icon={TrendingDown}
            variant="warning"
            delay={300}
            clickable
            onClick={() => setLowStockOpen(true)}
          />
          <StatCard
            title="نەماوە"
            value={stats.outOfStock.length}
            icon={PackageX}
            variant="danger"
            delay={350}
            clickable
            onClick={() => setOutOfStockOpen(true)}
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
      
      {/* Dialogs for stat cards */}
      <ItemsListDialog
        open={soonToExpireOpen}
        onOpenChange={setSoonToExpireOpen}
        title="نزیک بەسەرچوون"
        items={stats.soonToExpire}
        type="expiring"
      />
      
      <ItemsListDialog
        open={lowStockOpen}
        onOpenChange={setLowStockOpen}
        title="کەم ستۆک"
        items={stats.lowStockItems}
        type="low-stock"
      />
      
      <ItemsListDialog
        open={outOfStockOpen}
        onOpenChange={setOutOfStockOpen}
        title="نەماوە"
        items={stats.outOfStock}
        type="out-of-stock"
      />
      
      <ItemsListDialog
        open={allItemsOpen}
        onOpenChange={setAllItemsOpen}
        title="هەموو مادەکان"
        items={items || []}
        type="all-items"
      />
      
      <ItemsListDialog
        open={expiredOpen}
        onOpenChange={setExpiredOpen}
        title="بەسەرچوو"
        items={stats.expiredItems}
        type="expired"
      />

      {/* Stock Value Report Dialog - Admin Only */}
      {isAdmin && items && (
        <StockValueReportDialog
          open={stockReportOpen}
          onOpenChange={setStockReportOpen}
          items={items}
        />
      )}
    </Layout>
  );
}
