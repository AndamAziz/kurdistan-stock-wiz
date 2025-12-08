import { Layout } from "@/components/layout/Layout";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { TopItemsTable } from "@/components/dashboard/TopItemsTable";
import {
  getDashboardStats,
  getExpiredItems,
  getLowStockItems,
  getSoonToExpireItems,
  getTopMovingItems,
} from "@/lib/mockData";
import {
  Package,
  PackageCheck,
  AlertTriangle,
  PackageX,
  Clock,
  TrendingDown,
} from "lucide-react";

export default function Dashboard() {
  const stats = getDashboardStats();
  const expiredItems = getExpiredItems();
  const lowStockItems = getLowStockItems();
  const soonToExpire = getSoonToExpireItems();
  const topItems = getTopMovingItems();

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
            value={stats.expiredItems}
            icon={AlertTriangle}
            variant="danger"
            delay={200}
          />
          <StatCard
            title="نزیک بەسەرچوون"
            value={stats.soonToExpire}
            icon={Clock}
            variant="warning"
            delay={300}
          />
          <StatCard
            title="کەم ستۆک"
            value={stats.lowStockItems}
            icon={TrendingDown}
            variant="warning"
            delay={400}
          />
          <StatCard
            title="نەماوە"
            value={stats.outOfStock}
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
              expiredItems={expiredItems}
              lowStockItems={lowStockItems}
              soonToExpire={soonToExpire}
            />
          </div>

          {/* Top Moving Items */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              زۆرترین فرۆشراو
            </h2>
            <TopItemsTable items={topItems} title="5 مادەی زۆرترین خەرجکراو" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
