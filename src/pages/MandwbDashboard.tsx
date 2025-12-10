import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useMandwbTab } from "@/hooks/useMandwbTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  MapPin,
  Search,
  Clock,
  Calendar,
  RefreshCw,
  Trash2,
  ShieldCheck,
  LayoutDashboard,
  Store,
  Send,
  CheckCircle2,
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
import { toast } from "sonner";

export default function MandwbDashboard() {
  const { data: currentPerson, isLoading: isLoadingPerson } = useCurrentDeliveryPerson();
  const { data: assignedMarkets = [] } = useAssignedMarkets(currentPerson?.id);
  const { data: myVisits = [], refetch: refetchVisits } = useMarketVisits(currentPerson?.id);
  const { data: items = [] } = useItems();
  const { settings } = useNotificationSettings();
  const createVisit = useCreateVisit();
  const addVisitItem = useAddVisitItem();

  const { activeTab, setActiveTab } = useMandwbTab();
  const [searchTerm, setSearchTerm] = useState("");
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  
  // Quick report dialog state
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    barcode: string;
    issue_type: string;
    days_info: string;
  } | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState<string>("");
  const [reportQuantity, setReportQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    const problem = [...expired, ...expiring];
    
    return { expiredItems: expired, expiringItems: expiring, problemItems: problem };
  }, [items, reminderDays]);

  // Filter items by search
  const filteredExpiredItems = useMemo(() => {
    if (!itemSearchTerm.trim()) return expiredItems;
    const search = itemSearchTerm.toLowerCase();
    return expiredItems.filter(item =>
      item.name.toLowerCase().includes(search) ||
      item.barcode.toLowerCase().includes(search)
    );
  }, [expiredItems, itemSearchTerm]);

  const filteredExpiringItems = useMemo(() => {
    if (!itemSearchTerm.trim()) return expiringItems;
    const search = itemSearchTerm.toLowerCase();
    return expiringItems.filter(item =>
      item.name.toLowerCase().includes(search) ||
      item.barcode.toLowerCase().includes(search)
    );
  }, [expiringItems, itemSearchTerm]);

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

  // Open quick report dialog for an item
  const handleOpenReportDialog = (item: typeof items[0]) => {
    const expiryInfo = getItemExpiryInfo(item);
    setSelectedItem({
      id: item.id,
      name: item.name,
      barcode: item.barcode,
      issue_type: expiryInfo.type === "expired" ? "expired" : "expiring",
      days_info: expiryInfo.label,
    });
    setSelectedMarketId("");
    setReportQuantity(1);
    setIsReportDialogOpen(true);
  };

  // Submit quick report
  const handleSubmitQuickReport = async () => {
    if (!currentPerson?.id || !selectedMarketId || !selectedItem) return;
    
    const market = assignedMarkets.find(a => a.market?.id === selectedMarketId)?.market;
    if (!market) return;
    
    setIsSubmitting(true);
    
    try {
      // Create visit
      createVisit.mutate({
        delivery_person_id: currentPerson.id,
        market_id: selectedMarketId,
        notes: `ڕاپۆرت: ${selectedItem.name} - ${selectedItem.days_info}`,
      }, {
        onSuccess: (visit) => {
          // Add visit item
          addVisitItem.mutate({
            visit_id: visit.id,
            item_id: selectedItem.id,
            quantity: reportQuantity,
            issue_type: selectedItem.issue_type,
          }, {
            onSuccess: () => {
              toast.success("ڕاپۆرت نێردرا", {
                description: `${selectedItem.name} بۆ ${market.name}`,
              });
              setIsReportDialogOpen(false);
              setSelectedItem(null);
              refetchVisits();
            },
            onError: () => {
              toast.error("هەڵە ڕوویدا");
            },
          });
        },
        onError: () => {
          toast.error("هەڵە ڕوویدا");
        },
        onSettled: () => {
          setIsSubmitting(false);
        },
      });
    } catch (error) {
      toast.error("هەڵە ڕوویدا");
      setIsSubmitting(false);
    }
  };

  // Report market as safe (no issues)
  const handleReportMarketSafe = async (marketId: string, marketName: string) => {
    if (!currentPerson?.id) return;
    
    createVisit.mutate({
      delivery_person_id: currentPerson.id,
      market_id: marketId,
      notes: "سەردان کرا - سەلامەتە",
      status: "resolved",
    }, {
      onSuccess: () => {
        toast.success("ڕاپۆرت نێردرا", {
          description: `${marketName} سەلامەتە`,
        });
        refetchVisits();
      },
    });
  };

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

  // Item card component for reuse
  const ItemCard = ({ item, variant }: { item: typeof items[0]; variant: "expired" | "expiring" }) => {
    const expiryInfo = getItemExpiryInfo(item);
    const isExpired = variant === "expired";
    
    return (
      <Card className={`${isExpired ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"}`}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Item Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${isExpired ? "bg-destructive/20" : "bg-warning/20"}`}>
                {isExpired ? (
                  <Trash2 className="h-5 w-5 text-destructive" />
                ) : (
                  <RefreshCw className="h-5 w-5 text-warning" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base truncate">{item.name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{item.barcode}</span>
                  <Badge 
                    variant={isExpired ? "destructive" : "outline"}
                    className={`text-xs ${!isExpired ? "text-warning border-warning/30" : ""}`}
                  >
                    {expiryInfo.label}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            <Button 
              size="sm"
              variant={isExpired ? "destructive" : "default"}
              className="w-full sm:w-auto gap-2"
              onClick={() => handleOpenReportDialog(item)}
            >
              <Send className="h-4 w-4" />
              <span>ڕاپۆرت</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="space-y-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold">بەخێربێیت، {currentPerson.name}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              چاودێری بەسەرچوون لە ماڕکێتەکان
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="gap-2 text-xs sm:text-sm">
              <LayoutDashboard className="h-4 w-4" />
              داشبۆرد
            </TabsTrigger>
            <TabsTrigger value="markets" className="gap-2 text-xs sm:text-sm">
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

            {/* Search */}
            {problemItems.length > 0 && (
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={itemSearchTerm}
                  onChange={(e) => setItemSearchTerm(e.target.value)}
                  placeholder="گەڕان بە ناو یان بارکۆد..."
                  className="pr-10"
                />
              </div>
            )}

            {/* Expired Items */}
            {filteredExpiredItems.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  مادە بەسەرچووەکان ({filteredExpiredItems.length})
                </h2>
                <div className="space-y-2">
                  {filteredExpiredItems.map(item => (
                    <ItemCard key={item.id} item={item} variant="expired" />
                  ))}
                </div>
              </div>
            )}

            {/* Expiring Items */}
            {filteredExpiringItems.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-warning flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  مادە نزیک بەسەرچوون ({filteredExpiringItems.length})
                </h2>
                <div className="space-y-2">
                  {filteredExpiringItems.map(item => (
                    <ItemCard key={item.id} item={item} variant="expiring" />
                  ))}
                </div>
              </div>
            )}

            {/* No issues */}
            {expiredItems.length === 0 && expiringItems.length === 0 && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="py-8">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <ShieldCheck className="h-12 w-12 text-green-500" />
                    <div>
                      <p className="font-semibold text-green-600">هیچ مادە کێشەدارێک نییە!</p>
                      <p className="text-sm text-muted-foreground mt-1">هەموو مادەکان سەلامەتن</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Visits */}
            {myVisits.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    ڕاپۆرتەکانی دوایی
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2">
                    {myVisits.slice(0, 5).map((visit) => (
                      <div
                        key={visit.id}
                        className="flex items-center justify-between p-2 rounded-lg border text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{visit.market?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(visit.visit_date), 'yyyy/MM/dd - HH:mm')}
                          </p>
                        </div>
                        <Badge variant={
                          visit.status === "resolved" ? "default" :
                          visit.status === "reviewed" ? "secondary" : "outline"
                        } className="text-xs flex-shrink-0 ml-2">
                          {visit.status === "resolved" ? "چارەسەرکرا" :
                           visit.status === "reviewed" ? "بینراوە" : "چاوەڕوان"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
                  <Card key={assignment.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm sm:text-base truncate">{assignment.market?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              کۆد: {assignment.market?.code} • {assignment.market?.city || "-"}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto gap-2"
                          onClick={() => handleReportMarketSafe(
                            assignment.market?.id || "",
                            assignment.market?.name || ""
                          )}
                          disabled={createVisit.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          سەلامەتە
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

      {/* Quick Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Send className="h-5 w-5" />
              ناردنی ڕاپۆرت
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              {/* Item Info */}
              <Card className={`${selectedItem.issue_type === "expired" ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"}`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${selectedItem.issue_type === "expired" ? "bg-destructive/20" : "bg-warning/20"}`}>
                      {selectedItem.issue_type === "expired" ? (
                        <Trash2 className="h-5 w-5 text-destructive" />
                      ) : (
                        <RefreshCw className="h-5 w-5 text-warning" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{selectedItem.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{selectedItem.barcode}</span>
                        <Badge 
                          variant={selectedItem.issue_type === "expired" ? "destructive" : "outline"}
                          className={`text-xs ${selectedItem.issue_type !== "expired" ? "text-warning border-warning/30" : ""}`}
                        >
                          {selectedItem.days_info}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Market Selection */}
              <div className="space-y-2">
                <Label className="text-sm">ماڕکێت هەڵبژێرە</Label>
                <Select value={selectedMarketId} onValueChange={setSelectedMarketId}>
                  <SelectTrigger>
                    <SelectValue placeholder="ماڕکێتێک هەڵبژێرە..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedMarkets.map((assignment) => (
                      <SelectItem key={assignment.market?.id} value={assignment.market?.id || ""}>
                        {assignment.market?.name} ({assignment.market?.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label className="text-sm">ژمارەی مادە</Label>
                <Input
                  type="number"
                  min="0"
                  value={reportQuantity}
                  onChange={(e) => setReportQuantity(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
                <p className="text-xs text-muted-foreground">
                  ئەگەر 0 بێت = ماڕکێت سەلامەتە بۆ ئەم مادەیە
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsReportDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              پاشگەزبوونەوە
            </Button>
            <Button
              onClick={handleSubmitQuickReport}
              disabled={!selectedMarketId || isSubmitting}
              className="w-full sm:w-auto gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                  چاوەڕێ بکە...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  ناردنی ڕاپۆرت
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
