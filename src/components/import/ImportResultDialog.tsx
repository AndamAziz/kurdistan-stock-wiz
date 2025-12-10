import { useState } from "react";
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
  isComplete: boolean;
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
  const [items, setItems] = useState<ImportedItem[]>(importedItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { data: brands = [] } = useBrands();
  const { data: categories = [] } = useCategories();

  const completeItems = items.filter((item) => item.isComplete && !item.hasError);
  const incompleteItems = items.filter((item) => !item.isComplete || item.hasError);

  const handleUpdateItem = (id: string, field: keyof ImportedItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Check if item is complete
        const isComplete =
          updated.name?.trim() !== "" &&
          updated.barcode?.trim() !== "" &&
          updated.quantity >= 0;

        return {
          ...updated,
          isComplete,
          hasError: !isComplete,
          errorMessage: !isComplete ? "زانیاری پێویست تەواو نییە" : undefined,
        };
      })
    );
  };

  const handleImportAll = async () => {
    const itemsToImport = completeItems;
    if (itemsToImport.length === 0) {
      toast.error("هیچ مادەیەکی تەواو نییە بۆ هێنان");
      return;
    }

    setIsImporting(true);

    try {
      // Get brand and category mappings
      const brandMap = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));
      const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

      let addedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      for (const item of itemsToImport) {
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

          // Check if item already exists by barcode
          const { data: existingItem } = await supabase
            .from("items")
            .select("id")
            .eq("barcode", item.barcode.trim())
            .maybeSingle();

          if (existingItem) {
            // Update existing item
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
              .eq("id", existingItem.id);

            if (updateError) {
              errorCount++;
            } else {
              updatedCount++;
            }
          } else {
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
          }
        } catch {
          errorCount++;
        }
      }

      // Show appropriate messages
      const messages: string[] = [];
      if (addedCount > 0) {
        messages.push(`${addedCount} مادەی نوێ زیادکرا`);
      }
      if (updatedCount > 0) {
        messages.push(`${updatedCount} مادە نوێکرایەوە`);
      }
      
      if (messages.length > 0) {
        toast.success(messages.join(" و "));
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

  const renderItemRow = (item: ImportedItem) => (
    <TableRow key={item.id} className={item.hasError ? "bg-destructive/5" : ""}>
      <TableCell className="font-medium">
        {editingId === item.id ? (
          <Input
            value={item.name}
            onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
            className="h-8"
          />
        ) : (
          item.name || <span className="text-destructive">-</span>
        )}
      </TableCell>
      <TableCell>
        {editingId === item.id ? (
          <Input
            value={item.barcode}
            onChange={(e) => handleUpdateItem(item.id, "barcode", e.target.value)}
            className="h-8"
          />
        ) : (
          item.barcode || <span className="text-destructive">-</span>
        )}
      </TableCell>
      <TableCell>{renderEditableCell(item, "brand", "select")}</TableCell>
      <TableCell>{renderEditableCell(item, "category", "select")}</TableCell>
      <TableCell>{renderEditableCell(item, "quantity", "number")}</TableCell>
      <TableCell>{renderEditableCell(item, "box_price", "number")}</TableCell>
      <TableCell>{renderEditableCell(item, "piece_price", "number")}</TableCell>
      <TableCell>{renderEditableCell(item, "price_per_kg", "number")}</TableCell>
      <TableCell>{renderEditableCell(item, "min_stock", "number")}</TableCell>
      <TableCell>
        {item.hasError ? (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            کێشە
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 bg-success/10 text-success">
            <CheckCircle2 className="h-3 w-3" />
            ئامادە
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setEditingId(editingId === item.id ? null : item.id)}
        >
          {editingId === item.id ? (
            <Save className="h-4 w-4" />
          ) : (
            <Edit2 className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0" dir="rtl">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>ئەنجامی هێنان - {items.length} مادە</span>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg bg-success/10 p-4 text-center">
              <p className="text-2xl font-bold text-success">{completeItems.length}</p>
              <p className="text-sm text-muted-foreground">ئامادە بۆ هێنان</p>
            </div>
            <div className="rounded-lg bg-destructive/10 p-4 text-center">
              <p className="text-2xl font-bold text-destructive">
                {incompleteItems.length}
              </p>
              <p className="text-sm text-muted-foreground">پێویستی چاککردن</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all">هەموو ({items.length})</TabsTrigger>
              <TabsTrigger value="complete">
                ئامادە ({completeItems.length})
              </TabsTrigger>
              <TabsTrigger value="incomplete">
                پێویستی چاککردن ({incompleteItems.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ناوی بەرهەم</TableHead>
                    <TableHead>باڕکۆد</TableHead>
                    <TableHead>براند</TableHead>
                    <TableHead>کەتەگۆری</TableHead>
                    <TableHead>بڕ</TableHead>
                    <TableHead>نرخی بۆکس</TableHead>
                    <TableHead>نرخی دانە</TableHead>
                    <TableHead>نرخی کیلۆ</TableHead>
                    <TableHead>کەمترین ستۆک</TableHead>
                    <TableHead>بارودۆخ</TableHead>
                    <TableHead>دەسکاری</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTab === "all" && items.map(renderItemRow)}
                  {activeTab === "complete" && completeItems.map(renderItemRow)}
                  {activeTab === "incomplete" && incompleteItems.map(renderItemRow)}
                </TableBody>
              </Table>
            </ScrollArea>
          </Tabs>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {completeItems.length} مادە ئامادەن بۆ هێنان
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                پاشگەزبوونەوە
              </Button>
              <Button
                onClick={handleImportAll}
                disabled={completeItems.length === 0 || isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    چاوەڕوان بە...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    هێنانی {completeItems.length} مادە
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
