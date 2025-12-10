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

  // Initialize markets when dialog opens - duplicates already marked by parent
  useEffect(() => {
    if (open && initialMarkets.length > 0) {
      setMarkets(initialMarkets);
    }
  }, [open, initialMarkets]);

  // Filter markets - isDuplicate is already set by parent component
  const newMarkets = markets.filter((m) => m.isComplete && !(m as any).isDuplicate);
  const duplicateMarkets = markets.filter((m) => (m as any).isDuplicate);
  const incompleteMarkets = markets.filter((m) => !m.isComplete && !(m as any).isDuplicate);

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
    if (newMarkets.length === 0) {
      toast.error("هیچ ماڕکێتێکی نوێ نییە بۆ import کردن");
      return;
    }

    setIsImporting(true);

    try {
      // Prepare all markets for insert
      const marketsToInsert = newMarkets.map(market => ({
        code: market.code.trim(),
        name: market.name.trim(),
        trader_category: market.trader_category?.trim() || null,
        phone: market.phone?.trim() || null,
        address: market.address?.trim() || null,
        city: market.city?.trim() || null,
        zone: market.zone?.trim() || null,
      }));

      // Insert in chunks to avoid timeout and handle duplicates gracefully
      const chunkSize = 100;
      let successCount = 0;
      let skipCount = 0;

      for (let i = 0; i < marketsToInsert.length; i += chunkSize) {
        const chunk = marketsToInsert.slice(i, i + chunkSize);
        
        // Use upsert with onConflict to skip duplicates
        const { data, error } = await supabase
          .from("markets")
          .upsert(chunk, { 
            onConflict: 'code',
            ignoreDuplicates: true 
          })
          .select();

        if (error) {
          console.error("Chunk insert error:", error);
          skipCount += chunk.length;
        } else {
          successCount += data?.length || 0;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} ماڕکێتی نوێ زیادکران`);
      }
      
      if (duplicateMarkets.length > 0 || skipCount > 0) {
        toast.info(`${duplicateMarkets.length + skipCount} ماڕکێت پێشتر هەبوون و زیادنەکران`);
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

  const renderMarketRow = (market: ImportedMarket) => {
    const isDuplicate = (market as any).isDuplicate;
    
    return (
      <TableRow key={market.id} className={isDuplicate ? "opacity-60" : ""}>
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
            {isDuplicate ? (
              <Badge variant="secondary" className="text-xs">
                دووبارە
              </Badge>
            ) : market.isComplete ? (
              <Badge variant="default" className="bg-success text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                نوێ
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                کەموکوڕی
              </Badge>
            )}
            {!isDuplicate && (
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
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>ئەنجامی خوێندنەوەی ماڕکێتەکان</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-success">
                  {newMarkets.length}
                </Badge>
                <span>ماڕکێتی نوێ</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {duplicateMarkets.length}
                </Badge>
                <span>دووبارە (زیاد ناکرێن)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{incompleteMarkets.length}</Badge>
            <span>ناتەواو</span>
          </div>
        </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">هەموو ({markets.length})</TabsTrigger>
              <TabsTrigger value="new">
                نوێ ({newMarkets.length})
              </TabsTrigger>
              <TabsTrigger value="duplicate">
                دووبارە ({duplicateMarkets.length})
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

            <TabsContent value="new">
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
                    {newMarkets.map((market) => renderMarketRow(market))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="duplicate">
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
                    {duplicateMarkets.map((market) => renderMarketRow(market))}
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
              disabled={isImporting || newMarkets.length === 0}
              className="gap-2"
            >
              {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
              Import کردنی ماڕکێتە نوێیەکان ({newMarkets.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
