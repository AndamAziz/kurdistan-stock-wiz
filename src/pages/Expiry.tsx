import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ItemsTable } from "@/components/items/ItemsTable";
import { getExpiredItems, getSoonToExpireItems, Item } from "@/lib/mockData";
import { AlertTriangle, Clock, CalendarX } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type FilterType = 'all' | 'expired' | 'soon';

export default function Expiry() {
  const [filter, setFilter] = useState<FilterType>('all');
  
  const expiredItems = getExpiredItems();
  const soonToExpireItems = getSoonToExpireItems(30);
  
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

  const handleView = (item: Item) => {
    toast.info(`بینینی ${item.name}`);
  };

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
                <p className="text-sm text-muted-foreground">نزیک بەسەرچوون (30 ڕۆژ)</p>
                <p className="text-3xl font-bold text-warning">{soonToExpireItems.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <ItemsTable
          items={filteredItems}
          onView={handleView}
        />
      </div>
    </Layout>
  );
}
