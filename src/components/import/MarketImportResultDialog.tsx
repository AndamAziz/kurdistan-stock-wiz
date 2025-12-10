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
  isDuplicate?: boolean;
  existingMarketId?: string;
  matchedBy?: 'code' | 'name' | null;
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
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  // Check for duplicates when dialog opens - by CODE and NAME
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!open || initialMarkets.length === 0) return;
      
      setIsCheckingDuplicates(true);
      
      try {
        // Query all existing markets
        const { data: existingMarkets } = await supabase
          .from("markets")
          .select("id, code, name");
        
        // Create maps for both code and name matching
        const existingCodeMap = new Map(
          existingMarkets?.filter(m => m.code).map(m => [m.code.toLowerCase().trim(), m.id]) || []
        );
        const existingNameMap = new Map(
          existingMarkets?.filter(m => m.name).map(m => [m.name.toLowerCase().trim(), m.id]) || []
        );
        
        // Mark duplicates - check by code first, then by name
        const marketsWithDuplicates = initialMarkets.map(market => {
          const codeMatch = market.code?.trim() ? existingCodeMap.get(market.code.trim().toLowerCase()) : null;
          const nameMatch = market.name?.trim() ? existingNameMap.get(market.name.trim().toLowerCase()) : null;
          
          // If code exists, match by code; if not, match by name
          const matchedId = market.code?.trim() ? codeMatch : (codeMatch || nameMatch);
          
          return {
            ...market,
            isDuplicate: !!matchedId,
            existingMarketId: matchedId,
            matchedBy: codeMatch ? 'code' as const : (nameMatch ? 'name' as const : null),
          };
        });
        
        setMarkets(marketsWithDuplicates);
      } catch (error) {
        console.error("Error checking duplicates:", error);
        setMarkets(initialMarkets);
      } finally {
        setIsCheckingDuplicates(false);
      }
    };
    
    checkDuplicates();
  }, [open, initialMarkets]);

  // All markets are valid for import
  const allMarkets = markets;
  const incompleteMarkets = markets.filter((m) => !m.name?.trim());
  const newMarkets = markets.filter((m) => !m.isDuplicate);
  const duplicateMarkets = markets.filter((m) => m.isDuplicate);

  const handleUpdateMarket = (
    id: string,
    field: keyof ImportedMarket,
    value: string
  ) => {
    setMarkets((prev) =>
      prev.map((market) => {
        if (market.id !== id) return market;

        const updated = { ...market, [field]: value };

        // Only name is required now
        const isComplete = updated.name?.trim() !== "";
        updated.isComplete = isComplete;
        updated.hasError = !isComplete;
        updated.errorMessage = isComplete ? undefined : "ناو پێویستە";

        return updated;
      })
    );
  };

  const handleDeleteMarket = (id: string) => {
    setMarkets((prev) => prev.filter((m) => m.id !== id));
  };

  // Import ALL markets - Smart upsert with auto-generated codes
  const handleImportAll = async () => {
    if (markets.length === 0) {
      toast.info("هیچ ماڕکێتێک نییە بۆ import کردن");
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: markets.length });

    try {
      let addedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;
      const failedMarkets: string[] = [];

      // Get the max Sir# for auto-generating codes
      const { data: maxCodeData } = await supabase
        .from("markets")
        .select("code")
        .order("code", { ascending: false })
        .limit(100);
      
      // Find highest numeric code to continue from
      let nextSirNumber = 1;
      if (maxCodeData) {
        for (const m of maxCodeData) {
          const numMatch = m.code?.match(/^(\d+)$/);
          if (numMatch) {
            const num = parseInt(numMatch[1], 10);
            if (num >= nextSirNumber) {
              nextSirNumber = num + 1;
            }
          }
        }
      }

      for (let i = 0; i < markets.length; i++) {
        const market = markets[i];
        setImportProgress({ current: i + 1, total: markets.length });

        try {
          // Auto-generate name if missing
          const marketName = market.name?.trim() || `ماڕکێت-${Date.now()}`;
          
          // Smart matching: check by code first, then by name if no code
          let existingMarketId: string | null = null;
          
          if (market.code?.trim()) {
            // Has code - check by code
            const { data: byCode } = await supabase
              .from("markets")
              .select("id")
              .eq("code", market.code.trim())
              .maybeSingle();
            existingMarketId = byCode?.id || null;
          }
          
          // If no code or no match by code, try matching by name
          if (!existingMarketId && marketName) {
            const { data: byName } = await supabase
              .from("markets")
              .select("id, code")
              .ilike("name", marketName)
              .maybeSingle();
            existingMarketId = byName?.id || null;
          }
          
          // Generate code only if inserting new market
          const marketCode = market.code?.trim() || String(nextSirNumber++);

          if (existingMarketId) {
            // Update existing market
            const { error: updateError } = await supabase
              .from("markets")
              .update({
                name: marketName,
                trader_category: market.trader_category?.trim() || null,
                phone: market.phone?.trim() || null,
                address: market.address?.trim() || null,
                city: market.city?.trim() || null,
                zone: market.zone?.trim() || null,
              })
              .eq("id", existingMarketId);

            if (updateError) {
              console.error("Update error for market:", market.name, updateError);
              errorCount++;
              failedMarkets.push(market.name || marketCode);
            } else {
              updatedCount++;
            }
          } else {
            // Insert new market with auto-generated code
            const { error: insertError } = await supabase.from("markets").insert({
              code: marketCode,
              name: marketName,
              trader_category: market.trader_category?.trim() || null,
              phone: market.phone?.trim() || null,
              address: market.address?.trim() || null,
              city: market.city?.trim() || null,
              zone: market.zone?.trim() || null,
            });

            if (insertError) {
              console.error("Insert error for market:", market.name, marketCode, insertError);
              errorCount++;
              failedMarkets.push(`${market.name || marketCode}`);
            } else {
              addedCount++;
            }
          }
        } catch (err) {
          console.error("Error processing market:", market.name, err);
          errorCount++;
          failedMarkets.push(market.name || market.code);
        }
      }

      // Show detailed result message
      if (addedCount > 0 || updatedCount > 0) {
        toast.success(`${addedCount} ماڕکێتی نوێ زیادکرا، ${updatedCount} ماڕکێت نوێکرایەوە`);
      }
      if (errorCount > 0) {
        console.error("Failed markets:", failedMarkets);
        toast.error(`${errorCount} ماڕکێت نەتوانرا بگۆڕدرێت`);
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
    <TableRow 
      key={market.id} 
      className={
        !market.name?.trim() ? "bg-destructive/5" : 
        market.isDuplicate ? "bg-warning/5" : 
        "bg-success/5"
      }
    >
      <TableCell className="text-xs">
        {renderEditableCell(market, "code")}
        {!market.code?.trim() && (
          <Badge variant="outline" className="text-[9px] ml-1">ئۆتۆ</Badge>
        )}
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
        {!market.name?.trim() ? (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            هەڵە
          </Badge>
        ) : market.isDuplicate ? (
          <Badge className="text-xs bg-warning text-warning-foreground">
            <RefreshCw className="w-3 h-3 mr-1" />
            دووبارە
          </Badge>
        ) : (
          <Badge className="text-xs bg-success text-success-foreground">
            <Plus className="w-3 h-3 mr-1" />
            نوێ
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

  const getDisplayMarkets = () => {
    switch (activeTab) {
      case "new":
        return newMarkets;
      case "duplicate":
        return duplicateMarkets;
      case "incomplete":
        return incompleteMarkets;
      default:
        return markets;
    }
  };

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
          {/* Loading State */}
          {isCheckingDuplicates && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">چاوەڕوان بە... پشکنینی ماڕکێت دووبارەکان</p>
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="font-medium">هێنانی ماڕکێتەکان...</span>
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
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{markets.length}</p>
                  <p className="text-sm text-muted-foreground">کۆی ماڕکێتەکان</p>
                </div>
                <div className="rounded-lg bg-success/10 p-4 text-center border border-success/20">
                  <div className="flex items-center justify-center gap-2">
                    <Plus className="h-5 w-5 text-success" />
                    <p className="text-2xl font-bold text-success">{newMarkets.length}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">ماڕکێتی نوێ</p>
                </div>
                <div className="rounded-lg bg-warning/10 p-4 text-center border border-warning/20">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-5 w-5 text-warning" />
                    <p className="text-2xl font-bold text-warning">{duplicateMarkets.length}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">دووبارە (نوێکردنەوە)</p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-4 text-center border border-destructive/20">
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-2xl font-bold text-destructive">{incompleteMarkets.length}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">پێویستی چاککردن</p>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="all">هەموو ({markets.length})</TabsTrigger>
                  <TabsTrigger value="new" className="text-success">
                    نوێ ({newMarkets.length})
                  </TabsTrigger>
                  <TabsTrigger value="duplicate" className="text-warning">
                    دووبارە ({duplicateMarkets.length})
                  </TabsTrigger>
                  <TabsTrigger value="incomplete" className="text-destructive">
                    هەڵە ({incompleteMarkets.length})
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[50vh] rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="text-xs w-[80px]">کۆد (Sir#)</TableHead>
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
                      {getDisplayMarkets().map((market) => renderMarketRow(market))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Tabs>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {newMarkets.length} نوێ + {duplicateMarkets.length} نوێکردنەوە = {markets.length - incompleteMarkets.length} ماڕکێت
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    پاشگەزبوونەوە
                  </Button>
                  <Button
                    onClick={handleImportAll}
                    disabled={isImporting || markets.length === 0}
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
                        هێنانی هەموو ({markets.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
