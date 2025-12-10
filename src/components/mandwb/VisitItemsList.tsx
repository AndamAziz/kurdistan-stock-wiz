import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Clock,
  Search,
  ShieldCheck,
  Send,
  X,
  Package,
} from "lucide-react";
import { differenceInDays } from "date-fns";

interface Item {
  id: string;
  name: string;
  barcode: string;
  exp_date: string | null;
  image_url?: string | null;
}

interface VisitItem {
  itemId: string;
  quantity: number;
  issueType: "expired" | "expiring";
}

interface VisitItemsListProps {
  items: Item[];
  reminderDays: number;
  marketName: string;
  marketCode: string;
  onSubmit: (visitItems: VisitItem[]) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function VisitItemsList({
  items,
  reminderDays,
  marketName,
  marketCode,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: VisitItemsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // Categorize items into expired and expiring
  const { expiredItems, expiringItems } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expired: (Item & { daysAgo: number })[] = [];
    const expiring: (Item & { daysLeft: number })[] = [];

    items.forEach((item) => {
      if (!item.exp_date) return;
      const expDate = new Date(item.exp_date);
      const daysUntilExpiry = differenceInDays(expDate, today);

      if (daysUntilExpiry < 0) {
        expired.push({ ...item, daysAgo: Math.abs(daysUntilExpiry) });
      } else if (daysUntilExpiry <= reminderDays) {
        expiring.push({ ...item, daysLeft: daysUntilExpiry });
      }
    });

    // Sort: most urgent first
    expired.sort((a, b) => b.daysAgo - a.daysAgo);
    expiring.sort((a, b) => a.daysLeft - b.daysLeft);

    return { expiredItems: expired, expiringItems: expiring };
  }, [items, reminderDays]);

  // Filter items based on search
  const filteredExpired = expiredItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExpiring = expiringItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuantityChange = (itemId: string, value: string) => {
    const quantity = parseInt(value) || 0;
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: quantity,
    }));
  };

  const handleSubmit = () => {
    const visitItems: VisitItem[] = [];

    // Collect expired items with quantities
    expiredItems.forEach((item) => {
      const qty = itemQuantities[item.id] || 0;
      if (qty > 0) {
        visitItems.push({
          itemId: item.id,
          quantity: qty,
          issueType: "expired",
        });
      }
    });

    // Collect expiring items with quantities
    expiringItems.forEach((item) => {
      const qty = itemQuantities[item.id] || 0;
      if (qty > 0) {
        visitItems.push({
          itemId: item.id,
          quantity: qty,
          issueType: "expiring",
        });
      }
    });

    onSubmit(visitItems);
  };

  // Count items with entered quantities
  const totalItemsReported = Object.values(itemQuantities).filter((q) => q > 0).length;
  const totalQuantity = Object.values(itemQuantities).reduce((sum, q) => sum + q, 0);
  const hasNoIssues = expiredItems.length === 0 && expiringItems.length === 0;

  return (
    <div className="space-y-2.5 sm:space-y-4 pb-28 sm:pb-24">
      {/* Market Header */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-2.5 sm:py-4 px-2.5 sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary/20 flex-shrink-0">
                <Package className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-lg font-bold truncate leading-tight">سەردانی {marketName}</h1>
                <p className="text-[10px] sm:text-sm text-muted-foreground">کۆد: {marketCode}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* If no items with expiry issues */}
      {hasNoIssues ? (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-5 sm:py-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <ShieldCheck className="h-9 w-9 sm:h-12 sm:w-12 text-green-500" />
              <div>
                <p className="font-semibold text-green-600 text-sm sm:text-lg">
                  هیچ مادە کێشەدارێک نییە!
                </p>
                <p className="text-[10px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  هەموو مادەکان سەلامەتن
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="گەڕان..."
              className="pr-8 sm:pr-10 h-9 sm:h-11 text-xs sm:text-sm"
            />
          </div>

          {/* Info - more compact on mobile */}
          <div className="text-[10px] sm:text-sm text-muted-foreground text-center bg-muted/30 rounded-lg p-2 sm:p-3">
            <p>
              بۆ هەر مادەیەک <strong>ژمارە</strong> بنووسە (0 = نییە)
            </p>
          </div>

          <div className="space-y-2.5 sm:space-y-4">
            {/* Expired Items Section */}
            {filteredExpired.length > 0 && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader className="pb-1 sm:pb-2 pt-2 sm:pt-3 px-2.5 sm:px-4">
                  <CardTitle className="text-[11px] sm:text-sm flex items-center gap-1.5 text-destructive">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                    بەسەرچووە ({filteredExpired.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2 sm:pb-3 px-2.5 sm:px-4 space-y-1.5">
                  {filteredExpired.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-3 rounded-lg bg-background/80 border border-destructive/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[11px] sm:text-sm truncate leading-tight">{item.name}</p>
                        <div className="flex items-center gap-1 text-[9px] sm:text-xs text-muted-foreground">
                          <Badge variant="destructive" className="text-[8px] sm:text-[10px] px-1 py-0 h-4">
                            {item.daysAgo}ڕۆژ
                          </Badge>
                        </div>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        placeholder="0"
                        value={itemQuantities[item.id] || ""}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="w-14 sm:w-20 h-8 sm:h-10 text-center text-sm sm:text-lg font-bold px-1"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Expiring Items Section */}
            {filteredExpiring.length > 0 && (
              <Card className="border-warning/30 bg-warning/5">
                <CardHeader className="pb-1 sm:pb-2 pt-2 sm:pt-3 px-2.5 sm:px-4">
                  <CardTitle className="text-[11px] sm:text-sm flex items-center gap-1.5 text-warning">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    نزیک بەسەرچوون ({filteredExpiring.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2 sm:pb-3 px-2.5 sm:px-4 space-y-1.5">
                  {filteredExpiring.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-3 rounded-lg bg-background/80 border border-warning/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[11px] sm:text-sm truncate leading-tight">{item.name}</p>
                        <div className="flex items-center gap-1 text-[9px] sm:text-xs text-muted-foreground">
                          <Badge
                            variant="outline"
                            className="text-[8px] sm:text-[10px] px-1 py-0 h-4 text-warning border-warning/30"
                          >
                            {item.daysLeft === 0 ? "ئەمڕۆ" : `${item.daysLeft}ڕۆژ`}
                          </Badge>
                        </div>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        placeholder="0"
                        value={itemQuantities[item.id] || ""}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="w-14 sm:w-20 h-8 sm:h-10 text-center text-sm sm:text-lg font-bold px-1"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Bottom Submit Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-2.5 sm:p-4 shadow-[0_-4px_20px_-4px_hsl(var(--foreground)/0.1)] z-50">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <Button variant="outline" onClick={onCancel} className="flex-1 h-10 sm:h-11 text-xs sm:text-sm">
            <X className="h-3.5 w-3.5 ml-1" />
            هەڵوەشاندنەوە
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 gap-1.5 h-10 sm:h-11 text-xs sm:text-sm"
          >
            <Send className="h-3.5 w-3.5" />
            {isSubmitting ? (
              "..."
            ) : hasNoIssues || totalQuantity === 0 ? (
              "سەلامەتە"
            ) : (
              `ناردن (${totalQuantity})`
            )}
          </Button>
        </div>

        {/* Summary */}
        {totalItemsReported > 0 && (
          <div className="mt-1 text-center text-[10px] sm:text-xs text-muted-foreground">
            {totalItemsReported} مادە • کۆ: {totalQuantity}
          </div>
        )}
      </div>
    </div>
  );
}
