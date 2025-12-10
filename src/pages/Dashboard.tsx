import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { ItemsListDialog } from "@/components/dashboard/ItemsListDialog";
import { useItems } from "@/hooks/useItems";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  PackageX,
  Clock,
  TrendingDown,
  Loader2,
  Bell,
  BellOff,
  Store,
  ClipboardList,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: items, isLoading } = useItems();
  const { permission, requestPermission, checkAndNotify } = usePushNotifications();
  const { settings, updateSettings } = useNotificationSettings();
  
  // Dialog states
  const [soonToExpireOpen, setSoonToExpireOpen] = useState(false);
  const [lowStockOpen, setLowStockOpen] = useState(false);
  const [outOfStockOpen, setOutOfStockOpen] = useState(false);
  const [expiredOpen, setExpiredOpen] = useState(false);
  
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

    return {
      expiredItems,
      soonToExpire,
      lowStockItems,
      outOfStock,
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
          
          {/* Notification Toggle - Beautiful Design */}
          <button
            onClick={async () => {
              if (!isNotificationsEnabled) {
                if (permission !== 'granted') {
                  const granted = await requestPermission();
                  if (!granted) {
                    toast.error('ڕێگەپێدان بۆ ئاگادارکردنەوە پێویستە');
                    return;
                  }
                }
                updateSettings({ interval: '1hour' });
                await checkAndNotify(settings.reminderDays);
                toast.success('ئاگادارکردنەوەکان چالاک کران ✓');
              } else {
                updateSettings({ interval: 'off' });
                toast.info('ئاگادارکردنەوەکان ناچالاک کران');
              }
            }}
            className={`
              group relative flex items-center gap-2 px-4 py-2.5 rounded-xl
              transition-all duration-300 ease-out
              ${isNotificationsEnabled 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105' 
                : 'bg-muted/60 text-muted-foreground border border-border hover:bg-muted hover:scale-105'
              }
            `}
          >
            <div className={`
              p-1.5 rounded-lg transition-all duration-300
              ${isNotificationsEnabled 
                ? 'bg-white/20' 
                : 'bg-muted-foreground/10'
              }
            `}>
              {isNotificationsEnabled ? (
                <Bell className="h-4 w-4 animate-[pulse_2s_ease-in-out_infinite]" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </div>
            <span className="text-sm font-semibold">
              {isNotificationsEnabled ? 'ئاگادارکردنەوە چالاکە' : 'ئاگادارکردنەوە ناچالاکە'}
            </span>
            <div className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${isNotificationsEnabled 
                ? 'bg-white animate-pulse' 
                : 'bg-muted-foreground/40'
              }
            `} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/markets')}
            className="relative overflow-hidden flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 group"
          >
            <div className="relative z-10 p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 group-hover:scale-110 transition-all duration-300">
              <Store className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="relative z-10 text-sm sm:text-base font-bold text-emerald-800 dark:text-emerald-200">ماڕکێتەکان</span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/10 to-emerald-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
          <button
            onClick={() => navigate('/visit-reports')}
            className="relative overflow-hidden flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/60 dark:border-amber-800/40 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 group"
          >
            <div className="relative z-10 p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 group-hover:scale-110 transition-all duration-300">
              <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="relative z-10 text-sm sm:text-base font-bold text-amber-800 dark:text-amber-200">ڕاپۆرتی سەردان</span>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/10 to-amber-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
          <button
            onClick={() => navigate('/delivery-persons')}
            className="relative overflow-hidden flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/30 border border-violet-200/60 dark:border-violet-800/40 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 group col-span-2 sm:col-span-1"
          >
            <div className="relative z-10 p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 group-hover:scale-110 transition-all duration-300">
              <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="relative z-10 text-sm sm:text-base font-bold text-violet-800 dark:text-violet-200">مەندوبەکان</span>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400/0 via-violet-400/10 to-violet-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
        </div>

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

        {/* Alerts List */}
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
        open={expiredOpen}
        onOpenChange={setExpiredOpen}
        title="بەسەرچوو"
        items={stats.expiredItems}
        type="expired"
      />
    </Layout>
  );
}
