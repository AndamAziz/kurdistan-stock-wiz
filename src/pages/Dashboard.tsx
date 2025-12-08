import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { TopItemsTable } from "@/components/dashboard/TopItemsTable";
import { useItems } from "@/hooks/useItems";
import {
  Package,
  PackageCheck,
  AlertTriangle,
  PackageX,
  Clock,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: items, isLoading } = useItems();

  const stats = useMemo(() => {
    if (!items) return null;

    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiredItems = items.filter(item => 
      item.exp_date && new Date(item.exp_date) < today
    );
    const soonToExpire = items.filter(item => {
      if (!item.exp_date) return false;
      const expDate = new Date(item.exp_date);
      return expDate > today && expDate <= thirtyDaysLater;
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
  }, [items]);

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
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">داشبۆرد</h1>
          <p className="mt-2 text-muted-foreground">
            بەخێربێیت بۆ سیستمی بەڕێوەبردنی کۆگای باکوری خۆشەویست
          </p>
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Alerts */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
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
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
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
