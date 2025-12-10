import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Phone,
  MapPin,
  Building,
  Loader2,
  Pencil,
  Save,
  CheckCircle,
  ArrowLeft,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useMarkets, useUpdateMarket, Market } from "@/hooks/useMarkets";
import { Link } from "react-router-dom";

type MissingField = "phone" | "address" | "city" | "zone" | "trader_category";

interface MarketWithMissing extends Market {
  missingFields: MissingField[];
}

const fieldLabels: Record<MissingField, string> = {
  phone: "مۆبایل",
  address: "ناونیشان",
  city: "شار",
  zone: "ناوچە",
  trader_category: "جۆر",
};

const fieldIcons: Record<MissingField, React.ElementType> = {
  phone: Phone,
  address: MapPin,
  city: Building,
  zone: MapPin,
  trader_category: Building,
};

export default function IncompleteMarkets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MissingField | "all">("all");
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    trader_category: "",
    phone: "",
    address: "",
    city: "",
    zone: "",
  });

  const { data: markets = [], isLoading } = useMarkets();
  const updateMarket = useUpdateMarket();

  // Find markets with missing information
  const incompleteMarkets = useMemo((): MarketWithMissing[] => {
    return markets
      .map((market) => {
        const missingFields: MissingField[] = [];
        if (!market.phone?.trim()) missingFields.push("phone");
        if (!market.address?.trim()) missingFields.push("address");
        if (!market.city?.trim()) missingFields.push("city");
        if (!market.zone?.trim()) missingFields.push("zone");
        if (!market.trader_category?.trim()) missingFields.push("trader_category");
        return { ...market, missingFields };
      })
      .filter((m) => m.missingFields.length > 0);
  }, [markets]);

  // Filter by search and tab
  const filteredMarkets = useMemo(() => {
    let filtered = incompleteMarkets;

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((m) => m.missingFields.includes(activeTab));
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.code.toLowerCase().includes(query) ||
          m.phone?.includes(query) ||
          m.city?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [incompleteMarkets, activeTab, searchQuery]);

  // Count markets missing each field
  const missingCounts = useMemo(() => {
    return {
      phone: incompleteMarkets.filter((m) => m.missingFields.includes("phone")).length,
      address: incompleteMarkets.filter((m) => m.missingFields.includes("address")).length,
      city: incompleteMarkets.filter((m) => m.missingFields.includes("city")).length,
      zone: incompleteMarkets.filter((m) => m.missingFields.includes("zone")).length,
      trader_category: incompleteMarkets.filter((m) => m.missingFields.includes("trader_category")).length,
    };
  }, [incompleteMarkets]);

  const openEditDialog = (market: Market) => {
    setEditingMarket(market);
    setFormData({
      code: market.code,
      name: market.name,
      trader_category: market.trader_category || "",
      phone: market.phone || "",
      address: market.address || "",
      city: market.city || "",
      zone: market.zone || "",
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingMarket) return;

    try {
      await updateMarket.mutateAsync({
        id: editingMarket.id,
        code: formData.code.trim(),
        name: formData.name.trim(),
        trader_category: formData.trader_category.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        zone: formData.zone.trim() || null,
      });
      setEditDialogOpen(false);
      setEditingMarket(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const renderMissingBadges = (missingFields: MissingField[]) => (
    <div className="flex flex-wrap gap-1">
      {missingFields.map((field) => {
        const Icon = fieldIcons[field];
        return (
          <Badge
            key={field}
            variant="destructive"
            className="text-[10px] gap-1 py-0.5"
          >
            <Icon className="h-3 w-3" />
            {fieldLabels[field]}
          </Badge>
        );
      })}
    </div>
  );

  // Mobile card view
  const renderMobileCard = (market: MarketWithMissing) => (
    <div
      key={market.id}
      className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 mb-3"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{market.name}</p>
          <p className="text-xs text-muted-foreground">کۆد: {market.code}</p>
        </div>
        <Button
          size="sm"
          onClick={() => openEditDialog(market)}
          className="shrink-0 gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          چاککردن
        </Button>
      </div>

      <div className="mb-3">
        <p className="text-xs text-muted-foreground mb-1.5">زانیاری نەتەواو:</p>
        {renderMissingBadges(market.missingFields)}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">مۆبایل: </span>
          <span className={market.phone ? "" : "text-destructive"}>{market.phone || "نییە"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">شار: </span>
          <span className={market.city ? "" : "text-destructive"}>{market.city || "نییە"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">ناوچە: </span>
          <span className={market.zone ? "" : "text-destructive"}>{market.zone || "نییە"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">جۆر: </span>
          <span className={market.trader_category ? "" : "text-destructive"}>
            {market.trader_category || "نییە"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-destructive/10 p-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  ماڕکێتە نەتەواوەکان
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {incompleteMarkets.length} ماڕکێت زانیاری نەتەواویان هەیە
                </p>
              </div>
            </div>

            <Link to="/markets">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                گەڕانەوە بۆ ماڕکێتەکان
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-slide-up">
          <div
            className={`rounded-xl border p-3 cursor-pointer transition-all ${
              activeTab === "all"
                ? "bg-primary/10 border-primary/30"
                : "bg-card border-border hover:bg-muted/50"
            }`}
            onClick={() => setActiveTab("all")}
          >
            <p className="text-xl font-bold text-foreground">{incompleteMarkets.length}</p>
            <p className="text-xs text-muted-foreground">کۆی گشتی</p>
          </div>
          {(Object.keys(fieldLabels) as MissingField[]).map((field) => {
            const Icon = fieldIcons[field];
            const isActive = activeTab === field;
            return (
              <div
                key={field}
                className={`rounded-xl border p-3 cursor-pointer transition-all ${
                  isActive
                    ? "bg-destructive/10 border-destructive/30"
                    : "bg-card border-border hover:bg-muted/50"
                }`}
                onClick={() => setActiveTab(field)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-destructive" />
                  <p className="text-xl font-bold text-destructive">{missingCounts[field]}</p>
                </div>
                <p className="text-xs text-muted-foreground">بێ {fieldLabels[field]}</p>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card animate-slide-up">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="گەڕان بە ناو، کۆد، مۆبایل یان شار..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-border bg-card shadow-card animate-slide-up overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : incompleteMarkets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-16 w-16 text-success mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                هەموو ماڕکێتەکان تەواون!
              </h3>
              <p className="text-muted-foreground">
                هیچ ماڕکێتێک زانیاری نەتەواوی نییە
              </p>
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
              <p>هیچ ماڕکێتێک نەدۆزرایەوە</p>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="md:hidden p-4">
                <ScrollArea className="h-[60vh]">
                  {filteredMarkets.map(renderMobileCard)}
                </ScrollArea>
              </div>

              {/* Desktop View */}
              <div className="hidden md:block">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right w-[80px]">کۆد</TableHead>
                        <TableHead className="text-right">ناو</TableHead>
                        <TableHead className="text-right">زانیاری نەتەواو</TableHead>
                        <TableHead className="text-right">مۆبایل</TableHead>
                        <TableHead className="text-right">شار</TableHead>
                        <TableHead className="text-right">ناوچە</TableHead>
                        <TableHead className="text-right w-[100px]">کردار</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMarkets.map((market) => (
                        <TableRow key={market.id} className="bg-destructive/5">
                          <TableCell className="font-mono text-sm">{market.code}</TableCell>
                          <TableCell className="font-medium">{market.name}</TableCell>
                          <TableCell>{renderMissingBadges(market.missingFields)}</TableCell>
                          <TableCell
                            className={`font-mono text-sm ${
                              !market.phone ? "text-destructive" : ""
                            }`}
                            dir="ltr"
                          >
                            {market.phone || "نییە"}
                          </TableCell>
                          <TableCell className={!market.city ? "text-destructive" : ""}>
                            {market.city || "نییە"}
                          </TableCell>
                          <TableCell className={!market.zone ? "text-destructive" : ""}>
                            {market.zone || "نییە"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => openEditDialog(market)}
                              className="gap-1.5"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              چاککردن
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              چاککردنی زانیاری ماڕکێت
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>کۆد</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>ناو</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                جۆر
                {!formData.trader_category && (
                  <Badge variant="destructive" className="text-[10px]">نەتەواو</Badge>
                )}
              </Label>
              <Input
                value={formData.trader_category}
                onChange={(e) => setFormData({ ...formData, trader_category: e.target.value })}
                placeholder="ماڕکێت، فرۆشکا، جملة..."
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                مۆبایل
                {!formData.phone && (
                  <Badge variant="destructive" className="text-[10px]">نەتەواو</Badge>
                )}
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="07xxxxxxxx"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                ناونیشان
                {!formData.address && (
                  <Badge variant="destructive" className="text-[10px]">نەتەواو</Badge>
                )}
              </Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="ناونیشانی تەواو"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  شار
                  {!formData.city && (
                    <Badge variant="destructive" className="text-[10px]">نەتەواو</Badge>
                  )}
                </Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="سلێمانی"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  ناوچە
                  {!formData.zone && (
                    <Badge variant="destructive" className="text-[10px]">نەتەواو</Badge>
                  )}
                </Label>
                <Input
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="بازار"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              پاشگەزبوونەوە
            </Button>
            <Button onClick={handleSave} disabled={updateMarket.isPending} className="gap-2">
              {updateMarket.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              پاشەکەوتکردن
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
