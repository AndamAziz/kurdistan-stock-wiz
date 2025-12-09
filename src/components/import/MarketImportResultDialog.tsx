import { useState } from "react";
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
  const [markets, setMarkets] = useState<ImportedMarket[]>(initialMarkets);
  const [isImporting, setIsImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Update state when dialog opens with new data
  useState(() => {
    setMarkets(initialMarkets);
  });

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

  const handleImportAll = async () => {
    if (completeMarkets.length === 0) {
      toast.error("هیچ ماڕکێتێکی تەواو نییە بۆ import کردن");
      return;
    }

    setIsImporting(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const market of completeMarkets) {
        try {
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
          successCount++;
        } catch (error) {
          console.error("Error importing market:", error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} ماڕکێت بە سەرکەوتوویی زیادکران`);
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
    <TableRow key={market.id}>
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
        <div className="flex items-center gap-2">
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
          <Button
            variant="ghost"
            size="sm"
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
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>ئەنجامی خوێندنەوەی ماڕکێتەکان</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-success">
                {completeMarkets.length}
              </Badge>
              <span>ماڕکێتی تەواو</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">{incompleteMarkets.length}</Badge>
              <span>ماڕکێتی ناتەواو</span>
            </div>
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">هەموو ({markets.length})</TabsTrigger>
              <TabsTrigger value="complete">
                تەواو ({completeMarkets.length})
              </TabsTrigger>
              <TabsTrigger value="incomplete">
                ناتەواو ({incompleteMarkets.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">کۆد</TableHead>
                      <TableHead className="text-xs">ناو</TableHead>
                      <TableHead className="text-xs">جۆر</TableHead>
                      <TableHead className="text-xs">مۆبایل</TableHead>
                      <TableHead className="text-xs">ناونیشان</TableHead>
                      <TableHead className="text-xs">شار</TableHead>
                      <TableHead className="text-xs">ناوچە</TableHead>
                      <TableHead className="text-xs">بارودۆخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {markets.map((market) => renderMarketRow(market))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="complete">
              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">کۆد</TableHead>
                      <TableHead className="text-xs">ناو</TableHead>
                      <TableHead className="text-xs">جۆر</TableHead>
                      <TableHead className="text-xs">مۆبایل</TableHead>
                      <TableHead className="text-xs">ناونیشان</TableHead>
                      <TableHead className="text-xs">شار</TableHead>
                      <TableHead className="text-xs">ناوچە</TableHead>
                      <TableHead className="text-xs">بارودۆخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completeMarkets.map((market) => renderMarketRow(market))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="incomplete">
              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">کۆد</TableHead>
                      <TableHead className="text-xs">ناو</TableHead>
                      <TableHead className="text-xs">جۆر</TableHead>
                      <TableHead className="text-xs">مۆبایل</TableHead>
                      <TableHead className="text-xs">ناونیشان</TableHead>
                      <TableHead className="text-xs">شار</TableHead>
                      <TableHead className="text-xs">ناوچە</TableHead>
                      <TableHead className="text-xs">بارودۆخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incompleteMarkets.map((market) => renderMarketRow(market))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              داخستن
            </Button>
            <Button
              onClick={handleImportAll}
              disabled={isImporting || completeMarkets.length === 0}
              className="gap-2"
            >
              {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
              Import کردنی ماڕکێتەکان ({completeMarkets.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
