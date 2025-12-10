import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Store,
  Plus,
  Search,
  Pencil,
  Trash2,
  Phone,
  MapPin,
  Building,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useMarkets, useAddMarket, useUpdateMarket, useDeleteMarket, useDeleteAllMarkets, Market } from "@/hooks/useMarkets";
import { useUserRoles } from "@/hooks/useUserRoles";

export default function Markets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  
  // Form state
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
  const { isAdmin } = useUserRoles();
  const addMarket = useAddMarket();
  const updateMarket = useUpdateMarket();
  const deleteMarket = useDeleteMarket();
  const deleteAllMarkets = useDeleteAllMarkets();

  const handleDeleteAll = async () => {
    try {
      await deleteAllMarkets.mutateAsync();
      setDeleteAllDialogOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const filteredMarkets = markets.filter((market) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    return (
      market.name.toLowerCase().includes(query) ||
      market.code.toLowerCase().includes(query) ||
      (market.phone && market.phone.includes(query)) ||
      (market.city && market.city.toLowerCase().includes(query)) ||
      (market.zone && market.zone.toLowerCase().includes(query)) ||
      (market.trader_category && market.trader_category.toLowerCase().includes(query)) ||
      (market.address && market.address.toLowerCase().includes(query))
    );
  });

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      trader_category: "",
      phone: "",
      address: "",
      city: "",
      zone: "",
    });
  };

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("ناو و کۆد پێویستن");
      return;
    }

    try {
      await addMarket.mutateAsync({
        code: formData.code.trim(),
        name: formData.name.trim(),
        trader_category: formData.trader_category.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        zone: formData.zone.trim() || undefined,
      });
      toast.success("ماڕکێت زیادکرا");
      setAddDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleEdit = async () => {
    if (!selectedMarket || !formData.name.trim() || !formData.code.trim()) {
      toast.error("ناو و کۆد پێویستن");
      return;
    }

    try {
      await updateMarket.mutateAsync({
        id: selectedMarket.id,
        code: formData.code.trim(),
        name: formData.name.trim(),
        trader_category: formData.trader_category.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        zone: formData.zone.trim() || null,
      });
      setEditDialogOpen(false);
      setSelectedMarket(null);
      resetForm();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDelete = async () => {
    if (!selectedMarket) return;

    try {
      await deleteMarket.mutateAsync(selectedMarket.id);
      setDeleteDialogOpen(false);
      setSelectedMarket(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const openEditDialog = (market: Market) => {
    setSelectedMarket(market);
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

  const openDeleteDialog = (market: Market) => {
    setSelectedMarket(market);
    setDeleteDialogOpen(true);
  };

  // Get unique categories and zones for stats
  const categories = [...new Set(markets.map((m) => m.trader_category).filter(Boolean))];
  const zones = [...new Set(markets.map((m) => m.zone).filter(Boolean))];
  
  // Count incomplete markets
  const incompleteCount = useMemo(() => {
    return markets.filter((m) => 
      !m.phone?.trim() || !m.address?.trim() || !m.city?.trim() || !m.zone?.trim() || !m.trader_category?.trim()
    ).length;
  }, [markets]);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">ماڕکێتەکان</h1>
                <p className="mt-1 text-muted-foreground">
                  بەڕێوەبردنی زانیاری ماڕکێت و کڕیارەکان
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {isAdmin && markets.length > 0 && (
                <Button 
                  variant="destructive" 
                  className="gap-2"
                  onClick={() => setDeleteAllDialogOpen(true)}
                >
                  <Trash2 className="h-5 w-5" />
                  سڕینەوەی هەموو
                </Button>
              )}
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-5 w-5" />
                    زیادکردنی ماڕکێت
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>زیادکردنی ماڕکێتی نوێ</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>کۆد <span className="text-destructive">*</span></Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="کۆدی ماڕکێت"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>جۆر</Label>
                      <Input
                        value={formData.trader_category}
                        onChange={(e) => setFormData({ ...formData, trader_category: e.target.value })}
                        placeholder="ماڕکێت، فرۆشکا..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>ناو <span className="text-destructive">*</span></Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="ناوی ماڕکێت"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>مۆبایل</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="07xxxxxxxx"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ناونیشان</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="ناونیشانی تەواو"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>شار</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="سلێمانی"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ناوچە</Label>
                      <Input
                        value={formData.zone}
                        onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                        placeholder="بازار"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>
                    پاشگەزبوونەوە
                  </Button>
                  <Button onClick={handleAdd} disabled={addMarket.isPending}>
                    {addMarket.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    زیادکردن
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-slide-up">
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{markets.length}</p>
                <p className="text-sm text-muted-foreground">کۆی ماڕکێتەکان</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <Building className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{categories.length}</p>
                <p className="text-sm text-muted-foreground">جۆرەکان</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <MapPin className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{zones.length}</p>
                <p className="text-sm text-muted-foreground">ناوچەکان</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-info/10 p-2">
                <Phone className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {markets.filter((m) => m.phone).length}
                </p>
                <p className="text-sm text-muted-foreground">بە مۆبایل</p>
              </div>
            </div>
          </div>
          {/* Incomplete Markets Card - Clickable */}
          <Link to="/incomplete-markets">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 shadow-card hover:bg-destructive/10 transition-colors cursor-pointer h-full">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{incompleteCount}</p>
                  <p className="text-sm text-muted-foreground">نەتەواو</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Search */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card animate-slide-up">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="گەڕان بە ناو، کۆد، مۆبایل، شار یان ناوچە..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card shadow-card animate-slide-up overflow-hidden">
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredMarkets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Store className="h-12 w-12 mb-4 opacity-50" />
                <p>هیچ ماڕکێتێک نەدۆزرایەوە</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right w-[80px]">کۆد</TableHead>
                    <TableHead className="text-right">ناو</TableHead>
                    <TableHead className="text-right hidden md:table-cell">جۆر</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">مۆبایل</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">شار</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">ناوچە</TableHead>
                    <TableHead className="text-right w-[100px]">کردارەکان</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMarkets.map((market) => (
                    <TableRow key={market.id}>
                      <TableCell className="font-mono text-sm">{market.code}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{market.name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px] md:hidden">
                            {market.trader_category}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {market.trader_category && (
                          <Badge variant="secondary">{market.trader_category}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell font-mono text-sm" dir="ltr">
                        {market.phone || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{market.city || "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{market.zone || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(market)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(market)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>دەستکاریکردنی ماڕکێت</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>کۆد <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="کۆدی ماڕکێت"
                />
              </div>
              <div className="space-y-2">
                <Label>جۆر</Label>
                <Input
                  value={formData.trader_category}
                  onChange={(e) => setFormData({ ...formData, trader_category: e.target.value })}
                  placeholder="ماڕکێت، فرۆشکا..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ناو <span className="text-destructive">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ناوی ماڕکێت"
              />
            </div>
            <div className="space-y-2">
              <Label>مۆبایل</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="07xxxxxxxx"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>ناونیشان</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="ناونیشانی تەواو"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>شار</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="سلێمانی"
                />
              </div>
              <div className="space-y-2">
                <Label>ناوچە</Label>
                <Input
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="بازار"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedMarket(null); resetForm(); }}>
              پاشگەزبوونەوە
            </Button>
            <Button onClick={handleEdit} disabled={updateMarket.isPending}>
              {updateMarket.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              پاشەکەوتکردن
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>سڕینەوەی ماڕکێت</AlertDialogTitle>
            <AlertDialogDescription>
              ئایا دڵنیایت لە سڕینەوەی "{selectedMarket?.name}"؟ ئەم کردارە ناگەڕێتەوە.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMarket.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              سڕینەوە
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>سڕینەوەی هەموو ماڕکێتەکان</AlertDialogTitle>
            <AlertDialogDescription>
              ئایا دڵنیایت لە سڕینەوەی هەموو {markets.length} ماڕکێت؟ ئەم کردارە ناگەڕێتەوە.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAllMarkets.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              سڕینەوەی هەموو
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
