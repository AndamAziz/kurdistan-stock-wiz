import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  CheckCircle,
  Plus,
  Package,
  Calendar,
  RefreshCw,
  Trash2,
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

  const [searchTerm, setSearchTerm] = useState("");
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<{ id: string; name: string; code: string } | null>(null);
  const [visitNotes, setVisitNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<Array<{
    item_id: string;
    item_name: string;
    barcode: string;
    quantity: number;
    issue_type: string;
    days_info: string;
    exp_date: string | null;
  }>>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
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
    
    // Filter by search term
    if (itemSearch) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item.barcode.toLowerCase().includes(itemSearch.toLowerCase())
      );
    }
    
    return filtered;
  }, [problemItems, expiredItems, expiringItems, issueTypeFilter, itemSearch]);

  const filteredMarkets = assignedMarkets.filter(market =>
    market.market?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    market.market?.code.toLowerCase().includes(searchTerm.toLowerCase())
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
    setSelectedItems([]);
    setItemSearch("");
    setIssueTypeFilter("all");
    setIsVisitDialogOpen(true);
  };

  const handleAddItem = (item: typeof items[0]) => {
    // Check if already added
    if (selectedItems.some(si => si.item_id === item.id)) {
      return;
    }
    
    const expiryInfo = getItemExpiryInfo(item);
    
    setSelectedItems([...selectedItems, {
      item_id: item.id,
      item_name: item.name,
      barcode: item.barcode,
      quantity: itemQuantity,
      issue_type: expiryInfo.type === "expired" ? "expired" : "expiring",
      days_info: expiryInfo.label,
      exp_date: item.exp_date,
    }]);
    
    setSelectedItemId("");
    setItemQuantity(1);
    setItemSearch("");
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSubmitVisit = async () => {
    if (!currentPerson?.id || !selectedMarket?.id) return;
    
    createVisit.mutate({
      delivery_person_id: currentPerson.id,
      market_id: selectedMarket.id,
      notes: visitNotes || `سەردانی ماڕکێت: ${selectedMarket.name} (${selectedMarket.code})`,
    }, {
      onSuccess: (visit) => {
        // Add visit items
        selectedItems.forEach(item => {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">بەخێربێیت، {currentPerson.name}</h1>
              <p className="text-sm text-muted-foreground">
                داشبۆردی مەندوب - چاودێری بەسەرچوون
              </p>
            </div>
          </div>
        </div>

        {/* Alert Stats */}
        <div className="grid gap-4 grid-cols-2">
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="pt-4">
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
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{expiringItems.length}</p>
                  <p className="text-xs text-warning/80">نزیکە بەسەربچێت</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card about reporting */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary">ڕاپۆرتکردنی کێشە</p>
                <p className="text-xs text-muted-foreground">
                  کاتێک سەردانی ماڕکێتێک دەکەیت، تەنها مادە بەسەرچووەکان و نزیک بەسەرچوونەکان پیشانی دەدرێت. 
                  کۆمپانیا ئاگادار دەکرێتەوە بۆ نوێکردنەوە یان لابردنی مادەکان.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expired Items Alert */}
        {expiredItems.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                مادە بەسەرچووەکان ({expiredItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {expiredItems.slice(0, 10).map(item => {
                  const expiryInfo = getItemExpiryInfo(item);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <div>
                          <span className="text-sm font-medium">{item.name}</span>
                          <p className="text-xs text-muted-foreground">{item.barcode}</p>
                        </div>
                      </div>
                      <Badge variant="destructive">
                        {expiryInfo.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expiring Items Alert */}
        {expiringItems.length > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-warning">
                <Clock className="h-4 w-4" />
                مادە نزیک بەسەرچوون ({expiringItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {expiringItems.slice(0, 10).map(item => {
                  const expiryInfo = getItemExpiryInfo(item);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-warning" />
                        <div>
                          <span className="text-sm font-medium">{item.name}</span>
                          <p className="text-xs text-muted-foreground">{item.barcode}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-warning border-warning/30">
                        {expiryInfo.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Markets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              ماڕکێتەکانی من ({assignedMarkets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                <p className="text-center text-muted-foreground py-4">
                  هیچ ماڕکێتێک نییە
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredMarkets.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-all"
                    >
                      <div>
                        <p className="font-semibold">{assignment.market?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.market?.code} • {assignment.market?.city || "-"}
                        </p>
                        {assignment.market?.phone && (
                          <p className="text-xs text-muted-foreground">{assignment.market.phone}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleStartVisit({
                          id: assignment.market?.id || "",
                          name: assignment.market?.name || "",
                          code: assignment.market?.code || "",
                        })}
                      >
                        سەردان
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Visits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              سەردانەکانی دوایی
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myVisits.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                هیچ سەردانێک نییە
              </p>
            ) : (
              <div className="space-y-3">
                {myVisits.slice(0, 5).map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{visit.market?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(visit.visit_date), 'yyyy/MM/dd - HH:mm')}
                      </p>
                    </div>
                    <Badge variant={
                      visit.status === "resolved" ? "default" :
                      visit.status === "reviewed" ? "secondary" : "outline"
                    }>
                      {visit.status === "resolved" ? "چارەسەرکرا" :
                       visit.status === "reviewed" ? "بینراوە" : "چاوەڕوان"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visit Dialog - Only shows problem items */}
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

            {/* Search items */}
            <div className="space-y-3">
              <Label>گەڕان لە مادە کێشەدارەکان</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="گەڕان بە ناو یان بارکۆد..."
                  className="pr-10"
                />
              </div>
            </div>
              
            {/* Problem items list */}
            <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
              {filteredProblemItems.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  هیچ مادە کێشەدارێک نییە
                </div>
              ) : (
                filteredProblemItems.map(item => {
                  const expiryInfo = getItemExpiryInfo(item);
                  const isAlreadyAdded = selectedItems.some(si => si.item_id === item.id);
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-3 flex items-center justify-between gap-2 hover:bg-muted/50 transition-colors ${
                        isAlreadyAdded ? "bg-primary/5 opacity-60" : "cursor-pointer"
                      }`}
                      onClick={() => !isAlreadyAdded && handleAddItem(item)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {expiryInfo.type === "expired" ? (
                            <Trash2 className="h-4 w-4 text-destructive flex-shrink-0" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-warning flex-shrink-0" />
                          )}
                          <p className="text-sm font-medium truncate">{item.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mr-6">{item.barcode}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={expiryInfo.type === "expired" ? "destructive" : "outline"}
                          className={expiryInfo.type !== "expired" ? "text-warning border-warning/30" : ""}
                        >
                          {expiryInfo.label}
                        </Badge>
                        {isAlreadyAdded ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  مادە هەڵبژێردراوەکان ({selectedItems.length})
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {item.issue_type === "expired" ? (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-warning" />
                          )}
                          <p className="text-sm font-medium truncate">{item.item_name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mr-6">
                          {item.barcode} • {item.days_info}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        سڕینەوە
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>تێبینی</Label>
              <Textarea
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="تێبینی سەبارەت بە سەردانەکە..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmitVisit}
              disabled={createVisit.isPending || selectedItems.length === 0}
              className="w-full"
            >
              {createVisit.isPending ? "چاوەڕێ بکە..." : `ناردنی ڕاپۆرت (${selectedItems.length} مادە)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
