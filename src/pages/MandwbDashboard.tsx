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

  const { activeTab, setActiveTab, isVisitMode, visitMarket, startVisit, endVisit } = useMandwbTab();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Visit mode state - simplified to just two numbers
  const [expiredCount, setExpiredCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);

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
    setExpiredCount(0);
    setExpiringCount(0);
    startVisit(market);
  };

  const handleSubmitVisit = async () => {
    if (!currentPerson?.id || !visitMarket?.id) return;
    
    // Determine status based on counts
    const hasIssues = expiredCount > 0 || expiringCount > 0;
    const notes = hasIssues 
      ? `بەسەرچوو: ${expiredCount}، نزیک بەسەرچوون: ${expiringCount}`
      : `ماڕکێت سەلامەتە - هیچ کێشەیەک نییە`;

    createVisit.mutate({
      delivery_person_id: currentPerson.id,
      market_id: visitMarket.id,
      notes,
    }, {
      onSuccess: () => {
        toast.success(
          hasIssues 
            ? `ڕاپۆرت نێردرا: ${expiredCount} بەسەرچوو، ${expiringCount} نزیک بەسەرچوون`
            : "ماڕکێت سەلامەتە - ڕاپۆرت نێردرا"
        );
        refetchVisits();
        endVisit();
        setExpiredCount(0);
        setExpiringCount(0);
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

  return (
    <Layout
      expiredCount={expiredCount}
      expiringCount={expiringCount}
      onExpiredChange={setExpiredCount}
      onExpiringChange={setExpiringCount}
      onSubmitVisit={handleSubmitVisit}
      isSubmitting={createVisit.isPending}
    >
      <div className="space-y-4">
        {/* Header - show visit mode header when in visit */}
        {isVisitMode && visitMarket ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="text-lg font-bold">سەردانی {visitMarket.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    کۆد: {visitMarket.code}
                  </p>
                </div>
                <Badge variant="outline" className="text-primary border-primary/30">
                  سەردان
                </Badge>
              </div>
              
              {/* Summary */}
              <div className="mt-4 flex items-center justify-around text-center border-t pt-4">
                <div>
                  <p className="text-xl font-bold text-destructive">{expiredCount}</p>
                  <p className="text-xs text-muted-foreground">بەسەرچوو</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-xl font-bold text-warning">{expiringCount}</p>
                  <p className="text-xs text-muted-foreground">نزیک بەسەرچوون</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div>
                  {expiredCount === 0 && expiringCount === 0 ? (
                    <>
                      <ShieldCheck className="h-6 w-6 text-green-500 mx-auto" />
                      <p className="text-xs text-green-600 font-medium">سەلامەت</p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-6 w-6 text-destructive mx-auto" />
                      <p className="text-xs text-destructive font-medium">کێشەدار</p>
                    </>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-center text-muted-foreground mt-3">
                لە خوارەوە کلیک لە ناوی ماڕکێت بکە بۆ داخڵکردنی ژمارەکان
              </p>
            </CardContent>
          </Card>
        ) : (
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
        )}

        {/* Don't show tabs when in visit mode */}
        {!isVisitMode && (
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
        )}
      </div>
    </Layout>
  );
}
