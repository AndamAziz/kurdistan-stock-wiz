import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useMandwbTab } from "@/hooks/useMandwbTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  MapPin,
  Search,
  Clock,
  Package,
  Calendar,
  RefreshCw,
  Trash2,
  ShieldCheck,
  LayoutDashboard,
  Store,
  CheckCircle2,
  Circle,
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
import { format, differenceInDays, isToday, startOfDay } from "date-fns";
import { toast } from "sonner";
import { VisitItemsList } from "@/components/mandwb/VisitItemsList";

interface VisitItem {
  itemId: string;
  quantity: number;
  issueType: "expired" | "expiring";
}

export default function MandwbDashboard() {
  const { data: currentPerson, isLoading: isLoadingPerson } = useCurrentDeliveryPerson();
  const { data: assignedMarkets = [] } = useAssignedMarkets(currentPerson?.id);
  const { data: myVisits = [], refetch: refetchVisits } = useMarketVisits(currentPerson?.id);
  const { data: items = [] } = useItems();
  const { settings } = useNotificationSettings();
  const createVisit = useCreateVisit();
  const addVisitItem = useAddVisitItem();

  const { activeTab, setActiveTab, isVisitMode, visitMarket, startVisit, endVisit } = useMandwbTab();
  const [searchTerm, setSearchTerm] = useState("");

  // Get reminder days from settings
  const reminderDays = settings?.reminderDays || 30;

  // Calculate expiring and expired items based on settings
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
      } else if (daysUntilExpiry <= reminderDays) {
        expiring.push(item);
      }
    });
    
    return { expiredItems: expired, expiringItems: expiring };
  }, [items, reminderDays]);

  // Calculate visited markets today
  const { visitedMarketIds, visitedToday, remainingToday } = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const visitedIds = new Set<string>();
    
    myVisits.forEach(visit => {
      const visitDate = new Date(visit.visit_date);
      if (isToday(visitDate)) {
        visitedIds.add(visit.market_id);
      }
    });
    
    const visited = assignedMarkets.filter(m => visitedIds.has(m.market?.id || ""));
    const remaining = assignedMarkets.filter(m => !visitedIds.has(m.market?.id || ""));
    
    return {
      visitedMarketIds: visitedIds,
      visitedToday: visited,
      remainingToday: remaining,
    };
  }, [myVisits, assignedMarkets]);

  const filteredMarkets = assignedMarkets.filter(market =>
    market.market?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(market.market?.code || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if a market was visited today
  const isMarketVisitedToday = (marketId: string) => visitedMarketIds.has(marketId);

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
    startVisit(market);
  };

  const handleSubmitVisit = async (visitItems: VisitItem[]) => {
    if (!currentPerson?.id || !visitMarket?.id) return;
    
    // Determine status based on items
    const hasIssues = visitItems.length > 0;
    const expiredCount = visitItems.filter(v => v.issueType === "expired").reduce((sum, v) => sum + v.quantity, 0);
    const expiringCount = visitItems.filter(v => v.issueType === "expiring").reduce((sum, v) => sum + v.quantity, 0);
    
    const notes = hasIssues 
      ? `بەسەرچوو: ${expiredCount}، نزیک بەسەرچوون: ${expiringCount}`
      : `ماڕکێت سەلامەتە - هیچ کێشەیەک نییە`;

    createVisit.mutate({
      delivery_person_id: currentPerson.id,
      market_id: visitMarket.id,
      notes,
    }, {
      onSuccess: async (visit) => {
        // Add visit items if there are any
        if (hasIssues && visit?.id) {
          for (const item of visitItems) {
            await addVisitItem.mutateAsync({
              visit_id: visit.id,
              item_id: item.itemId,
              quantity: item.quantity,
              issue_type: item.issueType,
            });
          }
        }
        
        toast.success(
          hasIssues 
            ? `ڕاپۆرت نێردرا: ${expiredCount} بەسەرچوو، ${expiringCount} نزیک بەسەرچوون`
            : "ماڕکێت سەلامەتە - ڕاپۆرت نێردرا"
        );
        refetchVisits();
        endVisit();
      },
      onError: () => {
        toast.error("هەڵەیەک ڕوویدا لە ناردنی ڕاپۆرت");
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

  // When in visit mode, show the VisitItemsList component
  if (isVisitMode && visitMarket) {
    return (
      <Layout>
        <VisitItemsList
          items={items}
          reminderDays={reminderDays}
          marketName={visitMarket.name}
          marketCode={visitMarket.code}
          onSubmit={handleSubmitVisit}
          onCancel={endVisit}
          isSubmitting={createVisit.isPending}
        />
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
                        ۱. بچۆ بەشی ماڕکێتەکان و کلیک لە "سەردان" بکە<br/>
                        ۲. ژمارەی بەسەرچوو و نزیک بەسەرچوون داخڵ بکە<br/>
                        ۳. ئەگەر هەردووکیان 0 بن = ماڕکێت سەلامەتە
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
              {/* Visit Stats */}
              <div className="grid gap-3 grid-cols-2">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{visitedToday.length}</p>
                        <p className="text-xs text-green-600/80">سەردانکراو ئەمڕۆ</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-orange-500/10 border-orange-500/20">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                        <Circle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{remainingToday.length}</p>
                        <p className="text-xs text-orange-600/80">ماوە</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                  {filteredMarkets.map((assignment) => {
                    const marketId = assignment.market?.id || "";
                    const visited = isMarketVisitedToday(marketId);
                    
                    return (
                      <Card
                        key={assignment.id}
                        className={`cursor-pointer hover:shadow-md transition-all ${
                          visited ? "border-green-500/30 bg-green-500/5" : ""
                        }`}
                        onClick={() => handleStartVisit({
                          id: marketId,
                          name: assignment.market?.name || "",
                          code: assignment.market?.code || "",
                        })}
                      >
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                visited ? "bg-green-500/20" : "bg-primary/10"
                              }`}>
                                {visited ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                  <Store className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{assignment.market?.name}</p>
                                  {visited && (
                                    <Badge variant="outline" className="text-[10px] text-green-600 border-green-500/30 px-1.5 py-0">
                                      سەردانکرا
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  کۆد: {assignment.market?.code} • {assignment.market?.city || "-"}
                                </p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant={visited ? "secondary" : "outline"}
                            >
                              {visited ? "دووبارە" : "سەردان"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
