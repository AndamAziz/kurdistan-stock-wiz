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
        <div className="animate-fade-in grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/markets')}
            className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 hover:from-primary/15 hover:to-primary/10 transition-all duration-300 group"
          >
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">ماڕکێتەکان</span>
          </button>
          <button
            onClick={() => navigate('/visit-reports')}
            className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-500/5 border border-orange-500/20 hover:border-orange-500/40 hover:from-orange-500/15 hover:to-orange-500/10 transition-all duration-300 group"
          >
            <div className="p-2 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
              <ClipboardList className="h-5 w-5 text-orange-500" />
            </div>
            <span className="text-sm font-semibold text-foreground">ڕاپۆرتی سەردان</span>
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
