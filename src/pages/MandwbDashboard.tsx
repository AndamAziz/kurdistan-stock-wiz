import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  MapPin,
  Search,
  Clock,
  CheckCircle,
  Package,
  Calendar,
  RefreshCw,
  Trash2,
  ShieldCheck,
  LayoutDashboard,
  Store,
} from "lucide-react";
import { useItems } from "@/hooks/useItems";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import {
  useCurrentDeliveryPerson,
  useAssignedMarkets,
  useMarketVisits,
  useCreateVisit,
  useAddVisitItem,
} from "@/hooks/useDeliveryPersons";
import { format, differenceInDays } from "date-fns";

export default function MandwbDashboard() {
  const { data: currentPerson, isLoading: isLoadingPerson } = useCurrentDeliveryPerson();
  const { data: assignedMarkets = [] } = useAssignedMarkets(currentPerson?.id);
  const { data: myVisits = [] } = useMarketVisits(currentPerson?.id);
  const { data: items = [] } = useItems();
  const { settings } = useNotificationSettings();
  const createVisit = useCreateVisit();
  const addVisitItem = useAddVisitItem();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<{ id: string; name: string; code: string } | null>(null);
  const [visitNotes, setVisitNotes] = useState("");
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [visitItems, setVisitItems] = useState<Array<{
    item_id: string;
    item_name: string;
    barcode: string;
    quantity: number;
    issue_type: string;
    days_info: string;
    exp_date: string | null;
  }>>([]);
  const [issueTypeFilter, setIssueTypeFilter] = useState<"all" | "expired" | "expiring">("all");

  // Get reminder days from settings
  const reminderDays = settings?.reminderDays || 30;

  // Calculate expiring and expired items based on settings
  const { expiredItems, expiringItems, problemItems } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expired: typeof items = [];
    const expiring: typeof items = [];
    
    items.forEach(item => {
      if (!item.exp_date) return;
      const expDate = new Date(item.exp_date);
      const daysUntilExpiry = differenceInDays(expDate, today);
      
      if (daysUntilExpiry < 0) {
        expired.push(item);
      } else if (daysUntilExpiry <= reminderDays) {
        expiring.push(item);
      }
    });
    
    // Combine both for the visit dialog - only show problematic items
    const problem = [...expired, ...expiring];
    
    return { expiredItems: expired, expiringItems: expiring, problemItems: problem };
  }, [items, reminderDays]);

  // Filter problem items for the visit dialog based on search and type filter
  const filteredProblemItems = useMemo(() => {
    let filtered = problemItems;
    
    // Filter by issue type
    if (issueTypeFilter === "expired") {
      filtered = expiredItems;
    } else if (issueTypeFilter === "expiring") {
      filtered = expiringItems;
    }
    
    // Filter by barcode search (exact match or starts with)
    if (barcodeSearch.trim()) {
      const search = barcodeSearch.trim().toLowerCase();
      filtered = filtered.filter(item =>
        item.barcode.toLowerCase() === search ||
        item.barcode.toLowerCase().startsWith(search) ||
        item.name.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [problemItems, expiredItems, expiringItems, issueTypeFilter, barcodeSearch]);

  const filteredMarkets = assignedMarkets.filter(market =>
    market.market?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(market.market?.code || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get item expiry info
  const getItemExpiryInfo = (item: typeof items[0]) => {
    if (!item.exp_date) return { type: "unknown", label: "نەزانراو", days: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(item.exp_date);
    const days = differenceInDays(expDate, today);
    
    if (days < 0) {
      return { type: "expired", label: `${Math.abs(days)} ڕۆژ تێپەڕیوە`, days };
    } else if (days === 0) {
      return { type: "expired", label: "ئەمڕۆ بەسەردەچێت", days: 0 };
    } else {
      return { type: "expiring", label: `${days} ڕۆژ ماوە`, days };
    }
  };

  const handleStartVisit = (market: { id: string; name: string; code: string }) => {
    setSelectedMarket(market);
    setVisitNotes("");
    setVisitItems([]);
    setBarcodeSearch("");
    setIssueTypeFilter("all");
    setIsVisitDialogOpen(true);
  };

  const handleAddOrUpdateItem = (item: typeof items[0], quantity: number) => {
    const existingIndex = visitItems.findIndex(vi => vi.item_id === item.id);
    const expiryInfo = getItemExpiryInfo(item);
    
    if (existingIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...visitItems];
      updatedItems[existingIndex].quantity = quantity;
      setVisitItems(updatedItems);
    } else {
      // Add new item
      setVisitItems([...visitItems, {
        item_id: item.id,
        item_name: item.name,
        barcode: item.barcode,
        quantity,
        issue_type: expiryInfo.type === "expired" ? "expired" : "expiring",
        days_info: expiryInfo.label,
        exp_date: item.exp_date,
      }]);
    }
  };

  const getItemQuantity = (itemId: string) => {
    const item = visitItems.find(vi => vi.item_id === itemId);
    return item?.quantity ?? "";
  };

  const handleSubmitVisit = async () => {
    if (!currentPerson?.id || !selectedMarket?.id) return;
    
    // Filter out items with quantity > 0 (issues found)
    const itemsWithIssues = visitItems.filter(item => item.quantity > 0);
    
    createVisit.mutate({
      delivery_person_id: currentPerson.id,
      market_id: selectedMarket.id,
      notes: visitNotes || `سەردانی ماڕکێت: ${selectedMarket.name} (${selectedMarket.code})`,
    }, {
      onSuccess: (visit) => {
        // Add visit items - only items with quantity > 0
        itemsWithIssues.forEach(item => {
          addVisitItem.mutate({
            visit_id: visit.id,
            item_id: item.item_id,
            quantity: item.quantity,
            issue_type: item.issue_type,
          });
        });
        
        setIsVisitDialogOpen(false);
        setSelectedMarket(null);
      },
    });
  };

  // Calculate how many items have been reported
  const reportedItemsCount = visitItems.filter(vi => vi.quantity > 0).length;
  const safeItemsCount = visitItems.filter(vi => vi.quantity === 0).length;

  if (isLoadingPerson) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (!currentPerson) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            تۆ وەک مەندوب تۆمار نەکراویت.<br />
            تکایە پەیوەندی بکە بە بەڕێوەبەر.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">بەخێربێیت، {currentPerson.name}</h1>
            <p className="text-sm text-muted-foreground">
              چاودێری بەسەرچوون لە ماڕکێتەکان
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              داشبۆرد
            </TabsTrigger>
            <TabsTrigger value="markets" className="gap-2">
              <Store className="h-4 w-4" />
              ماڕکێتەکان ({assignedMarkets.length})
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4 mt-4">
            {/* Alert Stats */}
            <div className="grid gap-3 grid-cols-2">
              <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">{expiredItems.length}</p>
                      <p className="text-xs text-destructive/80">بەسەرچوو</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-warning/10 border-warning/20">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
                      <Clock className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-warning">{expiringItems.length}</p>
                      <p className="text-xs text-warning/80">نزیک بەسەرچوون</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info Card */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-primary">چۆن ڕاپۆرت بدەیت؟</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      ۱. بچۆ بەشی ماڕکێتەکان و ماڕکێتێک هەڵبژێرە<br/>
                      ۲. بارکۆدی مادەکە بنووسە بۆ گەڕان<br/>
                      ۳. ژمارەی بەسەرچوو/نزیک بەسەرچوون بنووسە<br/>
                      ۴. ئەگەر ژمارە 0 بێت = ماڕکێت سەلامەتە بۆ ئەو مادەیە
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expired Items List */}
            {expiredItems.length > 0 && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    مادە بەسەرچووەکان ({expiredItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {expiredItems.map(item => {
                      const expiryInfo = getItemExpiryInfo(item);
                      return (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50 text-sm">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Trash2 className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="font-medium truncate block">{item.name}</span>
                              <span className="text-xs text-muted-foreground">{item.barcode}</span>
                            </div>
                          </div>
                          <Badge variant="destructive" className="text-xs flex-shrink-0">
                            {expiryInfo.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expiring Items List */}
            {expiringItems.length > 0 && (
              <Card className="border-warning/30 bg-warning/5">
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-warning">
                    <Clock className="h-4 w-4" />
                    مادە نزیک بەسەرچوون ({expiringItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {expiringItems.map(item => {
                      const expiryInfo = getItemExpiryInfo(item);
                      return (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50 text-sm">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <RefreshCw className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="font-medium truncate block">{item.name}</span>
                              <span className="text-xs text-muted-foreground">{item.barcode}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs text-warning border-warning/30 flex-shrink-0">
                            {expiryInfo.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No issues message */}
            {expiredItems.length === 0 && expiringItems.length === 0 && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="py-6">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <ShieldCheck className="h-10 w-10 text-green-500" />
                    <p className="font-medium text-green-600">هیچ مادە کێشەدارێک نییە!</p>
                    <p className="text-xs text-muted-foreground">هەموو مادەکان سەلامەتن</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Visits */}
            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  سەردانەکانی دوایی
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                {myVisits.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    هیچ سەردانێک نییە
                  </p>
                ) : (
                  <div className="space-y-2">
                    {myVisits.slice(0, 5).map((visit) => (
                      <div
                        key={visit.id}
                        className="flex items-center justify-between p-2 rounded-lg border text-sm"
                      >
                        <div>
                          <p className="font-medium">{visit.market?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(visit.visit_date), 'yyyy/MM/dd - HH:mm')}
                          </p>
                        </div>
                        <Badge variant={
                          visit.status === "resolved" ? "default" :
                          visit.status === "reviewed" ? "secondary" : "outline"
                        } className="text-xs">
                          {visit.status === "resolved" ? "چارەسەرکرا" :
                           visit.status === "reviewed" ? "بینراوە" : "چاوەڕوان"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Markets Tab */}
          <TabsContent value="markets" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="گەڕان بە کۆد یان ناو..."
                className="pr-10"
              />
            </div>
            
            {filteredMarkets.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    هیچ ماڕکێتێک نییە
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredMarkets.map((assignment) => (
                  <Card
                    key={assignment.id}
                    className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handleStartVisit({
                      id: assignment.market?.id || "",
                      name: assignment.market?.name || "",
                      code: assignment.market?.code || "",
                    })}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{assignment.market?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              کۆد: {assignment.market?.code} • {assignment.market?.city || "-"}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          سەردان
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Visit Dialog */}
      <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              سەردانی {selectedMarket?.name}
              <Badge variant="outline" className="ml-2">{selectedMarket?.code}</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Filter by issue type */}
            <div className="flex gap-2">
              <Button
                variant={issueTypeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setIssueTypeFilter("all")}
                className="flex-1"
              >
                هەموو ({problemItems.length})
              </Button>
              <Button
                variant={issueTypeFilter === "expired" ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIssueTypeFilter("expired")}
                className="flex-1"
              >
                بەسەرچوو ({expiredItems.length})
              </Button>
              <Button
                variant={issueTypeFilter === "expiring" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setIssueTypeFilter("expiring")}
                className="flex-1"
              >
                نزیک ({expiringItems.length})
              </Button>
            </div>

            {/* Barcode Search */}
            <div className="space-y-2">
              <Label className="text-sm">گەڕان بە بارکۆد یان ناو</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={barcodeSearch}
                  onChange={(e) => setBarcodeSearch(e.target.value)}
                  placeholder="بارکۆدی مادەکە بنووسە..."
                  className="pr-10"
                />
              </div>
            </div>

            {/* Items List with quantity input */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center justify-between">
                <span>مادەکان ({filteredProblemItems.length})</span>
                <span className="text-xs text-muted-foreground">
                  ژمارە 0 = سەلامەت
                </span>
              </Label>
              <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                {filteredProblemItems.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    {barcodeSearch ? "هیچ مادەیەک نەدۆزرایەوە" : "هیچ مادە کێشەدارێک نییە"}
                  </div>
                ) : (
                  filteredProblemItems.map(item => {
                    const expiryInfo = getItemExpiryInfo(item);
                    const currentQty = getItemQuantity(item.id);
                    
                    return (
                      <div
                        key={item.id}
                        className="p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {expiryInfo.type === "expired" ? (
                              <Trash2 className="h-4 w-4 text-destructive flex-shrink-0" />
                            ) : (
                              <RefreshCw className="h-4 w-4 text-warning flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.barcode}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={expiryInfo.type === "expired" ? "destructive" : "outline"}
                            className={`text-xs flex-shrink-0 ${expiryInfo.type !== "expired" ? "text-warning border-warning/30" : ""}`}
                          >
                            {expiryInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={currentQty}
                            onChange={(e) => handleAddOrUpdateItem(item, parseInt(e.target.value) || 0)}
                            placeholder="ژمارە..."
                            className="h-9 text-center"
                          />
                          {currentQty === 0 && (
                            <Badge variant="outline" className="text-green-600 border-green-500/30 flex-shrink-0">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              سەلامەت
                            </Badge>
                          )}
                          {typeof currentQty === "number" && currentQty > 0 && (
                            <Badge variant="destructive" className="flex-shrink-0">
                              {currentQty} دانە
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Summary */}
            {visitItems.length > 0 && (
              <Card className="bg-muted/30">
                <CardContent className="py-3">
                  <div className="flex items-center justify-around text-center">
                    <div>
                      <p className="text-lg font-bold text-destructive">{reportedItemsCount}</p>
                      <p className="text-xs text-muted-foreground">کێشەدار</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <p className="text-lg font-bold text-green-600">{safeItemsCount}</p>
                      <p className="text-xs text-muted-foreground">سەلامەت</p>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <p className="text-lg font-bold">{visitItems.length}</p>
                      <p className="text-xs text-muted-foreground">کۆی گشتی</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm">تێبینی (ئارەزوومەندانە)</Label>
              <Textarea
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="تێبینی سەبارەت بە سەردانەکە..."
                rows={2}
              />
            </div>

            <Button
              onClick={handleSubmitVisit}
              disabled={createVisit.isPending || visitItems.length === 0}
              className="w-full"
            >
              {createVisit.isPending ? "چاوەڕێ بکە..." : (
                reportedItemsCount > 0 
                  ? `ناردنی ڕاپۆرت (${reportedItemsCount} کێشەدار، ${safeItemsCount} سەلامەت)`
                  : `ناردنی ڕاپۆرت (${safeItemsCount} سەلامەت)`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
