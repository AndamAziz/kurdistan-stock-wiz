import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { ItemsTable } from "@/components/items/ItemsTable";
import { SearchFilter } from "@/components/items/SearchFilter";
import { Button } from "@/components/ui/button";
import { items, categories, brands, Item } from "@/lib/mockData";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function Items() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!item.name.toLowerCase().includes(query) && 
            !item.barcode.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const category = categories.find(c => c.id === selectedCategory);
        if (category && item.category !== category.name) {
          return false;
        }
      }

      // Brand filter
      if (selectedBrand !== 'all') {
        const brand = brands.find(b => b.id === selectedBrand);
        if (brand && item.brand !== brand.name) {
          return false;
        }
      }

      // Stock filter
      if (stockFilter !== 'all') {
        const today = new Date();
        const expDate = new Date(item.expDate);
        const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        switch (stockFilter) {
          case 'low':
            if (item.quantity > item.minStock || item.quantity === 0) return false;
            break;
          case 'out':
            if (item.quantity !== 0) return false;
            break;
          case 'expired':
            if (daysUntilExpiry >= 0) return false;
            break;
          case 'soon-expire':
            if (daysUntilExpiry < 0 || daysUntilExpiry > 30) return false;
            break;
        }
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedBrand, stockFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setStockFilter('all');
  };

  const handleView = (item: Item) => {
    toast.info(`بینینی ${item.name}`);
  };

  const handleEdit = (item: Item) => {
    toast.info(`دەستکاری ${item.name}`);
  };

  const handleDelete = (item: Item) => {
    toast.error(`سڕینەوەی ${item.name}`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">مادەکان</h1>
            <p className="mt-2 text-muted-foreground">
              بەڕێوەبردنی هەموو مادەکان لە کۆگا
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-5 w-5" />
            زیادکردنی مادە
          </Button>
        </div>

        {/* Search and Filters */}
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedBrand={selectedBrand}
          onBrandChange={setSelectedBrand}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
          onClearFilters={handleClearFilters}
        />

        {/* Results Count */}
        <div className="flex items-center justify-between animate-fade-in">
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} مادە دۆزرایەوە
          </p>
        </div>

        {/* Items Table */}
        <ItemsTable
          items={filteredItems}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </Layout>
  );
}
