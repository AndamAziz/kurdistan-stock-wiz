import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { useItems, useCategories, useBrands, useDeleteAllItems, ItemWithRelations } from "@/hooks/useItems";
import { useUserRoles } from "@/hooks/useUserRoles";
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
import { MobileItemCard } from "@/components/items/MobileItemCard";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { BarcodeScannerDialog } from "@/components/barcode/BarcodeScannerDialog";
import { AddItemDialog } from "@/components/items/AddItemDialog";
import { ImagePreviewDialog } from "@/components/items/ImagePreviewDialog";
import { ItemDetailCard } from "@/components/items/ItemDetailCard";
import { StockHistoryDialog } from "@/components/items/StockHistoryDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, X, Eye, Loader2, Filter, ChevronDown, ScanLine, Trash2, AlertTriangle, Package, Calendar, AlertCircle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { hapticFeedback } from "@/lib/haptics";
import { toast } from "sonner";

export default function Items() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemWithRelations | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  const { data: items, isLoading, refetch } = useItems();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { isAdmin } = useUserRoles();
  const deleteAllItems = useDeleteAllItems();

  const handleDeleteAll = async () => {
    try {
      await deleteAllItems.mutateAsync();
      setDeleteAllDialogOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  // Sync URL search param with search query
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
      // Clear the URL param after setting the search
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleBarcodeScan = useCallback((barcode: string) => {
    hapticFeedback.success();
    setSearchQuery(barcode);
    
    // Check if item exists
    const found = items?.find(item => item.barcode === barcode);
    if (found) {
      toast.success(`مادەی "${found.name}" دۆزرایەوە`);
    } else {
      toast.info(`باڕکۆد: ${barcode} - مادە نەدۆزرایەوە`);
    }
  }, [items]);

  const { containerRef, isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    return items.filter(item => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!item.name.toLowerCase().includes(query) && 
            !item.barcode.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false;
      }

      if (selectedBrand !== 'all' && item.brand_id !== selectedBrand) {
        return false;
      }

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

  // Calculate items with issues
  const itemIssues = useMemo(() => {
    if (!items) return { expired: [], expiringSoon: [], lowStock: [], outOfStock: [] };
    
    const today = new Date();
    const expired: ItemWithRelations[] = [];
    const expiringSoon: ItemWithRelations[] = [];
    const lowStock: ItemWithRelations[] = [];
    const outOfStock: ItemWithRelations[] = [];

    items.forEach(item => {
      // Check expiry
      if (item.exp_date) {
        const expDate = new Date(item.exp_date);
        const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          expired.push(item);
        } else if (daysUntilExpiry <= 30) {
          expiringSoon.push(item);
        }
      }

      // Check stock
      if (item.current_quantity === 0) {
        outOfStock.push(item);
      } else if (item.current_quantity <= item.min_stock) {
        lowStock.push(item);
      }
    });

    return { expired, expiringSoon, lowStock, outOfStock };
  }, [items]);

  const totalIssues = itemIssues.expired.length + itemIssues.expiringSoon.length + 
                      itemIssues.lowStock.length + itemIssues.outOfStock.length;

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
  const activeFilterCount = [
    selectedCategory !== 'all',
    selectedBrand !== 'all', 
    stockFilter !== 'all'
  ].filter(Boolean).length;

  return (
    <Layout>
      <div 
        ref={containerRef}
        className="space-y-3 sm:space-y-4 lg:space-y-6 overflow-auto"
      >
        <PullToRefreshIndicator 
          pullDistance={pullDistance} 
          threshold={threshold} 
          isRefreshing={isRefreshing} 
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 animate-fade-in">
          <div className="flex-shrink-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">مادەکان</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              بەڕێوەبردنی هەموو مادەکان لە کۆگا
            </p>
          </div>
          
          {/* All Action Buttons in One Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Issue Buttons */}
            {itemIssues.expired.length > 0 && (
              <Button 
                variant="outline"
                size="sm"
                className={cn(
                  "gap-1.5 h-8 sm:h-9 text-xs rounded-lg border transition-all",
                  stockFilter === 'expired' 
                    ? "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90" 
                    : "border-destructive/40 text-destructive hover:bg-destructive/10"
                )}
                onClick={() => setStockFilter(stockFilter === 'expired' ? 'all' : 'expired')}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>{itemIssues.expired.length}</span>
                <span className="hidden sm:inline">بەسەرچوو</span>
              </Button>
            )}

            {itemIssues.expiringSoon.length > 0 && (
              <Button 
                variant="outline"
                size="sm"
                className={cn(
                  "gap-1.5 h-8 sm:h-9 text-xs rounded-lg border transition-all",
                  stockFilter === 'soon-expire' 
                    ? "bg-warning text-warning-foreground border-warning hover:bg-warning/90" 
                    : "border-warning/40 text-warning hover:bg-warning/10"
                )}
                onClick={() => setStockFilter(stockFilter === 'soon-expire' ? 'all' : 'soon-expire')}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{itemIssues.expiringSoon.length}</span>
                <span className="hidden sm:inline">نزیکە</span>
              </Button>
            )}

            {itemIssues.outOfStock.length > 0 && (
              <Button 
                variant="outline"
                size="sm"
                className={cn(
                  "gap-1.5 h-8 sm:h-9 text-xs rounded-lg border transition-all",
                  stockFilter === 'out' 
                    ? "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90" 
                    : "border-destructive/40 text-destructive hover:bg-destructive/10"
                )}
                onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
              >
                <Package className="h-3.5 w-3.5" />
                <span>{itemIssues.outOfStock.length}</span>
                <span className="hidden sm:inline">نەماوە</span>
              </Button>
            )}

            {itemIssues.lowStock.length > 0 && (
              <Button 
                variant="outline"
                size="sm"
                className={cn(
                  "gap-1.5 h-8 sm:h-9 text-xs rounded-lg border transition-all",
                  stockFilter === 'low' 
                    ? "bg-warning text-warning-foreground border-warning hover:bg-warning/90" 
                    : "border-warning/40 text-warning hover:bg-warning/10"
                )}
                onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{itemIssues.lowStock.length}</span>
                <span className="hidden sm:inline">کەم</span>
              </Button>
            )}

            {/* Separator */}
            {totalIssues > 0 && (
              <div className="hidden sm:block w-px h-6 bg-border mx-1" />
            )}

            {/* Delete All Button */}
            {isAdmin && items && items.length > 0 && (
              <Button 
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 sm:h-9 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                onClick={() => setDeleteAllDialogOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">سڕینەوە</span>
              </Button>
            )}

            {/* Add Button */}
            <Button 
              size="sm"
              className="gap-1.5 h-8 sm:h-9 text-xs rounded-lg shadow-sm hover:shadow transition-all px-3 sm:px-4"
              onClick={() => window.location.href = '/stock-in'}
            >
              <Plus className="h-3.5 w-3.5" />
              زیادکردن
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-xl lg:rounded-2xl border border-border bg-card p-4 sm:p-5 lg:p-6 shadow-card animate-slide-up">
          {/* Search - Always visible */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="گەڕان بە ناو یان باڕکۆد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12 h-11 sm:h-12 lg:h-14 text-base lg:text-lg rounded-xl"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14 shrink-0 rounded-xl"
              onClick={() => setScannerOpen(true)}
            >
              <ScanLine className="h-5 w-5 lg:h-6 lg:w-6" />
            </Button>
          </div>

          {/* Mobile Filters Collapsible */}
          <div className="lg:hidden mt-4">
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-11 text-sm rounded-xl"
                >
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    فلتەرەکان
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="h-6 px-2 text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </span>
                  <ChevronDown className={cn(
                    "h-5 w-5 transition-transform",
                    filtersOpen && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full h-11 text-sm rounded-xl">
                    <SelectValue placeholder="کەتەگۆری" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">هەموو کەتەگۆریەکان</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="w-full h-11 text-sm rounded-xl">
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
                  <SelectTrigger className="w-full h-11 text-sm rounded-xl">
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
                    className="w-full text-muted-foreground hover:text-destructive text-sm h-10 rounded-xl"
                  >
                    <X className="h-4 w-4 ml-1" />
                    پاککردنەوەی فلتەرەکان
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Desktop Filters */}
          <div className="hidden lg:flex flex-wrap items-center gap-4 mt-5">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px] h-12 text-base rounded-xl">
                <SelectValue placeholder="کەتەگۆری" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">هەموو کەتەگۆریەکان</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-[200px] h-12 text-base rounded-xl">
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
              <SelectTrigger className="w-[200px] h-12 text-base rounded-xl">
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
                size="lg"
                onClick={handleClearFilters}
                className="text-muted-foreground hover:text-destructive rounded-xl h-12"
              >
                <X className="h-5 w-5 ml-1" />
                پاککردنەوە
              </Button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between animate-fade-in">
          <p className="text-sm lg:text-base text-muted-foreground font-medium">
            {filteredItems.length} مادە دۆزرایەوە
          </p>
        </div>

        {/* Items Display */}
        {isLoading ? (
          <div className="flex items-center justify-center h-56 sm:h-72 lg:h-96">
            <Loader2 className="h-8 w-8 lg:h-12 lg:w-12 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="lg:hidden space-y-3">
              {filteredItems.length === 0 ? (
                <div className="flex items-center justify-center h-40 rounded-xl border border-border bg-card">
                  <p className="text-sm text-muted-foreground">هیچ مادەیەک نەدۆزرایەوە</p>
                </div>
              ) : (
                filteredItems.map((item, index) => (
                  <MobileItemCard 
                    key={item.id} 
                    item={item} 
                    index={index}
                  />
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-center font-semibold w-12 text-base py-4">#</TableHead>
                      <TableHead className="text-center font-semibold w-20 text-base py-4">وێنە</TableHead>
                      <TableHead className="text-right font-semibold text-base py-4">باڕکۆد</TableHead>
                      <TableHead className="text-right font-semibold text-base py-4">ناوی بەرهەم</TableHead>
                      <TableHead className="text-right font-semibold text-base py-4">براند</TableHead>
                      <TableHead className="text-right font-semibold text-base py-4">کەتەگۆری</TableHead>
                      <TableHead className="text-center font-semibold text-base py-4">ستۆک</TableHead>
                      <TableHead className="text-center font-semibold text-base py-4">بەسەرچوون</TableHead>
                      <TableHead className="text-center font-semibold text-base py-4">کردارەکان</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-40 text-center text-muted-foreground text-base">
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
                            {/* Row Number */}
                            <TableCell className="text-center py-4">
                              <span className="font-bold text-muted-foreground">{index + 1}</span>
                            </TableCell>
                            {/* Item Image */}
                            <TableCell className="text-center py-4">
                              {item.image_url ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage({ url: item.image_url!, name: item.name })}
                                  className="h-14 w-14 rounded-xl overflow-hidden border border-border bg-muted mx-auto hover:ring-2 hover:ring-primary/50 transition-all shadow-sm"
                                >
                                  <img 
                                    src={item.image_url} 
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                </button>
                              ) : (
                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-border flex items-center justify-center mx-auto text-muted-foreground text-lg">
                                  📦
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground py-4">
                              {item.barcode}
                            </TableCell>
                            <TableCell className="font-semibold text-base py-4">{item.name}</TableCell>
                            <TableCell className="text-muted-foreground text-base py-4">
                              {item.brands?.name || '-'}
                            </TableCell>
                            <TableCell className="py-4">
                              {item.categories ? (
                                <Badge variant="outline" className="bg-secondary/50 text-sm px-3 py-1">
                                  {item.categories.name}
                                </Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <div className="flex flex-col items-center gap-1.5">
                                <span className="font-bold text-lg">{item.current_quantity}</span>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-sm px-2.5 py-0.5", badgeVariants[stockStatus.variant])}
                                >
                                  {stockStatus.label}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <Badge 
                                variant="outline" 
                                className={cn("text-sm px-2.5 py-0.5", badgeVariants[expiryStatus.variant])}
                              >
                                {expiryStatus.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center justify-center">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                                  onClick={() => {
                                    hapticFeedback.light();
                                    setSelectedItem(item);
                                  }}
                                >
                                  <Eye className="h-5 w-5" />
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
            </div>
          </>
        )}

        {/* Barcode Scanner Dialog */}
        <BarcodeScannerDialog
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScan={handleBarcodeScan}
        />

        {/* Add Item Dialog */}
        <AddItemDialog
          open={addItemOpen}
          onOpenChange={setAddItemOpen}
        />

        {/* Image Preview Dialog */}
        {previewImage && (
          <ImagePreviewDialog
            open={!!previewImage}
            onOpenChange={(open) => !open && setPreviewImage(null)}
            imageUrl={previewImage.url}
            itemName={previewImage.name}
          />
        )}

        {/* Item Detail Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-right">وردەکاری بەرهەم</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                {/* Item Image */}
                {selectedItem.image_url && (
                  <div className="flex justify-center">
                    <img 
                      src={selectedItem.image_url} 
                      alt={selectedItem.name}
                      className="h-32 w-32 rounded-xl object-cover border border-border shadow-md"
                    />
                  </div>
                )}
                
                <ItemDetailCard item={selectedItem} showFullDetails={true} />
                
                {/* View History Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowHistory(true);
                  }}
                >
                  مێژووی جوڵە
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Stock History Dialog */}
        {selectedItem && (
          <StockHistoryDialog
            open={showHistory}
            onOpenChange={setShowHistory}
            itemId={selectedItem.id}
            itemName={selectedItem.name}
          />
        )}

        {/* Delete All Confirmation Dialog */}
        <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive">سڕینەوەی هەموو مادەکان</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              ئایا دڵنیایت لە سڕینەوەی هەموو {items?.length || 0} مادە؟ ئەم کردارە ناگەڕێتەوە.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setDeleteAllDialogOpen(false)}>
                پاشگەزبوونەوە
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAll}
                disabled={deleteAllItems.isPending}
              >
                {deleteAllItems.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                سڕینەوەی هەموو
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
