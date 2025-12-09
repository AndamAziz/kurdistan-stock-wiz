import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, Edit, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useItems } from "@/hooks/useItems";

export interface ImportedStockOutItem {
  id: string;
  market_code: string;
  market_name: string;
  market_phone: string;
  item_barcode: string;
  item_name: string;
  boxes: number;
  pieces: number;
  gifts: number;
  price: number;
  total_price: number;
  note: string;
  hasError: boolean;
  isComplete: boolean;
  errorMessage?: string;
}

interface StockOutImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importedItems: ImportedStockOutItem[];
  onImportComplete: () => void;
}

export function StockOutImportResultDialog({
  open,
  onOpenChange,
  importedItems: initialItems,
  onImportComplete,
}: StockOutImportResultDialogProps) {
  const [items, setItems] = useState<ImportedStockOutItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { data: inventoryItems = [] } = useItems();

  useEffect(() => {
    if (open && initialItems.length > 0) {
      setItems(initialItems);
    }
  }, [open, initialItems]);

  const completeItems = items.filter((i) => i.isComplete);
  const incompleteItems = items.filter((i) => !i.isComplete);

  const handleUpdateItem = (
    id: string,
    field: keyof ImportedStockOutItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Recalculate total price
        if (field === "boxes" || field === "pieces" || field === "price") {
          const quantity = (Number(updated.boxes) || 0) + (Number(updated.pieces) || 0);
          updated.total_price = quantity * (Number(updated.price) || 0);
        }

        // Validate required fields
        const isComplete =
          updated.item_name?.trim() !== "" &&
          ((updated.boxes > 0 || updated.pieces > 0));
        updated.isComplete = isComplete;
        updated.hasError = !isComplete;
        updated.errorMessage = isComplete ? undefined : "ناوی بەرهەم و بڕ پێویستن";

        return updated;
      })
    );
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SO-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${random}`;
  };

  const handleImportAll = async () => {
    if (completeItems.length === 0) {
      toast.error("هیچ بەرهەمێکی تەواو نییە بۆ import کردن");
      return;
    }

    setIsImporting(true);

    try {
      // Group items by market
      const groupedByMarket: Record<string, ImportedStockOutItem[]> = {};
      
      for (const item of completeItems) {
        const marketKey = item.market_code || item.market_name || "unknown";
        if (!groupedByMarket[marketKey]) {
          groupedByMarket[marketKey] = [];
        }
        groupedByMarket[marketKey].push(item);
      }

      let invoiceCount = 0;
      let itemCount = 0;
      let errorCount = 0;

      for (const [marketKey, marketItems] of Object.entries(groupedByMarket)) {
        try {
          const firstItem = marketItems[0];
          const invoiceNumber = generateInvoiceNumber();
          const totalAmount = marketItems.reduce((sum, i) => sum + (i.total_price || 0), 0);

          // Create invoice
          const { data: invoice, error: invoiceError } = await supabase
            .from("invoices")
            .insert({
              invoice_number: invoiceNumber,
              invoice_type: "stock_out",
              recipient_name: firstItem.market_name || null,
              recipient_phone: firstItem.market_phone || null,
              total_amount: totalAmount,
              invoice_date: new Date().toISOString().split("T")[0],
              created_by: user?.id || null,
            })
            .select()
            .single();

          if (invoiceError) throw invoiceError;

          // Create invoice items
          const invoiceItemsData = marketItems.map((item) => {
            // Find matching inventory item
            const inventoryItem = inventoryItems.find(
              (inv) => inv.barcode === item.item_barcode || inv.name === item.item_name
            );

            const quantity = (item.boxes || 0) + (item.pieces || 0);

            return {
              invoice_id: invoice.id,
              item_id: inventoryItem?.id || null,
              item_name: item.item_name.trim(),
              item_barcode: item.item_barcode?.trim() || null,
              item_brand: inventoryItem?.brands?.name || null,
              item_category: inventoryItem?.categories?.name || null,
              item_unit: inventoryItem?.unit || null,
              quantity: quantity,
              boxes: item.boxes || 0,
              pieces: item.pieces || 0,
              gifts: item.gifts || 0,
              weight_kg: 0,
              weight_gram: 0,
              price: item.price || 0,
              total_price: item.total_price || 0,
              note: item.note?.trim() || null,
            };
          });

          const { error: itemsError } = await supabase
            .from("invoice_items")
            .insert(invoiceItemsData);

          if (itemsError) throw itemsError;

          // Create stock movements for each item
          for (const item of marketItems) {
            const inventoryItem = inventoryItems.find(
              (inv) => inv.barcode === item.item_barcode || inv.name === item.item_name
            );

            if (inventoryItem) {
              const quantity = (item.boxes || 0) + (item.pieces || 0);
              
              const { error: movementError } = await supabase
                .from("stock_movements")
                .insert({
                  item_id: inventoryItem.id,
                  movement_type: "OUT",
                  quantity: quantity,
                  price: item.price || 0,
                  movement_date: new Date().toISOString().split("T")[0],
                  created_by: user?.id || null,
                  note: `Import - ${firstItem.market_name || "Excel"}`,
                });

              if (movementError) {
                console.error("Stock movement error:", movementError);
              }
            }
          }

          invoiceCount++;
          itemCount += marketItems.length;
        } catch (error) {
          console.error("Error importing market invoice:", error);
          errorCount++;
        }
      }

      if (invoiceCount > 0) {
        toast.success(`${invoiceCount} ئینڤۆیس و ${itemCount} بەرهەم بە سەرکەوتوویی زیادکران`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} ئینڤۆیس زیادنەکران`);
      }

      onImportComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("هەڵە لە import کردن");
    } finally {
      setIsImporting(false);
    }
  };

  const renderEditableCell = (
    item: ImportedStockOutItem,
    field: keyof ImportedStockOutItem,
    type: "text" | "number" = "text"
  ) => {
    const isEditing = editingId === item.id;
    const value = item[field];

    if (isEditing) {
      return (
        <Input
          type={type}
          value={value?.toString() || ""}
          onChange={(e) =>
            handleUpdateItem(
              item.id,
              field,
              type === "number" ? parseFloat(e.target.value) || 0 : e.target.value
            )
          }
          className="h-8 text-xs w-full"
        />
      );
    }

    return (
      <span className={!value ? "text-muted-foreground italic" : ""}>
        {value?.toString() || "-"}
      </span>
    );
  };

  const renderItemRow = (item: ImportedStockOutItem) => (
    <TableRow key={item.id}>
      <TableCell className="text-xs">
        {renderEditableCell(item, "market_name")}
      </TableCell>
      <TableCell className="text-xs">
        {renderEditableCell(item, "item_name")}
      </TableCell>
      <TableCell className="text-xs">
        {renderEditableCell(item, "item_barcode")}
      </TableCell>
      <TableCell className="text-xs">
        {renderEditableCell(item, "boxes", "number")}
      </TableCell>
      <TableCell className="text-xs">
        {renderEditableCell(item, "pieces", "number")}
      </TableCell>
      <TableCell className="text-xs">
        {renderEditableCell(item, "gifts", "number")}
      </TableCell>
      <TableCell className="text-xs">
        {renderEditableCell(item, "price", "number")}
      </TableCell>
      <TableCell className="text-xs font-medium">
        {item.total_price?.toLocaleString() || 0}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {item.isComplete ? (
            <Badge variant="default" className="bg-success text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              تەواو
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              کەموکوڕی
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setEditingId(editingId === item.id ? null : item.id)
            }
          >
            {editingId === item.id ? (
              <Save className="w-4 h-4" />
            ) : (
              <Edit className="w-4 h-4" />
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  const renderTable = (itemsToRender: ImportedStockOutItem[]) => (
    <ScrollArea className="h-[400px] border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">ماڕکێت</TableHead>
            <TableHead className="text-xs">ناوی بەرهەم</TableHead>
            <TableHead className="text-xs">باڕکۆد</TableHead>
            <TableHead className="text-xs">بۆکس</TableHead>
            <TableHead className="text-xs">دانە</TableHead>
            <TableHead className="text-xs">بەخشین</TableHead>
            <TableHead className="text-xs">نرخ</TableHead>
            <TableHead className="text-xs">کۆ</TableHead>
            <TableHead className="text-xs">بارودۆخ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itemsToRender.map((item) => renderItemRow(item))}
        </TableBody>
      </Table>
    </ScrollArea>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>ئەنجامی خوێندنەوەی فرۆشتنەکان</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-success">
                {completeItems.length}
              </Badge>
              <span>بەرهەمی تەواو</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">{incompleteItems.length}</Badge>
              <span>بەرهەمی ناتەواو</span>
            </div>
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">هەموو ({items.length})</TabsTrigger>
              <TabsTrigger value="complete">
                تەواو ({completeItems.length})
              </TabsTrigger>
              <TabsTrigger value="incomplete">
                ناتەواو ({incompleteItems.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">{renderTable(items)}</TabsContent>
            <TabsContent value="complete">{renderTable(completeItems)}</TabsContent>
            <TabsContent value="incomplete">{renderTable(incompleteItems)}</TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              داخستن
            </Button>
            <Button
              onClick={handleImportAll}
              disabled={isImporting || completeItems.length === 0}
              className="gap-2"
            >
              {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
              Import کردنی فرۆشتنەکان ({completeItems.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}