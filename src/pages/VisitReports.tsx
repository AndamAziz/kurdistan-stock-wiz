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
} from "lucide-react";
import { useUserRoles } from "@/hooks/useUserRoles";
import {
  useMarketVisits,
  useVisitItems,
  useUpdateVisitStatus,
  useUpdateVisitItem,
  useDeliveryPersons,
} from "@/hooks/useDeliveryPersons";
import { useMarkets } from "@/hooks/useMarkets";
import { format } from "date-fns";

export default function VisitReports() {
  const { isAdmin } = useUserRoles();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deliveryPersonFilter, setDeliveryPersonFilter] = useState<string>("all");
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  const { data: visits = [], isLoading } = useMarketVisits(
    null, 
    statusFilter === "all" ? undefined : statusFilter
  );
  const { data: visitItems = [] } = useVisitItems(selectedVisitId ?? undefined);
  const { data: deliveryPersons = [] } = useDeliveryPersons();
  const { data: markets = [] } = useMarkets();
  const updateVisitStatus = useUpdateVisitStatus();
  const updateVisitItem = useUpdateVisitItem();

  const [actionTaken, setActionTaken] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Get unique delivery persons and markets from visits
  const uniqueDeliveryPersons = useMemo(() => {
    const persons = new Map<string, string>();
    visits.forEach(v => {
      if (v.delivery_person?.id && v.delivery_person?.name) {
        persons.set(v.delivery_person.id, v.delivery_person.name);
      }
    });
    return Array.from(persons.entries()).map(([id, name]) => ({ id, name }));
  }, [visits]);

  const uniqueMarkets = useMemo(() => {
    const mkts = new Map<string, { name: string; code: string }>();
    visits.forEach(v => {
      if (v.market?.id && v.market?.name) {
        mkts.set(v.market.id, { name: v.market.name, code: v.market.code });
      }
    });
    return Array.from(mkts.entries()).map(([id, data]) => ({ id, ...data }));
  }, [visits]);

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ڕاپۆرتی سەردانەکان</h1>
              <p className="text-sm text-muted-foreground">
                بینینی ڕاپۆرتەکانی مەندوبەکان و چارەسەرکردنی کێشەکان
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="گەڕان بە ناوی مەندوب، ماڕکێت..."
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="دۆخ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">هەموو دۆخەکان</SelectItem>
                <SelectItem value="pending">چاوەڕوان</SelectItem>
                <SelectItem value="reviewed">بینراوە</SelectItem>
                <SelectItem value="resolved">چارەسەرکرا</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Delivery Person Filter */}
            <Select value={deliveryPersonFilter} onValueChange={setDeliveryPersonFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="هەموو مەندوبەکان" />
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

            {/* Market Filter */}
            <Select value={marketFilter} onValueChange={setMarketFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="هەموو ماڕکێتەکان" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">هەموو ماڕکێتەکان</SelectItem>
                {uniqueMarkets.map(market => (
                  <SelectItem key={market.id} value={market.id}>
                    {market.name} ({market.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                سڕینەوەی فلتەرەکان
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {visits.filter(v => v.status === "pending").length}
                  </p>
                  <p className="text-xs text-muted-foreground">چاوەڕوان</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {visits.filter(v => v.status === "reviewed").length}
                  </p>
                  <p className="text-xs text-muted-foreground">بینراوە</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {visits.filter(v => v.status === "resolved").length}
                  </p>
                  <p className="text-xs text-muted-foreground">چارەسەرکرا</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visits Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredVisits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                هیچ سەردانێک نییە
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>بەروار</TableHead>
                      <TableHead>مەندوب</TableHead>
                      <TableHead>ماڕکێت</TableHead>
                      <TableHead>دۆخ</TableHead>
                      <TableHead>کردار</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(visit.visit_date), 'yyyy/MM/dd')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {visit.delivery_person?.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{visit.market?.name}</p>
                              <p className="text-xs text-muted-foreground">{visit.market?.code}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(visit.status)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(visit.id)}
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            بینین
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visit Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              زانیاری سەردان
            </DialogTitle>
          </DialogHeader>
          
          {selectedVisit && (
            <div className="space-y-6">
              {/* Visit Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">مەندوب</p>
                  <p className="font-medium">{selectedVisit.delivery_person?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ماڕکێت</p>
                  <p className="font-medium">{selectedVisit.market?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedVisit.market?.code}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">بەروار</p>
                  <p className="font-medium">
                    {format(new Date(selectedVisit.visit_date), 'yyyy/MM/dd - HH:mm')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">دۆخ</p>
                  {getStatusBadge(selectedVisit.status)}
                </div>
              </div>

              {selectedVisit.notes && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">تێبینی مەندوب</p>
                  <p className="p-3 rounded-lg bg-muted/30">{selectedVisit.notes}</p>
                </div>
              )}

              {/* Visit Items */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  مادە ڕاپۆرتکراوەکان
                </h3>
                
                {visitItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    هیچ مادەیەک ڕاپۆرت نەکراوە
                  </p>
                ) : (
                  <div className="space-y-3">
                    {visitItems.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{item.item?.name}</p>
                                {getIssueTypeBadge(item.issue_type)}
                              </div>
                              <div className="flex gap-4 text-sm text-muted-foreground">
                                <span>بارکۆد: {item.item?.barcode}</span>
                                <span>ژمارە: {item.quantity}</span>
                              </div>
                              {item.action_taken && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                    {item.action_taken === "removed" ? "لابرا" :
                                     item.action_taken === "renewed" ? "نوێکرایەوە" : item.action_taken}
                                  </Badge>
                                </div>
                              )}
                              {item.admin_notes && (
                                <p className="text-sm text-muted-foreground">
                                  تێبینی: {item.admin_notes}
                                </p>
                              )}
                            </div>
                            
                            {!item.action_taken && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedItemId(item.id)}
                              >
                                چارەسەر
                              </Button>
                            )}
                          </div>
                          
                          {/* Action Form */}
                          {selectedItemId === item.id && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              <div className="space-y-2">
                                <Label>کردار</Label>
                                <Select value={actionTaken} onValueChange={setActionTaken}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="کردارێک هەڵبژێرە" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="removed">لابردن</SelectItem>
                                    <SelectItem value="renewed">نوێکردنەوە</SelectItem>
                                    <SelectItem value="pending">چاوەڕوان</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>تێبینی</Label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="تێبینی..."
                                  rows={2}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleUpdateItem}
                                  disabled={!actionTaken || updateVisitItem.isPending}
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
              <div className="flex gap-2 pt-4 border-t">
                {selectedVisit.status === "pending" && (
                  <Button
                    variant="secondary"
                    onClick={() => handleUpdateStatus("reviewed")}
                    disabled={updateVisitStatus.isPending}
                  >
                    <Eye className="h-4 w-4 ml-1" />
                    نیشانکردن وەک بینراو
                  </Button>
                )}
                {selectedVisit.status !== "resolved" && (
                  <Button
                    onClick={() => handleUpdateStatus("resolved")}
                    disabled={updateVisitStatus.isPending}
                  >
                    <CheckCircle className="h-4 w-4 ml-1" />
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
