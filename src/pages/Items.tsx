import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useItems, useCategories, useBrands, ItemWithRelations } from "@/hooks/useItems";
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
import { Plus, Search, X, Eye, Loader2 } from "lucide-react";

export default function Items() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const { data: items, isLoading } = useItems();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  const filteredItems = useMemo(() => {
    if (!items) return [];
    
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
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }

      // Brand filter
      if (selectedBrand !== 'all' && item.brand_id !== selectedBrand) {
        return false;
      }

      // Stock filter
      if (stockFilter !== 'all') {
        const today = new Date();
        const expDate = item.exp_date ? new Date(item.exp_date) : null;
        const daysUntilExpiry = expDate ? Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

        switch (stockFilter) {
          case 'low':
            if (item.current_quantity > item.min_stock || item.current_quantity === 0) return false;
            break;
          case 'out':
            if (item.current_quantity !== 0) return false;
            break;
          case 'expired':
            if (!daysUntilExpiry || daysUntilExpiry >= 0) return false;
            break;
          case 'soon-expire':
            if (!daysUntilExpiry || daysUntilExpiry < 0 || daysUntilExpiry > 30) return false;
            break;
        }
      }

      return true;
    });
  }, [items, searchQuery, selectedCategory, selectedBrand, stockFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setStockFilter('all');
  };

  const getStockStatus = (item: ItemWithRelations) => {
    if (item.current_quantity === 0) {
      return { label: 'نەماوە', variant: 'destructive' as const };
    }
    if (item.current_quantity <= item.min_stock) {
      return { label: 'کەم', variant: 'warning' as const };
    }
    return { label: 'باش', variant: 'success' as const };
  };

  const getExpiryStatus = (item: ItemWithRelations) => {
    if (!item.exp_date) return { label: '-', variant: 'default' as const };
    
    const today = new Date();
    const expDate = new Date(item.exp_date);
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { label: 'بەسەرچوو', variant: 'destructive' as const };
    }
    if (daysUntilExpiry <= 30) {
      return { label: `${daysUntilExpiry} ڕۆژ`, variant: 'warning' as const };
    }
    return { label: 'سەلامەت', variant: 'success' as const };
  };

  const badgeVariants = {
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    default: 'bg-muted text-muted-foreground',
  };

  const hasFilters = searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all' || stockFilter !== 'all';

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
        <div className="rounded-xl border border-border bg-card p-4 shadow-card animate-slide-up">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="گەڕان بە ناو یان باڕکۆد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="هاوپۆل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">هەموو هاوپۆلەکان</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="براند" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">هەموو براندەکان</SelectItem>
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="دۆخی ستۆک" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">هەموو</SelectItem>
                <SelectItem value="low">کەم ستۆک</SelectItem>
                <SelectItem value="out">نەماوە</SelectItem>
                <SelectItem value="expired">بەسەرچوو</SelectItem>
                <SelectItem value="soon-expire">نزیک بەسەرچوون</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4 ml-1" />
                پاککردنەوە
              </Button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between animate-fade-in">
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} مادە دۆزرایەوە
          </p>
        </div>

        {/* Items Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-semibold">باڕکۆد</TableHead>
                  <TableHead className="text-right font-semibold">ناو</TableHead>
                  <TableHead className="text-right font-semibold">براند</TableHead>
                  <TableHead className="text-right font-semibold">هاوپۆل</TableHead>
                  <TableHead className="text-center font-semibold">ستۆک</TableHead>
                  <TableHead className="text-center font-semibold">بەسەرچوون</TableHead>
                  <TableHead className="text-center font-semibold">کردارەکان</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      هیچ مادەیەک نەدۆزرایەوە
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item, index) => {
                    const stockStatus = getStockStatus(item);
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
                        <TableCell>
                          {item.categories ? (
                            <Badge variant="outline" className="bg-secondary/50">
                              {item.categories.name}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-semibold">{item.current_quantity}</span>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", badgeVariants[stockStatus.variant])}
                            >
                              {stockStatus.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", badgeVariants[expiryStatus.variant])}
                          >
                            {expiryStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Layout>
  );
}
