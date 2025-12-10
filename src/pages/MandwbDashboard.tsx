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
} from "lucide-react";
import { useItems } from "@/hooks/useItems";
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
  const createVisit = useCreateVisit();
  const addVisitItem = useAddVisitItem();

  const [searchTerm, setSearchTerm] = useState("");
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<{ id: string; name: string } | null>(null);
  const [visitNotes, setVisitNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<Array<{
    item_id: string;
    item_name: string;
    quantity: number;
    issue_type: string;
  }>>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [issueType, setIssueType] = useState("expiring");

  // Calculate expiring and expired items
  const { expiredItems, expiringItems } = useMemo(() => {
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
      } else if (daysUntilExpiry <= 30) {
        expiring.push(item);
      }
    });
    
    return { expiredItems: expired, expiringItems: expiring };
  }, [items]);

  const filteredMarkets = assignedMarkets.filter(market =>
    market.market?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    market.market?.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.barcode.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const handleStartVisit = (market: { id: string; name: string }) => {
    setSelectedMarket(market);
    setVisitNotes("");
    setSelectedItems([]);
    setIsVisitDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!selectedItemId) return;
    
    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;
    
    setSelectedItems([...selectedItems, {
      item_id: item.id,
      item_name: item.name,
      quantity: itemQuantity,
      issue_type: issueType,
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
      notes: visitNotes,
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
                داشبۆردی مەندوب
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

        {/* Expiring Items Alert */}
        {expiringItems.length > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                مادە نزیک بەسەرچوون ({expiringItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {expiringItems.slice(0, 10).map(item => {
                  const daysLeft = differenceInDays(new Date(item.exp_date!), new Date());
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <Badge variant="outline" className="text-warning border-warning/30">
                        {daysLeft} ڕۆژ ماوە
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

      {/* Visit Dialog */}
      <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تۆمارکردنی سەردان - {selectedMarket?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add Items */}
            <div className="space-y-3">
              <Label>زیادکردنی مادەی کێشەدار</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="گەڕان بە ناو یان بارکۆد..."
                  />
                </div>
              </div>
              
              {itemSearch && (
                <div className="max-h-32 overflow-y-auto border rounded-lg">
                  {filteredItems.slice(0, 10).map(item => (
                    <div
                      key={item.id}
                      className={`p-2 cursor-pointer hover:bg-muted/50 ${
                        selectedItemId === item.id ? "bg-primary/10" : ""
                      }`}
                      onClick={() => setSelectedItemId(item.id)}
                    >
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.barcode}</p>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Number(e.target.value))}
                  placeholder="ژمارە"
                  className="w-20"
                />
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expired">بەسەرچوو</SelectItem>
                    <SelectItem value="expiring">نزیک بەسەرچوون</SelectItem>
                    <SelectItem value="damaged">خراپ</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddItem} disabled={!selectedItemId}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="space-y-2">
                <Label>مادە هەڵبژێردراوەکان</Label>
                {selectedItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} دانە • {
                          item.issue_type === "expired" ? "بەسەرچوو" :
                          item.issue_type === "expiring" ? "نزیک بەسەرچوون" : "خراپ"
                        }
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      className="text-destructive"
                    >
                      سڕینەوە
                    </Button>
                  </div>
                ))}
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
              disabled={createVisit.isPending}
              className="w-full"
            >
              {createVisit.isPending ? "چاوەڕێ بکە..." : "تۆمارکردنی سەردان"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
