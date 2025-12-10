import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  X,
  Save,
  Loader2,
  Trash2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useBrands, useCategories, useAddItem } from "@/hooks/useItems";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface ImportedItem {
  id: string;
  name: string;
  barcode: string;
  brand: string;
  category: string;
  quantity: number;
  box_price: number;
  piece_price: number;
  price_per_kg: number;
  unit: string;
  min_stock: number;
  mfg_date: string | null;
  exp_date: string | null;
  remind_date: string | null;
  hasError: boolean;
  errorMessage?: string;
  errorFields?: string[];
  isComplete: boolean;
  isDuplicate?: boolean;
  existingItemId?: string;
}

interface ImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importedItems: ImportedItem[];
  onImportComplete: () => void;
}

export function ImportResultDialog({
  open,
  onOpenChange,
  importedItems,
  onImportComplete,
}: ImportResultDialogProps) {
  const [items, setItems] = useState<ImportedItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const { data: brands = [] } = useBrands();
  const { data: categories = [] } = useCategories();

  // Check for duplicates when dialog opens
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!open || importedItems.length === 0) return;
      
      setIsCheckingDuplicates(true);
      
      try {
        // Get all barcodes from imported items
        const barcodes = importedItems.map(item => item.barcode.trim()).filter(Boolean);
        
        // Query existing items with these barcodes
        const { data: existingItems } = await supabase
          .from("items")
          .select("id, barcode")
          .in("barcode", barcodes);
        
        const existingBarcodeMap = new Map(
          existingItems?.map(item => [item.barcode, item.id]) || []
        );
        
        // Mark duplicates
        const itemsWithDuplicates = importedItems.map(item => ({
          ...item,
          isDuplicate: existingBarcodeMap.has(item.barcode.trim()),
          existingItemId: existingBarcodeMap.get(item.barcode.trim()),
        }));
        
        setItems(itemsWithDuplicates);
      } catch (error) {
        console.error("Error checking duplicates:", error);
        setItems(importedItems);
      } finally {
        setIsCheckingDuplicates(false);
      }
    };
    
    checkDuplicates();
  }, [open, importedItems]);

  const completeItems = items.filter((item) => item.isComplete && !item.hasError);
  const incompleteItems = items.filter((item) => !item.isComplete || item.hasError);
  const newItems = completeItems.filter((item) => !item.isDuplicate);
  const duplicateItems = completeItems.filter((item) => item.isDuplicate);

  const getItemErrors = (item: ImportedItem): string[] => {
    const errors: string[] = [];
    if (!item.name?.trim()) errors.push("ناو");
    if (!item.barcode?.trim()) errors.push("باڕکۆد");
    return errors;
  };

  const handleUpdateItem = (id: string, field: keyof ImportedItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Check which fields have errors
        const errorFields = getItemErrors(updated);
        const isComplete = errorFields.length === 0 && updated.quantity >= 0;

        return {
          ...updated,
          isComplete,
          hasError: !isComplete,
          errorFields,
          errorMessage: errorFields.length > 0 
            ? `کێشە لە: ${errorFields.join("، ")}` 
            : undefined,
        };
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Import only NEW items (not duplicates)
  const handleImportNew = async () => {
    const itemsToImport = newItems;
    if (itemsToImport.length === 0) {
      toast.info("هیچ مادەیەکی نوێ نییە بۆ هێنان");
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: itemsToImport.length });

    try {
      const brandMap = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));
      const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

      let addedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < itemsToImport.length; i++) {
        const item = itemsToImport[i];
        setImportProgress({ current: i + 1, total: itemsToImport.length });
        
        try {
          // Find or create brand
          let brandId: string | null = null;
          if (item.brand) {
            brandId = brandMap.get(item.brand.toLowerCase()) || null;
            if (!brandId && item.brand.trim()) {
              const { data: newBrand } = await supabase
                .from("brands")
                .insert({ name: item.brand.trim() })
                .select()
                .single();
              if (newBrand) {
                brandId = newBrand.id;
                brandMap.set(item.brand.toLowerCase(), newBrand.id);
              }
            }
          }

          // Find or create category
          let categoryId: string | null = null;
          if (item.category) {
            categoryId = categoryMap.get(item.category.toLowerCase()) || null;
            if (!categoryId && item.category.trim()) {
              const { data: newCategory } = await supabase
                .from("categories")
                .insert({ name: item.category.trim() })
                .select()
                .single();
              if (newCategory) {
                categoryId = newCategory.id;
                categoryMap.set(item.category.toLowerCase(), newCategory.id);
              }
            }
          }

          // Insert new item
          const { error: insertError } = await supabase.from("items").insert({
            name: item.name.trim(),
            barcode: item.barcode.trim(),
            brand_id: brandId,
            category_id: categoryId,
            current_quantity: item.quantity,
            total_in: item.quantity,
            min_stock: item.min_stock || 10,
            unit: item.unit || "دانە",
            box_price: item.box_price || 0,
            piece_price: item.piece_price || 0,
            price_per_kg: item.price_per_kg || 0,
            mfg_date: item.mfg_date || null,
            exp_date: item.exp_date || null,
            remind_date: item.remind_date || null,
          });

          if (insertError) {
            errorCount++;
          } else {
            addedCount++;
          }
        } catch {
          errorCount++;
        }
      }

      if (addedCount > 0) {
        toast.success(`${addedCount} مادەی نوێ زیادکرا`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} مادە نەتوانرا هێندرێت`);
      }

      onImportComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("هەڵە لە هێنانی مادەکان");
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  // Update duplicate items (already exist in database)
  const handleUpdateDuplicates = async () => {
    if (duplicateItems.length === 0) {
      toast.info("هیچ مادەیەکی دووبارە نییە بۆ نوێکردنەوە");
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: duplicateItems.length });

    try {
      const brandMap = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));
      const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

      let updatedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < duplicateItems.length; i++) {
        const item = duplicateItems[i];
        setImportProgress({ current: i + 1, total: duplicateItems.length });
        
        try {
          // Find or create brand
          let brandId: string | null = null;
          if (item.brand) {
            brandId = brandMap.get(item.brand.toLowerCase()) || null;
            if (!brandId && item.brand.trim()) {
              const { data: newBrand } = await supabase
                .from("brands")
                .insert({ name: item.brand.trim() })
                .select()
                .single();
              if (newBrand) {
                brandId = newBrand.id;
                brandMap.set(item.brand.toLowerCase(), newBrand.id);
              }
            }
          }

          // Find or create category
          let categoryId: string | null = null;
          if (item.category) {
            categoryId = categoryMap.get(item.category.toLowerCase()) || null;
            if (!categoryId && item.category.trim()) {
              const { data: newCategory } = await supabase
                .from("categories")
                .insert({ name: item.category.trim() })
                .select()
                .single();
              if (newCategory) {
                categoryId = newCategory.id;
                categoryMap.set(item.category.toLowerCase(), newCategory.id);
              }
            }
          }

          // Update existing item by barcode
          const { error: updateError } = await supabase
            .from("items")
            .update({
              name: item.name.trim(),
              brand_id: brandId,
              category_id: categoryId,
              current_quantity: item.quantity,
              min_stock: item.min_stock || 10,
              unit: item.unit || "دانە",
              box_price: item.box_price || 0,
              piece_price: item.piece_price || 0,
              price_per_kg: item.price_per_kg || 0,
              mfg_date: item.mfg_date || null,
              exp_date: item.exp_date || null,
              remind_date: item.remind_date || null,
            })
            .eq("barcode", item.barcode.trim());

          if (updateError) {
            errorCount++;
          } else {
            updatedCount++;
          }
        } catch {
          errorCount++;
        }
      }

      if (updatedCount > 0) {
        toast.success(`${updatedCount} مادە نوێکرایەوە`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} مادە نەتوانرا نوێبکرێتەوە`);
      }

      onImportComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Update error:", error);
      toast.error("هەڵە لە نوێکردنەوەی مادەکان");
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  const renderEditableCell = (
    item: ImportedItem,
    field: keyof ImportedItem,
    type: "text" | "number" | "select" | "date" = "text"
  ) => {
    const isEditing = editingId === item.id;
    const value = item[field];

    if (!isEditing) {
      if (field === "brand" || field === "category") {
        return (
          <span className={!value ? "text-destructive" : ""}>
            {value || "-"}
          </span>
        );
      }
      return <span>{value?.toString() || "-"}</span>;
    }

    if (field === "brand") {
      return (
        <Select
          value={item.brand || ""}
          onValueChange={(v) => handleUpdateItem(item.id, "brand", v)}
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue placeholder="براند" />
          </SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.name}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field === "category") {
      return (
        <Select
          value={item.category || ""}
          onValueChange={(v) => handleUpdateItem(item.id, "category", v)}
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue placeholder="کەتەگۆری" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (type === "number") {
      return (
        <Input
          type="number"
          value={value?.toString() || "0"}
          onChange={(e) =>
            handleUpdateItem(item.id, field, parseFloat(e.target.value) || 0)
          }
          className="h-8 w-20"
        />
      );
    }

    if (type === "date") {
      return (
        <Input
          type="date"
          value={value?.toString() || ""}
          onChange={(e) => handleUpdateItem(item.id, field, e.target.value || null)}
          className="h-8"
        />
      );
    }

    return (
      <Input
        type="text"
        value={value?.toString() || ""}
        onChange={(e) => handleUpdateItem(item.id, field, e.target.value)}
        className="h-8"
      />
    );
  };

  const renderItemRow = (item: ImportedItem) => {
    const isEditing = editingId === item.id;
    const errorFields = item.errorFields || getItemErrors(item);
    
    return (
      <TableRow 
        key={item.id} 
        className={`${item.hasError ? "bg-destructive/5" : item.isDuplicate ? "bg-warning/5" : ""} ${isEditing ? "bg-muted/50" : ""}`}
      >
        <TableCell className="font-medium text-xs">
          {isEditing ? (
            <div className="space-y-1">
              <Input
                value={item.name}
                onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                className={`h-7 text-xs ${errorFields.includes("ناو") ? "border-destructive" : ""}`}
                placeholder="ناوی بەرهەم"
              />
              {errorFields.includes("ناو") && (
                <span className="text-[10px] text-destructive">پێویستە</span>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="truncate max-w-[120px]">{item.name || <span className="text-destructive">بەتاڵە</span>}</span>
              {errorFields.includes("ناو") && !isEditing && (
                <span className="text-[10px] text-destructive">⚠ پێویستە</span>
              )}
            </div>
          )}
        </TableCell>
        <TableCell className="text-xs">
          {isEditing ? (
            <div className="space-y-1">
              <Input
                value={item.barcode}
                onChange={(e) => handleUpdateItem(item.id, "barcode", e.target.value)}
                className={`h-7 text-xs ${errorFields.includes("باڕکۆد") ? "border-destructive" : ""}`}
                placeholder="باڕکۆد"
              />
              {errorFields.includes("باڕکۆد") && (
                <span className="text-[10px] text-destructive">پێویستە</span>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="truncate max-w-[100px]">{item.barcode || <span className="text-destructive">بەتاڵە</span>}</span>
              {errorFields.includes("باڕکۆد") && !isEditing && (
                <span className="text-[10px] text-destructive">⚠ پێویستە</span>
              )}
            </div>
          )}
        </TableCell>
        <TableCell className="text-xs">{renderEditableCell(item, "brand", "select")}</TableCell>
        <TableCell className="text-xs">{renderEditableCell(item, "category", "select")}</TableCell>
        <TableCell className="text-xs">{renderEditableCell(item, "quantity", "number")}</TableCell>
        <TableCell className="text-xs hidden lg:table-cell">{renderEditableCell(item, "box_price", "number")}</TableCell>
        <TableCell className="text-xs hidden lg:table-cell">{renderEditableCell(item, "piece_price", "number")}</TableCell>
        <TableCell className="text-xs hidden xl:table-cell">{renderEditableCell(item, "price_per_kg", "number")}</TableCell>
        <TableCell className="text-xs hidden xl:table-cell">{renderEditableCell(item, "min_stock", "number")}</TableCell>
        <TableCell>
          {item.hasError ? (
            <Badge variant="destructive" className="gap-1 text-[10px] whitespace-nowrap">
              <AlertCircle className="h-3 w-3" />
              هەڵە
            </Badge>
          ) : item.isDuplicate ? (
            <Badge className="gap-1 text-[10px] whitespace-nowrap bg-warning text-warning-foreground">
              <RefreshCw className="h-3 w-3" />
              دووبارە
            </Badge>
          ) : (
            <Badge className="gap-1 text-[10px] whitespace-nowrap bg-success text-success-foreground">
              <CheckCircle2 className="h-3 w-3" />
              نوێ
            </Badge>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={isEditing ? "default" : item.hasError ? "outline" : "ghost"}
              className={`h-6 w-6 p-0 ${item.hasError && !isEditing ? "border-destructive text-destructive" : ""}`}
              onClick={() => setEditingId(isEditing ? null : item.id)}
            >
              {isEditing ? (
                <Save className="h-3 w-3" />
              ) : (
                <Edit2 className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => handleDeleteItem(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-[1200px] max-h-[90vh] p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="p-3 sm:p-4 pb-2 border-b">
          <DialogTitle className="flex items-center justify-between text-base sm:text-lg">
            <span>ئەنجامی هێنان - {items.length} مادە</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Loading State */}
          {isCheckingDuplicates && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">چاوەڕوان بە... پشکنینی مادە دووبارەکان</p>
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="font-medium">هێنانی مادەکان...</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {importProgress.current} / {importProgress.total}
              </p>
            </div>
          )}

          {!isCheckingDuplicates && (
            <>
              {/* Stats - Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                <div className="rounded-lg bg-muted/50 p-2 sm:p-3 text-center">
                  <p className="text-lg sm:text-xl font-bold text-foreground">{items.length}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">کۆی مادەکان</p>
                </div>
                <div className="rounded-lg bg-success/10 p-2 sm:p-3 text-center border border-success/20">
                  <div className="flex items-center justify-center gap-1">
                    <Plus className="h-4 w-4 text-success" />
                    <p className="text-lg sm:text-xl font-bold text-success">{newItems.length}</p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">مادەی نوێ</p>
                </div>
                <div className="rounded-lg bg-warning/10 p-2 sm:p-3 text-center border border-warning/20">
                  <div className="flex items-center justify-center gap-1">
                    <RefreshCw className="h-4 w-4 text-warning" />
                    <p className="text-lg sm:text-xl font-bold text-warning">{duplicateItems.length}</p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">دووبارە (پێشتر هەیە)</p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-2 sm:p-3 text-center border border-destructive/20">
                  <div className="flex items-center justify-center gap-1">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-lg sm:text-xl font-bold text-destructive">{incompleteItems.length}</p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">پێویستی چاککردن</p>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-3 h-auto">
                  <TabsTrigger value="all" className="text-[10px] sm:text-xs px-1 py-2">
                    هەموو ({items.length})
                  </TabsTrigger>
                  <TabsTrigger value="new" className="text-[10px] sm:text-xs px-1 py-2 text-success">
                    نوێ ({newItems.length})
                  </TabsTrigger>
                  <TabsTrigger value="duplicate" className="text-[10px] sm:text-xs px-1 py-2 text-warning">
                    دووبارە ({duplicateItems.length})
                  </TabsTrigger>
                  <TabsTrigger value="incomplete" className="text-[10px] sm:text-xs px-1 py-2 text-destructive">
                    هەڵە ({incompleteItems.length})
                  </TabsTrigger>
                </TabsList>

                {/* Mobile Cards View */}
                <div className="block sm:hidden">
                  <ScrollArea className="h-[40vh] rounded-md border p-2">
                    <div className="space-y-2">
                      {(activeTab === "all" ? items : 
                        activeTab === "new" ? newItems :
                        activeTab === "duplicate" ? duplicateItems : 
                        incompleteItems).map((item) => (
                        <div 
                          key={item.id} 
                          className={`p-3 rounded-lg border ${
                            item.hasError ? "bg-destructive/5 border-destructive/30" :
                            item.isDuplicate ? "bg-warning/5 border-warning/30" :
                            "bg-success/5 border-success/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name || "بەتاڵە"}</p>
                              <p className="text-xs text-muted-foreground">{item.barcode || "بەتاڵە"}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.brand && <Badge variant="outline" className="text-[10px] h-5">{item.brand}</Badge>}
                                {item.category && <Badge variant="outline" className="text-[10px] h-5">{item.category}</Badge>}
                                <Badge variant="secondary" className="text-[10px] h-5">بڕ: {item.quantity}</Badge>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {item.hasError ? (
                                <Badge variant="destructive" className="text-[10px]">هەڵە</Badge>
                              ) : item.isDuplicate ? (
                                <Badge className="text-[10px] bg-warning text-warning-foreground">دووبارە</Badge>
                              ) : (
                                <Badge className="text-[10px] bg-success text-success-foreground">نوێ</Badge>
                              )}
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-destructive"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block">
                  <ScrollArea className="h-[45vh] rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="text-xs">ناوی بەرهەم</TableHead>
                          <TableHead className="text-xs">باڕکۆد</TableHead>
                          <TableHead className="text-xs">براند</TableHead>
                          <TableHead className="text-xs">کەتەگۆری</TableHead>
                          <TableHead className="text-xs">بڕ</TableHead>
                          <TableHead className="text-xs hidden lg:table-cell">نرخی بۆکس</TableHead>
                          <TableHead className="text-xs hidden lg:table-cell">نرخی دانە</TableHead>
                          <TableHead className="text-xs hidden xl:table-cell">نرخی کیلۆ</TableHead>
                          <TableHead className="text-xs hidden xl:table-cell">کەمترین ستۆک</TableHead>
                          <TableHead className="text-xs">بارودۆخ</TableHead>
                          <TableHead className="text-xs">کردار</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeTab === "all" && items.map(renderItemRow)}
                        {activeTab === "new" && newItems.map(renderItemRow)}
                        {activeTab === "duplicate" && duplicateItems.map(renderItemRow)}
                        {activeTab === "incomplete" && incompleteItems.map(renderItemRow)}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </Tabs>

              {/* Actions */}
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {newItems.length > 0 && <span className="text-success font-medium">{newItems.length} مادەی نوێ</span>}
                    {newItems.length > 0 && duplicateItems.length > 0 && " · "}
                    {duplicateItems.length > 0 && <span className="text-warning font-medium">{duplicateItems.length} دووبارە</span>}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
                    پاشگەزبوونەوە
                  </Button>
                  {newItems.length > 0 && (
                    <Button
                      onClick={handleImportNew}
                      disabled={isImporting}
                      className="gap-2 flex-1 sm:flex-none bg-success hover:bg-success/90"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">چاوەڕوان بە...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          زیادکردنی {newItems.length} مادەی نوێ
                        </>
                      )}
                    </Button>
                  )}
                  {duplicateItems.length > 0 && (
                    <Button
                      onClick={handleUpdateDuplicates}
                      disabled={isImporting}
                      variant="outline"
                      className="gap-2 flex-1 sm:flex-none border-warning text-warning hover:bg-warning/10"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">چاوەڕوان بە...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          نوێکردنەوەی {duplicateItems.length} مادەی دووبارە
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
