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
import { Loader2, CheckCircle, AlertCircle, Edit, Save, Trash2, X, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface ImportedMarket {
  id: string;
  code: string;
  name: string;
  trader_category: string;
  phone: string;
  address: string;
  city: string;
  zone: string;
  hasError: boolean;
  isComplete: boolean;
  errorMessage?: string;
}

interface MarketImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importedMarkets: ImportedMarket[];
  onImportComplete: () => void;
}

export function MarketImportResultDialog({
  open,
  onOpenChange,
  importedMarkets: initialMarkets,
  onImportComplete,
}: MarketImportResultDialogProps) {
  const [markets, setMarkets] = useState<ImportedMarket[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Update state when dialog opens with new data
  useEffect(() => {
    if (open && initialMarkets.length > 0) {
      setMarkets(initialMarkets);
    }
  }, [open, initialMarkets]);

  const completeMarkets = markets.filter((m) => m.isComplete);
  const incompleteMarkets = markets.filter((m) => !m.isComplete);

  const handleUpdateMarket = (
    id: string,
    field: keyof ImportedMarket,
    value: string
  ) => {
    setMarkets((prev) =>
      prev.map((market) => {
        if (market.id !== id) return market;

        const updated = { ...market, [field]: value };

        // Validate required fields
        const isComplete =
          updated.name?.trim() !== "" && updated.code?.trim() !== "";
        updated.isComplete = isComplete;
        updated.hasError = !isComplete;
        updated.errorMessage = isComplete ? undefined : "ناو و کۆد پێویستن";

        return updated;
      })
    );
  };

  const handleDeleteMarket = (id: string) => {
    setMarkets((prev) => prev.filter((m) => m.id !== id));
  };

  const handleImportAll = async () => {
    if (completeMarkets.length === 0) {
      toast.error("هیچ ماڕکێتێکی تەواو نییە بۆ import کردن");
      return;
    }

    setIsImporting(true);

    try {
      let addedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      for (const market of completeMarkets) {
        try {
          // Check if market already exists by code
          const { data: existingMarket } = await supabase
            .from("markets")
            .select("id")
            .eq("code", market.code.trim())
            .maybeSingle();

          const { error } = await supabase.from("markets").upsert(
            {
              code: market.code.trim(),
              name: market.name.trim(),
              trader_category: market.trader_category?.trim() || null,
              phone: market.phone?.trim() || null,
              address: market.address?.trim() || null,
              city: market.city?.trim() || null,
              zone: market.zone?.trim() || null,
            },
            { onConflict: "code" }
          );

          if (error) throw error;
          
          if (existingMarket) {
            updatedCount++;
          } else {
            addedCount++;
          }
        } catch (error) {
          console.error("Error importing market:", error);
          errorCount++;
        }
      }

      // Show detailed result message
      const messages: string[] = [];
      if (addedCount > 0) {
        messages.push(`${addedCount} ماڕکێتی نوێ زیادکرا`);
      }
      if (updatedCount > 0) {
        messages.push(`${updatedCount} ماڕکێت نوێکرایەوە`);
      }
      
      if (messages.length > 0) {
        toast.success(messages.join(" و "), {
          icon: addedCount > 0 && updatedCount > 0 ? <RefreshCw className="h-4 w-4" /> : undefined,
        });
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} ماڕکێت زیادنەکران`);
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
    market: ImportedMarket,
    field: keyof ImportedMarket
  ) => {
    const isEditing = editingId === market.id;
    const value = market[field] as string;

    if (isEditing) {
      return (
        <Input
          value={value || ""}
          onChange={(e) => handleUpdateMarket(market.id, field, e.target.value)}
          className="h-8 text-xs"
        />
      );
    }

    return (
      <span className={!value ? "text-muted-foreground italic" : ""}>
        {value || "-"}
      </span>
    );
  };

  const renderMarketRow = (market: ImportedMarket) => (
    <TableRow key={market.id} className={!market.isComplete ? "bg-destructive/5" : ""}>
      <TableCell className="text-xs">
        {renderEditableCell(market, "code")}
      </TableCell>
      <TableCell className="text-xs">
        {renderEditableCell(market, "name")}
      </TableCell>
      <TableCell className="text-xs">
        {renderEditableCell(market, "trader_category")}
      </TableCell>
      <TableCell className="text-xs">
        {renderEditableCell(market, "phone")}
      </TableCell>
      <TableCell className="text-xs max-w-[150px] truncate">
        {renderEditableCell(market, "address")}
      </TableCell>
      <TableCell className="text-xs">
        {renderEditableCell(market, "city")}
      </TableCell>
      <TableCell className="text-xs">
        {renderEditableCell(market, "zone")}
      </TableCell>
      <TableCell>
        {market.isComplete ? (
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
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() =>
              setEditingId(editingId === market.id ? null : market.id)
            }
          >
            {editingId === market.id ? (
              <Save className="w-4 h-4" />
            ) : (
              <Edit className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => handleDeleteMarket(market.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] p-0" dir="rtl">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>ئەنجامی خوێندنەوەی ماڕکێتەکان - {markets.length} ماڕکێت</span>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{markets.length}</p>
              <p className="text-sm text-muted-foreground">کۆی ماڕکێتەکان</p>
            </div>
            <div className="rounded-lg bg-success/10 p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Plus className="h-5 w-5 text-success" />
                <p className="text-2xl font-bold text-success">{completeMarkets.length}</p>
              </div>
              <p className="text-sm text-muted-foreground">ئامادە بۆ Import</p>
            </div>
            <div className="rounded-lg bg-destructive/10 p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-2xl font-bold text-destructive">{incompleteMarkets.length}</p>
              </div>
              <p className="text-sm text-muted-foreground">پێویستی چاککردن</p>
              {incompleteMarkets.length > 0 && (
                <p className="text-xs text-destructive mt-1">
                  ناو یان کۆد بەتاڵە
                </p>
              )}
            </div>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all">هەموو ({markets.length})</TabsTrigger>
              <TabsTrigger value="complete">
                ئامادە ({completeMarkets.length})
              </TabsTrigger>
              <TabsTrigger value="incomplete">
                پێویستی چاککردن ({incompleteMarkets.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[50vh] rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="text-xs w-[80px]">کۆد</TableHead>
                    <TableHead className="text-xs w-[150px]">ناو</TableHead>
                    <TableHead className="text-xs w-[100px]">جۆر</TableHead>
                    <TableHead className="text-xs w-[120px]">مۆبایل</TableHead>
                    <TableHead className="text-xs">ناونیشان</TableHead>
                    <TableHead className="text-xs w-[100px]">شار</TableHead>
                    <TableHead className="text-xs w-[100px]">ناوچە</TableHead>
                    <TableHead className="text-xs w-[80px]">بارودۆخ</TableHead>
                    <TableHead className="text-xs w-[80px]">کردار</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TabsContent value="all" className="mt-0">
                    {markets.map((market) => renderMarketRow(market))}
                  </TabsContent>
                  <TabsContent value="complete" className="mt-0">
                    {completeMarkets.map((market) => renderMarketRow(market))}
                  </TabsContent>
                  <TabsContent value="incomplete" className="mt-0">
                    {incompleteMarkets.map((market) => renderMarketRow(market))}
                  </TabsContent>
                </TableBody>
              </Table>
            </ScrollArea>
          </Tabs>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {completeMarkets.length} ماڕکێت ئامادەن بۆ Import
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                پاشگەزبوونەوە
              </Button>
              <Button
                onClick={handleImportAll}
                disabled={isImporting || completeMarkets.length === 0}
                className="gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    چاوەڕوان بە...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Import کردنی {completeMarkets.length} ماڕکێت
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
