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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Search,
  Eye,
  CheckCircle,
  AlertTriangle,
  Package,
  Calendar,
  User,
  MapPin,
  Store,
  Truck,
  Filter,
  X,
  MessageCircle,
  Bell,
} from "lucide-react";
import { useUserRoles } from "@/hooks/useUserRoles";
import {
  useMarketVisits,
  useVisitItems,
  useVisitItemsByVisitIds,
  useUpdateVisitStatus,
  useUpdateVisitItem,
  useDeliveryPersons,
  useAssignedMarkets,
  useAllMarketAssignments,
} from "@/hooks/useDeliveryPersons";
import { useMarkets } from "@/hooks/useMarkets";
import { format, isToday, startOfDay, subDays } from "date-fns";

export default function VisitReports() {
  const { isAdmin } = useUserRoles();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deliveryPersonFilter, setDeliveryPersonFilter] = useState<string>("all");
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"visits" | "markets">("visits");
  
  const { data: visits = [], isLoading } = useMarketVisits(
    null, 
    statusFilter === "all" ? undefined : statusFilter
  );
  const { data: visitItems = [] } = useVisitItems(selectedVisitId ?? undefined);
  const { data: deliveryPersons = [] } = useDeliveryPersons();
  const { data: markets = [], isLoading: isLoadingMarkets } = useMarkets();
  const { data: assignedMarkets = [] } = useAssignedMarkets(
    deliveryPersonFilter !== "all" ? deliveryPersonFilter : undefined
  );
  const { data: allMarketAssignments = [] } = useAllMarketAssignments();
  
  // Get all visit IDs for the selected delivery person's assigned markets
  const allVisitIdsForDeliveryPerson = useMemo(() => {
    if (deliveryPersonFilter === "all") return [];
    return visits
      .filter(v => v.delivery_person_id === deliveryPersonFilter)
      .map(v => v.id);
  }, [visits, deliveryPersonFilter]);
  
  const { data: allVisitItemsForDeliveryPerson = [] } = useVisitItemsByVisitIds(allVisitIdsForDeliveryPerson);
  
  const updateVisitStatus = useUpdateVisitStatus();
  const updateVisitItem = useUpdateVisitItem();

  const [actionTaken, setActionTaken] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showAllMarkets, setShowAllMarkets] = useState(false);

  // Get unique delivery persons from all delivery persons list (not just from visits)
  const uniqueDeliveryPersons = useMemo(() => {
    return deliveryPersons.map(dp => ({ id: dp.id, name: dp.name }));
  }, [deliveryPersons]);

  const uniqueMarkets = useMemo(() => {
    const mkts = new Map<string, { name: string; code: string }>();
    visits.forEach(v => {
      if (v.market?.id && v.market?.name) {
        mkts.set(v.market.id, { name: v.market.name, code: v.market.code });
      }
    });
    return Array.from(mkts.entries()).map(([id, data]) => ({ id, ...data }));
  }, [visits]);

  // Create a map of market_id to assigned delivery person
  const marketToDeliveryPersonMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    allMarketAssignments.forEach(assignment => {
      if (assignment.market_id && assignment.delivery_person) {
        map.set(assignment.market_id, assignment.delivery_person);
      }
    });
    return map;
  }, [allMarketAssignments]);

  // All markets with their assigned delivery person
  const allMarketsWithAssignment = useMemo(() => {
    return markets.map(market => ({
      ...market,
      assignedDeliveryPerson: marketToDeliveryPersonMap.get(market.id) || null,
    }));
  }, [markets, marketToDeliveryPersonMap]);

  // Get market visit status for assigned markets with reported items data
  const assignedMarketsWithVisitStatus = useMemo(() => {
    if (deliveryPersonFilter === "all") return [];
    
    return assignedMarkets.map(assignment => {
      const marketId = assignment.market?.id;
      
      // Get all visits for this market by this delivery person
      const marketVisits = visits.filter(v => 
        v.market_id === marketId && 
        v.delivery_person_id === deliveryPersonFilter
      );
      
      // Get today's visit
      const todayVisit = marketVisits.find(v => isToday(new Date(v.visit_date)));
      
      // Get last 7 days visits
      const last7DaysVisits = marketVisits.filter(v => {
        const visitDate = new Date(v.visit_date);
        const sevenDaysAgo = subDays(new Date(), 7);
        return visitDate >= sevenDaysAgo;
      });
      
      // Get the most recent visit
      const lastVisit = marketVisits.length > 0 ? marketVisits[0] : null;
      
      // Count pending visits
      const pendingVisits = marketVisits.filter(v => v.status === "pending");
      
      // Get all visits with their IDs for fetching items
      const allVisitIds = marketVisits.map(v => v.id);
      
      // Get reported items for this market from all visits
      const reportedItems = allVisitItemsForDeliveryPerson.filter(
        item => item.visit?.market_id === marketId
      );
      
      // Categorize items by issue type
      const expiredItems = reportedItems.filter(item => item.issue_type === "expired");
      const expiringItems = reportedItems.filter(item => item.issue_type === "expiring");
      
      // Get pending items (not yet actioned)
      const pendingItems = reportedItems.filter(item => !item.action_taken);
      
      return {
        ...assignment,
        todayVisit,
        lastVisit,
        last7DaysVisits,
        pendingVisits,
        totalVisits: marketVisits.length,
        allVisitIds,
        marketVisits,
        reportedItems,
        expiredItems,
        expiringItems,
        pendingItems,
      };
    });
  }, [assignedMarkets, visits, deliveryPersonFilter, allVisitItemsForDeliveryPerson]);

  const filteredVisits = useMemo(() => {
    return visits.filter(visit => {
      // Search filter
      const matchesSearch = 
        visit.market?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.market?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.delivery_person?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Delivery person filter
      const matchesDeliveryPerson = 
        deliveryPersonFilter === "all" || 
        visit.delivery_person?.id === deliveryPersonFilter;
      
      // Market filter
      const matchesMarket = 
        marketFilter === "all" || 
        visit.market?.id === marketFilter;
      
      return matchesSearch && matchesDeliveryPerson && matchesMarket;
    });
  }, [visits, searchTerm, deliveryPersonFilter, marketFilter]);

  const hasActiveFilters = deliveryPersonFilter !== "all" || marketFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setDeliveryPersonFilter("all");
    setMarketFilter("all");
    setStatusFilter("all");
    setSearchTerm("");
  };

  const handleViewDetails = (visitId: string) => {
    setSelectedVisitId(visitId);
    setIsDetailDialogOpen(true);
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedVisitId) return;
    
    updateVisitStatus.mutate({ visitId: selectedVisitId, status }, {
      onSuccess: () => {
        if (status === "resolved") {
          setIsDetailDialogOpen(false);
        }
      },
    });
  };

  const handleUpdateItem = () => {
    if (!selectedItemId || !actionTaken) return;
    
    updateVisitItem.mutate({
      itemId: selectedItemId,
      action_taken: actionTaken,
      admin_notes: adminNotes,
    }, {
      onSuccess: () => {
        setSelectedItemId(null);
        setActionTaken("");
        setAdminNotes("");
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">چارەسەرکرا</Badge>;
      case "reviewed":
        return <Badge variant="secondary">بینراوە</Badge>;
      default:
        return <Badge variant="outline" className="border-warning text-warning">چاوەڕوان</Badge>;
    }
  };

  const getIssueTypeBadge = (type: string) => {
    switch (type) {
      case "expired":
        return <Badge variant="destructive">بەسەرچوو</Badge>;
      case "expiring":
        return <Badge className="bg-warning/10 text-warning border-warning/20">نزیک بەسەرچوون</Badge>;
      case "damaged":
        return <Badge variant="secondary">خراپ</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const selectedVisit = visits.find(v => v.id === selectedVisitId);

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">تەنها ئەدمین دەتوانێت ئەم لاپەڕەیە ببینێت</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10">
              <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold">ڕاپۆرتی سەردانەکان</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                بینینی ڕاپۆرتەکانی مەندوبەکان
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="گەڕان بە ناوی مەندوب، ماڕکێت..."
              className="pr-10 h-9 sm:h-10 text-sm"
            />
          </div>
          
          {/* Filter Row */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="دۆخ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">هەموو دۆخەکان</SelectItem>
                <SelectItem value="pending">چاوەڕوان</SelectItem>
                <SelectItem value="reviewed">بینراوە</SelectItem>
                <SelectItem value="resolved">چارەسەرکرا</SelectItem>
              </SelectContent>
            </Select>

            <Select value={deliveryPersonFilter} onValueChange={setDeliveryPersonFilter}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm sm:w-56">
                <div className="flex items-center gap-1.5">
                  <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span className="truncate"><SelectValue placeholder="مەندوب" /></span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">هەموو مەندوبەکان</SelectItem>
                {uniqueDeliveryPersons.map(person => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={marketFilter} onValueChange={setMarketFilter}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm sm:w-56">
                <div className="flex items-center gap-1.5">
                  <Store className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span className="truncate"><SelectValue placeholder="ماڕکێت" /></span>
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">هەموو ({markets.length})</SelectItem>
                {markets.map(market => (
                  <SelectItem key={market.id} value={market.id}>
                    {market.name} ({market.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="h-9 sm:h-10 text-xs sm:text-sm gap-1"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">سڕینەوەی فلتەر</span>
              </Button>
            ) : (
              <Button 
                variant={showAllMarkets ? "default" : "outline"}
                size="sm" 
                onClick={() => setShowAllMarkets(!showAllMarkets)}
                className="h-9 sm:h-10 text-xs sm:text-sm gap-1"
              >
                <Store className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">
                  {showAllMarkets 
                    ? "شاردنەوە" 
                    : deliveryPersonFilter === "all"
                      ? `ماڕکێت (${markets.length})`
                      : `ماڕکێت (${assignedMarkets.length})`
                  }
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats - Different based on filter */}
        {deliveryPersonFilter !== "all" ? (
          // Stats for selected delivery person
          <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:grid-cols-4">
            <Card>
              <CardContent className="p-3 sm:pt-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Store className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold">{assignedMarkets.length}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">کۆی ماڕکێت</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:pt-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold">
                      {assignedMarketsWithVisitStatus.filter(m => m.todayVisit).length}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">سەردانکرا</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:pt-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold">
                      {assignedMarketsWithVisitStatus.filter(m => !m.todayVisit).length}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">ماوە</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:pt-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-warning/10">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold">
                      {assignedMarketsWithVisitStatus.reduce((sum, m) => sum + m.pendingVisits.length, 0)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">چاوەڕوان</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Global stats
          <div className="grid gap-2 sm:gap-4 grid-cols-3">
            <Card>
              <CardContent className="p-3 sm:pt-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-warning/10">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold">
                      {visits.filter(v => v.status === "pending").length}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">چاوەڕوان</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:pt-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold">
                      {visits.filter(v => v.status === "reviewed").length}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">بینراوە</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:pt-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold">
                      {visits.filter(v => v.status === "resolved").length}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">چارەسەرکرا</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Assigned Markets View - Automatically shows when delivery person is selected */}
        {deliveryPersonFilter !== "all" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="h-5 w-5" />
                ماڕکێتەکانی {uniqueDeliveryPersons.find(p => p.id === deliveryPersonFilter)?.name}
                <Badge variant="secondary" className="mr-2">{assignedMarkets.length} ماڕکێت</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ماڕکێت</TableHead>
                      <TableHead>شار</TableHead>
                      <TableHead>مادە بەسەرچوو</TableHead>
                      <TableHead>نزیک بەسەرچوون</TableHead>
                      <TableHead>دۆخی سەردان</TableHead>
                      <TableHead>ڕاپۆرتەکان</TableHead>
                      <TableHead>کردار</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedMarketsWithVisitStatus.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{assignment.market?.name}</p>
                              <p className="text-xs text-muted-foreground">کۆد: {assignment.market?.code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{assignment.market?.city || "-"}</span>
                        </TableCell>
                        <TableCell>
                          {assignment.expiredItems.length > 0 ? (
                            <Badge variant="destructive" className="text-xs">
                              {assignment.expiredItems.reduce((sum, item) => sum + item.quantity, 0)} دانە
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {assignment.expiringItems.length > 0 ? (
                            <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">
                              {assignment.expiringItems.reduce((sum, item) => sum + item.quantity, 0)} دانە
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {assignment.todayVisit ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              <CheckCircle className="h-3 w-3 ml-1" />
                              سەردانکرا ئەمڕۆ
                            </Badge>
                          ) : assignment.lastVisit ? (
                            <Badge variant="outline" className="text-muted-foreground">
                              دوایین: {format(new Date(assignment.lastVisit.visit_date), 'MM/dd')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-500 border-orange-500/30">
                              سەردان نەکراوە
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {assignment.pendingItems.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {assignment.pendingItems.length} چاوەڕوان
                              </Badge>
                            )}
                            {assignment.totalVisits > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {assignment.totalVisits} سەردان
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {assignment.pendingVisits.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(assignment.pendingVisits[0].id)}
                            >
                              <Eye className="h-4 w-4 ml-1" />
                              بینین
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Markets View - When showAllMarkets button is clicked */}
        {showAllMarkets && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="h-5 w-5" />
                {deliveryPersonFilter === "all" 
                  ? "هەموو ماڕکێتەکان"
                  : `ماڕکێتەکانی ${uniqueDeliveryPersons.find(p => p.id === deliveryPersonFilter)?.name}`
                }
                <Badge variant="secondary" className="mr-2">
                  {deliveryPersonFilter === "all" ? markets.length : assignedMarkets.length} ماڕکێت
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingMarkets ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>کۆد</TableHead>
                        <TableHead>ماڕکێت</TableHead>
                        <TableHead>شار</TableHead>
                        <TableHead>ناوچە</TableHead>
                        <TableHead>مەندوبی بەرپرس</TableHead>
                        {deliveryPersonFilter !== "all" && <TableHead>دۆخی سەردان</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(deliveryPersonFilter === "all" 
                        ? allMarketsWithAssignment
                        : assignedMarketsWithVisitStatus.map(a => ({
                            ...a.market,
                            assignedDeliveryPerson: uniqueDeliveryPersons.find(p => p.id === deliveryPersonFilter) || null,
                            visitStatus: a.todayVisit ? 'today' : a.lastVisit ? 'past' : 'never',
                            lastVisitDate: a.lastVisit?.visit_date,
                          }))
                      )
                        .filter(market => 
                          searchTerm === "" ||
                          market?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          market?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          market?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          market?.assignedDeliveryPerson?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((market) => (
                          <TableRow key={market?.id}>
                            <TableCell>
                              <span className="text-sm font-mono">{market?.code}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Store className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">{market?.name}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{market?.city || "-"}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{market?.zone || "-"}</span>
                            </TableCell>
                            <TableCell>
                              {market?.assignedDeliveryPerson ? (
                                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                  <Truck className="h-3 w-3" />
                                  {market.assignedDeliveryPerson.name}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  بەرپرسی نییە
                                </Badge>
                              )}
                            </TableCell>
                            {deliveryPersonFilter !== "all" && (
                              <TableCell>
                                {(market as any).visitStatus === 'today' ? (
                                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                    <CheckCircle className="h-3 w-3 ml-1" />
                                    سەردانکرا ئەمڕۆ
                                  </Badge>
                                ) : (market as any).visitStatus === 'past' ? (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    دوایین: {format(new Date((market as any).lastVisitDate), 'MM/dd')}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-orange-500 border-orange-500/30">
                                    سەردان نەکراوە
                                  </Badge>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Visits List */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
              <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
              {deliveryPersonFilter !== "all" ? "ڕاپۆرتەکانی سەردان" : "هەموو سەردانەکان"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredVisits.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
                هیچ سەردانێک نییە
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-2">
                  {filteredVisits.map((visit) => (
                    <div 
                      key={visit.id} 
                      className="border rounded-lg p-3 space-y-2 bg-card"
                      onClick={() => handleViewDetails(visit.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{format(new Date(visit.visit_date), 'MM/dd')}</span>
                        </div>
                        {getStatusBadge(visit.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Store className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium truncate max-w-[120px]">{visit.market?.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate max-w-[80px]">{visit.delivery_person?.name}</span>
                        </div>
                      </div>
                      {visit.notes && (
                        <p className="text-[10px] text-muted-foreground truncate">{visit.notes}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">بەروار</TableHead>
                        <TableHead className="text-xs">مەندوب</TableHead>
                        <TableHead className="text-xs">ماڕکێت</TableHead>
                        <TableHead className="text-xs">تێبینی</TableHead>
                        <TableHead className="text-xs">دۆخ</TableHead>
                        <TableHead className="text-xs">کردار</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVisits.map((visit) => (
                        <TableRow key={visit.id}>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              {format(new Date(visit.visit_date), 'yyyy/MM/dd')}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {visit.delivery_person?.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{visit.market?.name}</p>
                                <p className="text-[10px] text-muted-foreground">{visit.market?.code}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <p className="text-muted-foreground truncate max-w-[150px]">
                              {visit.notes || "-"}
                            </p>
                          </TableCell>
                          <TableCell>{getStatusBadge(visit.status)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(visit.id)}
                              className="h-7 text-xs"
                            >
                              <Eye className="h-3 w-3 ml-1" />
                              بینین
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visit Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
              زانیاری سەردان
            </DialogTitle>
          </DialogHeader>
          
          {selectedVisit && (
            <div className="space-y-4 sm:space-y-6">
              {/* Visit Info */}
              <div className="grid gap-3 sm:gap-4 grid-cols-2">
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-[10px] sm:text-sm text-muted-foreground">مەندوب</p>
                  <p className="text-xs sm:text-sm font-medium">{selectedVisit.delivery_person?.name}</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-[10px] sm:text-sm text-muted-foreground">ماڕکێت</p>
                  <p className="text-xs sm:text-sm font-medium">{selectedVisit.market?.name}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{selectedVisit.market?.code}</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-[10px] sm:text-sm text-muted-foreground">بەروار</p>
                  <p className="text-xs sm:text-sm font-medium">
                    {format(new Date(selectedVisit.visit_date), 'yyyy/MM/dd - HH:mm')}
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-[10px] sm:text-sm text-muted-foreground">دۆخ</p>
                  {getStatusBadge(selectedVisit.status)}
                </div>
              </div>

              {selectedVisit.notes && (
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-sm text-muted-foreground">تێبینی مەندوب</p>
                  <p className="p-2 sm:p-3 rounded-lg bg-muted/30 text-xs sm:text-sm">{selectedVisit.notes}</p>
                </div>
              )}

              {/* Visit Items */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                  مادە ڕاپۆرتکراوەکان
                </h3>
                
                {visitItems.length === 0 ? (
                  <p className="text-center text-xs sm:text-sm text-muted-foreground py-4">
                    هیچ مادەیەک ڕاپۆرت نەکراوە
                  </p>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {visitItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-3 sm:pt-4">
                          <div className="flex items-start justify-between gap-2 sm:gap-4">
                            <div className="space-y-1 sm:space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs sm:text-sm font-medium">{item.item?.name}</p>
                                {getIssueTypeBadge(item.issue_type)}
                              </div>
                              <div className="flex gap-2 sm:gap-4 text-[10px] sm:text-sm text-muted-foreground flex-wrap">
                                <span>بارکۆد: {item.item?.barcode}</span>
                                <span>ژمارە: {item.quantity}</span>
                              </div>
                              {item.action_taken && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500 text-[10px] sm:text-xs">
                                    {item.action_taken === "removed" ? "لابرا" :
                                     item.action_taken === "renewed" ? "نوێکرایەوە" : item.action_taken}
                                  </Badge>
                                </div>
                              )}
                              {item.admin_notes && (
                                <p className="text-[10px] sm:text-sm text-muted-foreground">
                                  تێبینی: {item.admin_notes}
                                </p>
                              )}
                            </div>
                            
                            {!item.action_taken && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedItemId(item.id)}
                                className="h-7 sm:h-8 text-[10px] sm:text-xs"
                              >
                                چارەسەر
                              </Button>
                            )}
                          </div>
                          
                          {/* Action Form */}
                          {selectedItemId === item.id && (
                            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t space-y-2 sm:space-y-3">
                              <div className="space-y-1 sm:space-y-2">
                                <Label className="text-xs sm:text-sm">کردار</Label>
                                <Select value={actionTaken} onValueChange={setActionTaken}>
                                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                                    <SelectValue placeholder="کردارێک هەڵبژێرە" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="removed">لابردن</SelectItem>
                                    <SelectItem value="renewed">نوێکردنەوە</SelectItem>
                                    <SelectItem value="pending">چاوەڕوان</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1 sm:space-y-2">
                                <Label className="text-xs sm:text-sm">تێبینی</Label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="تێبینی..."
                                  rows={2}
                                  className="text-xs sm:text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleUpdateItem}
                                  disabled={!actionTaken || updateVisitItem.isPending}
                                  className="h-7 sm:h-8 text-[10px] sm:text-xs"
                                >
                                  تۆمارکردن
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedItemId(null);
                                    setActionTaken("");
                                    setAdminNotes("");
                                  }}
                                  className="h-7 sm:h-8 text-[10px] sm:text-xs"
                                >
                                  پاشگەزبوونەوە
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Actions */}
              <div className="flex gap-2 pt-3 sm:pt-4 border-t flex-wrap">
                {selectedVisit.status === "pending" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUpdateStatus("reviewed")}
                    disabled={updateVisitStatus.isPending}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    بینراو
                  </Button>
                )}
                {selectedVisit.status !== "resolved" && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus("resolved")}
                    disabled={updateVisitStatus.isPending}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                    چارەسەرکرا
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
