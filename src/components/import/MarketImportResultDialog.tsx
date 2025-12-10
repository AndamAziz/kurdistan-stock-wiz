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
import { Loader2, CheckCircle, AlertCircle, Edit, Save, Trash2, X, Plus, RefreshCw, ArrowRight, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExistingMarket {
  id: string;
  code: string;
  name: string;
  trader_category: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zone: string | null;
}

interface MarketChanges {
  field: string;
  oldValue: string;
  newValue: string;
}

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
  hasChanges?: boolean;
  changes?: MarketChanges[];
  existingData?: ExistingMarket;
}

interface MarketImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importedMarkets: ImportedMarket[];
  onImportComplete: () => void;
}

const fieldLabels: Record<string, string> = {
  name: "ناو",
  trader_category: "جۆر",
  phone: "مۆبایل",
  address: "ناونیشان",
  city: "شار",
  zone: "ناوچە",
  code: "کۆد",
};

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

  // Compare values and detect changes
  const getMarketChanges = (
    newMarket: ImportedMarket,
    existingMarket: ExistingMarket
  ): MarketChanges[] => {
    const changes: MarketChanges[] = [];
    const fieldsToCompare: (keyof ExistingMarket)[] = [
      "name",
      "trader_category",
      "phone",
      "address",
      "city",
      "zone",
    ];

    for (const field of fieldsToCompare) {
      const newVal = (newMarket[field as keyof ImportedMarket] as string)?.trim() || "";
      const oldVal = (existingMarket[field] as string)?.trim() || "";

      if (newVal !== oldVal && newVal !== "") {
        changes.push({
          field,
          oldValue: oldVal || "(خالی)",
          newValue: newVal,
        });
      }
    }

    return changes;
  };

  // Helper to fetch all markets without 1000 limit
  const fetchAllExistingMarkets = async (): Promise<ExistingMarket[]> => {
    const allMarkets: ExistingMarket[] = [];
    const batchSize = 1000;
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("markets")
        .select("id, code, name, trader_category, phone, address, city, zone")
        .range(start, start + batchSize - 1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        allMarkets.push(...(data as ExistingMarket[]));
        start += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    return allMarkets;
  };

  // Check for duplicates and changes when dialog opens
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!open || initialMarkets.length === 0) return;

      setIsCheckingDuplicates(true);

      try {
        // Query ALL existing markets with full data (no 1000 limit)
        const existingMarkets = await fetchAllExistingMarkets();

        // Create maps for both code and name matching
        const existingCodeMap = new Map<string, ExistingMarket>(
          existingMarkets
            ?.filter((m) => m.code)
            .map((m) => [m.code.toLowerCase().trim(), m as ExistingMarket]) || []
        );
        const existingNameMap = new Map<string, ExistingMarket>(
          existingMarkets
            ?.filter((m) => m.name)
            .map((m) => [m.name.toLowerCase().trim(), m as ExistingMarket]) || []
        );

        // Mark duplicates and detect changes
        const marketsWithDuplicates = initialMarkets.map((market) => {
          const codeMatch = market.code?.trim()
            ? existingCodeMap.get(market.code.trim().toLowerCase())
            : null;
          const nameMatch = market.name?.trim()
            ? existingNameMap.get(market.name.trim().toLowerCase())
            : null;

          // If code exists, match by code; if not, match by name
          const matchedMarket = market.code?.trim()
            ? codeMatch
            : codeMatch || nameMatch;

          if (matchedMarket) {
            const changes = getMarketChanges(market, matchedMarket);
            return {
              ...market,
              isDuplicate: true,
              existingMarketId: matchedMarket.id,
              matchedBy: codeMatch ? ("code" as const) : ("name" as const),
              hasChanges: changes.length > 0,
              changes,
              existingData: matchedMarket,
            };
          }

          return {
            ...market,
            isDuplicate: false,
            existingMarketId: undefined,
            matchedBy: null,
            hasChanges: false,
            changes: [],
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

  // Categorize markets
  const incompleteMarkets = markets.filter((m) => !m.name?.trim());
  const newMarkets = markets.filter((m) => !m.isDuplicate && m.name?.trim());
  const duplicateWithChanges = markets.filter(
    (m) => m.isDuplicate && m.hasChanges
  );
  const duplicateNoChanges = markets.filter(
    (m) => m.isDuplicate && !m.hasChanges
  );
  
  // Markets without phone number
  const noPhoneMarkets = markets.filter((m) => m.name?.trim() && !m.phone?.trim());

  // Markets that will be imported (new + duplicates with changes)
  const marketsToImport = [...newMarkets, ...duplicateWithChanges];

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

        // Recalculate changes if this is a duplicate
        if (updated.existingData) {
          const changes = getMarketChanges(updated, updated.existingData);
          updated.hasChanges = changes.length > 0;
          updated.changes = changes;
        }

        return updated;
      })
    );
  };

  const handleDeleteMarket = (id: string) => {
    setMarkets((prev) => prev.filter((m) => m.id !== id));
  };

  // Import only markets with new data or changes
  const handleImportAll = async () => {
    if (marketsToImport.length === 0) {
      toast.info("هیچ گۆڕانکاریەکی نوێ نییە بۆ import کردن");
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: marketsToImport.length });

    try {
      let addedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;
      const failedMarkets: string[] = [];

      // Get the max Sir# for auto-generating codes - fetch ALL codes
      let nextSirNumber = 1;
      const codeBatchSize = 1000;
      let codeStart = 0;
      let hasMoreCodes = true;

      while (hasMoreCodes) {
        const { data: codesData } = await supabase
          .from("markets")
          .select("code")
          .range(codeStart, codeStart + codeBatchSize - 1);

        if (codesData && codesData.length > 0) {
          for (const m of codesData) {
            const numMatch = m.code?.match(/^(\d+)$/);
            if (numMatch) {
              const num = parseInt(numMatch[1], 10);
              if (num >= nextSirNumber) {
                nextSirNumber = num + 1;
              }
            }
          }
          codeStart += codeBatchSize;
          hasMoreCodes = codesData.length === codeBatchSize;
        } else {
          hasMoreCodes = false;
        }
      }

      // Process sequentially to avoid race conditions with auto-generated codes
      for (let i = 0; i < marketsToImport.length; i++) {
        const market = marketsToImport[i];
        setImportProgress({
          current: i + 1,
          total: marketsToImport.length,
        });

        try {
          // Auto-generate name if missing
          const marketName =
            market.name?.trim() || `ماڕکێت-${Date.now()}-${i}`;

          if (market.existingMarketId && market.hasChanges) {
            // Update existing market with changes only
            const updateData: Record<string, string | null> = {};
            for (const change of market.changes || []) {
              updateData[change.field] = change.newValue || null;
            }

            const { error: updateError } = await supabase
              .from("markets")
              .update(updateData)
              .eq("id", market.existingMarketId);

            if (updateError) {
              console.error(
                "Update error for market:",
                market.name,
                updateError
              );
              errorCount++;
              failedMarkets.push(market.name || market.code);
            } else {
              updatedCount++;
            }
          } else if (!market.isDuplicate) {
            // Generate unique code - check if it exists, if so increment
            let marketCode = market.code?.trim() || String(nextSirNumber);
            
            // Check if code already exists and find a unique one
            let codeExists = true;
            let attempts = 0;
            while (codeExists && attempts < 100) {
              const { data: existingCode } = await supabase
                .from("markets")
                .select("id")
                .eq("code", marketCode)
                .maybeSingle();
              
              if (!existingCode) {
                codeExists = false;
              } else {
                // Code exists, try next number
                nextSirNumber++;
                marketCode = String(nextSirNumber);
                attempts++;
              }
            }
            
            nextSirNumber++;

            const { error: insertError } = await supabase
              .from("markets")
              .insert({
                code: marketCode,
                name: marketName,
                trader_category: market.trader_category?.trim() || null,
                phone: market.phone?.trim() || null,
                address: market.address?.trim() || null,
                city: market.city?.trim() || null,
                zone: market.zone?.trim() || null,
              });

            if (insertError) {
              console.error(
                "Insert error for market:",
                market.name,
                insertError
              );
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
        toast.success(
          `${addedCount} ماڕکێتی نوێ زیادکرا، ${updatedCount} ماڕکێت نوێکرایەوە`
        );
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
          className="h-7 text-xs min-w-[80px]"
        />
      );
    }

    return (
      <span className={!value ? "text-muted-foreground italic text-xs" : "text-xs"}>
        {value || "-"}
      </span>
    );
  };

  const renderChangeBadge = (market: ImportedMarket) => {
    if (!market.name?.trim()) {
      return (
        <Badge variant="destructive" className="text-[10px] whitespace-nowrap">
          <AlertCircle className="w-3 h-3 ml-1" />
          هەڵە
        </Badge>
      );
    }
    if (market.isDuplicate && market.hasChanges) {
      return (
        <Badge className="text-[10px] bg-warning text-warning-foreground whitespace-nowrap">
          <RefreshCw className="w-3 h-3 ml-1" />
          گۆڕانکاری
        </Badge>
      );
    }
    if (market.isDuplicate && !market.hasChanges) {
      return (
        <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
          وەک خۆی
        </Badge>
      );
    }
    return (
      <Badge className="text-[10px] bg-success text-success-foreground whitespace-nowrap">
        <Plus className="w-3 h-3 ml-1" />
        نوێ
      </Badge>
    );
  };

  // Mobile-friendly card view
  const renderMobileCard = (market: ImportedMarket) => (
    <div
      key={market.id}
      className={`p-3 rounded-lg border mb-2 ${
        !market.name?.trim()
          ? "bg-destructive/5 border-destructive/20"
          : market.isDuplicate && market.hasChanges
          ? "bg-warning/5 border-warning/20"
          : market.isDuplicate
          ? "bg-muted/50 border-muted"
          : "bg-success/5 border-success/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {renderChangeBadge(market)}
            {!market.code?.trim() && (
              <Badge variant="outline" className="text-[9px]">
                کۆد ئۆتۆ
              </Badge>
            )}
          </div>
          <p className="font-medium text-sm truncate">
            {market.name || "(بێ ناو)"}
          </p>
          <p className="text-xs text-muted-foreground">
            کۆد: {market.code || "ئۆتۆ"} | {market.city || "-"} |{" "}
            {market.phone || "-"}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
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
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => handleDeleteMarket(market.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Show changes for duplicates with changes */}
      {market.isDuplicate && market.hasChanges && market.changes && (
        <div className="mt-2 pt-2 border-t border-warning/20">
          <p className="text-xs font-medium text-warning mb-1">گۆڕانکاریەکان:</p>
          <div className="space-y-1">
            {market.changes.map((change, idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">
                  {fieldLabels[change.field]}:
                </span>
                <span className="text-destructive/70 line-through">
                  {change.oldValue}
                </span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-success font-medium">
                  {change.newValue}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editing mode */}
      {editingId === market.id && (
        <div className="mt-2 pt-2 border-t grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">کۆد</label>
            {renderEditableCell(market, "code")}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">ناو</label>
            {renderEditableCell(market, "name")}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">جۆر</label>
            {renderEditableCell(market, "trader_category")}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">مۆبایل</label>
            {renderEditableCell(market, "phone")}
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">ناونیشان</label>
            {renderEditableCell(market, "address")}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">شار</label>
            {renderEditableCell(market, "city")}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">ناوچە</label>
            {renderEditableCell(market, "zone")}
          </div>
        </div>
      )}
    </div>
  );

  const renderMarketRow = (market: ImportedMarket) => (
    <TableRow
      key={market.id}
      className={
        !market.name?.trim()
          ? "bg-destructive/5"
          : market.isDuplicate && market.hasChanges
          ? "bg-warning/5"
          : market.isDuplicate
          ? "bg-muted/30"
          : "bg-success/5"
      }
    >
      <TableCell className="text-xs py-2">
        {renderEditableCell(market, "code")}
        {!market.code?.trim() && (
          <Badge variant="outline" className="text-[9px] mr-1">
            ئۆتۆ
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-xs py-2">
        {renderEditableCell(market, "name")}
      </TableCell>
      <TableCell className="text-xs py-2">
        {renderEditableCell(market, "trader_category")}
      </TableCell>
      <TableCell className="text-xs py-2">
        {renderEditableCell(market, "phone")}
      </TableCell>
      <TableCell className="text-xs py-2 max-w-[120px] truncate">
        {renderEditableCell(market, "address")}
      </TableCell>
      <TableCell className="text-xs py-2">
        {renderEditableCell(market, "city")}
      </TableCell>
      <TableCell className="text-xs py-2">
        {renderEditableCell(market, "zone")}
      </TableCell>
      <TableCell className="py-2">{renderChangeBadge(market)}</TableCell>
      <TableCell className="py-2">
        {market.isDuplicate && market.hasChanges && market.changes && (
          <div className="space-y-0.5">
            {market.changes.slice(0, 2).map((change, idx) => (
              <div key={idx} className="flex items-center gap-1 text-[10px]">
                <span className="text-muted-foreground">
                  {fieldLabels[change.field]}:
                </span>
                <span className="text-success">{change.newValue}</span>
              </div>
            ))}
            {market.changes.length > 2 && (
              <span className="text-[10px] text-muted-foreground">
                +{market.changes.length - 2} زیاتر
              </span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell className="py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() =>
              setEditingId(editingId === market.id ? null : market.id)
            }
          >
            {editingId === market.id ? (
              <Save className="w-3 h-3" />
            ) : (
              <Edit className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => handleDeleteMarket(market.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  const getDisplayMarkets = () => {
    switch (activeTab) {
      case "new":
        return newMarkets;
      case "changes":
        return duplicateWithChanges;
      case "nochange":
        return duplicateNoChanges;
      case "incomplete":
        return incompleteMarkets;
      case "nophone":
        return noPhoneMarkets;
      default:
        return markets;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[98vw] md:max-w-[95vw] w-full md:w-[1400px] max-h-[95vh] p-0 overflow-hidden"
        dir="rtl"
      >
        <DialogHeader className="p-3 md:p-4 pb-2 border-b">
          <DialogTitle className="flex items-center justify-between text-sm md:text-base">
            <span>ئەنجامی خوێندنەوە - {markets.length} ماڕکێت</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="p-3 md:p-4 space-y-3 overflow-y-auto max-h-[calc(95vh-60px)]">
          {/* Loading State */}
          {isCheckingDuplicates && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
              <p className="text-muted-foreground text-sm">
                پشکنینی ماڕکێتەکان...
              </p>
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                <span className="font-medium text-sm">هێنانی ماڕکێتەکان...</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{
                    width: `${
                      importProgress.total > 0
                        ? (importProgress.current / importProgress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {importProgress.current} / {importProgress.total}
              </p>
            </div>
          )}

          {!isCheckingDuplicates && (
            <>
              {/* Summary Stats - Responsive Grid */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                <div className="rounded-lg bg-muted/50 p-2 md:p-3 text-center">
                  <p className="text-lg md:text-xl font-bold text-foreground">
                    {markets.length}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    کۆی گشتی
                  </p>
                </div>
                <div className="rounded-lg bg-success/10 p-2 md:p-3 text-center border border-success/20">
                  <div className="flex items-center justify-center gap-1">
                    <Plus className="h-3 w-3 md:h-4 md:w-4 text-success" />
                    <p className="text-lg md:text-xl font-bold text-success">
                      {newMarkets.length}
                    </p>
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    نوێ
                  </p>
                </div>
                <div className="rounded-lg bg-warning/10 p-2 md:p-3 text-center border border-warning/20">
                  <div className="flex items-center justify-center gap-1">
                    <RefreshCw className="h-3 w-3 md:h-4 md:w-4 text-warning" />
                    <p className="text-lg md:text-xl font-bold text-warning">
                      {duplicateWithChanges.length}
                    </p>
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    گۆڕانکاری
                  </p>
                </div>
                <div className="rounded-lg bg-muted/30 p-2 md:p-3 text-center border">
                  <p className="text-lg md:text-xl font-bold text-muted-foreground">
                    {duplicateNoChanges.length}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    بێ گۆڕانکاری
                  </p>
                </div>
                {/* No Phone Stats */}
                <div className="rounded-lg bg-orange-500/10 p-2 md:p-3 text-center border border-orange-500/20">
                  <div className="flex items-center justify-center gap-1">
                    <Phone className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
                    <p className="text-lg md:text-xl font-bold text-orange-500">
                      {noPhoneMarkets.length}
                    </p>
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    بێ مۆبایل
                  </p>
                </div>
                <div className="rounded-lg bg-destructive/10 p-2 md:p-3 text-center border border-destructive/20">
                  <div className="flex items-center justify-center gap-1">
                    <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-destructive" />
                    <p className="text-lg md:text-xl font-bold text-destructive">
                      {incompleteMarkets.length}
                    </p>
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    هەڵە
                  </p>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6 mb-3 h-auto">
                  <TabsTrigger value="all" className="text-[10px] md:text-xs py-1.5 px-1">
                    هەموو ({markets.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="new"
                    className="text-[10px] md:text-xs py-1.5 px-1 data-[state=active]:text-success"
                  >
                    نوێ ({newMarkets.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="changes"
                    className="text-[10px] md:text-xs py-1.5 px-1 data-[state=active]:text-warning"
                  >
                    گۆڕان ({duplicateWithChanges.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="nochange"
                    className="text-[10px] md:text-xs py-1.5 px-1"
                  >
                    وەکخۆی ({duplicateNoChanges.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="nophone"
                    className="text-[10px] md:text-xs py-1.5 px-1 data-[state=active]:text-orange-500"
                  >
                    بێمۆبایل ({noPhoneMarkets.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="incomplete"
                    className="text-[10px] md:text-xs py-1.5 px-1 data-[state=active]:text-destructive"
                  >
                    هەڵە ({incompleteMarkets.length})
                  </TabsTrigger>
                </TabsList>

                {/* Mobile View - Cards */}
                <div className="md:hidden">
                  <ScrollArea className="h-[40vh]">
                    {getDisplayMarkets().map((market) => renderMobileCard(market))}
                    {getDisplayMarkets().length === 0 && (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        هیچ ماڕکێتێک نییە
                      </p>
                    )}
                  </ScrollArea>
                </div>

                {/* Desktop View - Table */}
                <div className="hidden md:block">
                  <ScrollArea className="h-[45vh] rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="text-xs w-[70px] py-2">کۆد</TableHead>
                          <TableHead className="text-xs w-[120px] py-2">ناو</TableHead>
                          <TableHead className="text-xs w-[80px] py-2">جۆر</TableHead>
                          <TableHead className="text-xs w-[100px] py-2">مۆبایل</TableHead>
                          <TableHead className="text-xs py-2">ناونیشان</TableHead>
                          <TableHead className="text-xs w-[80px] py-2">شار</TableHead>
                          <TableHead className="text-xs w-[80px] py-2">ناوچە</TableHead>
                          <TableHead className="text-xs w-[70px] py-2">بارودۆخ</TableHead>
                          <TableHead className="text-xs w-[100px] py-2">گۆڕانکاری</TableHead>
                          <TableHead className="text-xs w-[60px] py-2">کردار</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getDisplayMarkets().map((market) => renderMarketRow(market))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </Tabs>

              {/* Actions - Fixed at bottom */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-3 border-t bg-background">
                <p className="text-xs md:text-sm text-muted-foreground text-center md:text-right">
                  <span className="text-success font-medium">{newMarkets.length}</span> نوێ +{" "}
                  <span className="text-warning font-medium">{duplicateWithChanges.length}</span>{" "}
                  گۆڕانکاری ={" "}
                  <span className="font-bold">{marketsToImport.length}</span> ماڕکێت import دەکرێت
                </p>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 md:flex-none text-xs md:text-sm h-9 md:h-10"
                  >
                    پاشگەزبوونەوە
                  </Button>
                  <Button
                    onClick={handleImportAll}
                    disabled={isImporting || marketsToImport.length === 0}
                    className="flex-1 md:flex-none gap-2 text-xs md:text-sm h-9 md:h-10"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        چاوەڕوان بە...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        هێنانی ({marketsToImport.length})
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
