import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useItems, useCategories, useBrands, useStockMovements, useAddStockMovement, useUpdateItem } from "@/hooks/useItems";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, Clock, Search, Loader2, ScanBarcode, Save, Edit, MoreVertical, ImageIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BarcodeScannerDialog } from "@/components/barcode/BarcodeScannerDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemImageUpload } from "@/components/items/ItemImageUpload";

export default function StockAdjust() {
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scannerOpen, setScannerOpen] = useState(false);

  // Edit item fields
  const [editName, setEditName] = useState<string>('');
  const [editBarcode, setEditBarcode] = useState<string>('');
  const [editBrandId, setEditBrandId] = useState<string>('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editUnit, setEditUnit] = useState<string>('');
  const [editMinStock, setEditMinStock] = useState<string>('');
  const [editMfgDate, setEditMfgDate] = useState<string>('');
  const [editExpDate, setEditExpDate] = useState<string>('');
  const [editRemindDate, setEditRemindDate] = useState<string>('');
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editBoxPrice, setEditBoxPrice] = useState<string>('');
  const [editPiecePrice, setEditPiecePrice] = useState<string>('');
  const [editPricePerKg, setEditPricePerKg] = useState<string>('');

  const { user } = useAuth();
  const { data: items } = useItems();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: movements, isLoading: movementsLoading } = useStockMovements();
  const addMovement = useAddStockMovement();
  const updateItem = useUpdateItem();

  const filteredItems = items?.filter(item => 
    item.name.includes(searchQuery) || item.barcode.includes(searchQuery)
  ) || [];

  const selectedItemData = items?.find(item => item.id === selectedItem);
  const adjustMovements = movements?.filter(m => m.movement_type === 'ADJUST').slice(0, 5) || [];

  // Populate edit fields when item is selected
  useEffect(() => {
    if (selectedItemData) {
      setEditName(selectedItemData.name);
      setEditBarcode(selectedItemData.barcode);
      setEditBrandId(selectedItemData.brand_id || '');
      setEditCategoryId(selectedItemData.category_id || '');
      setEditUnit(selectedItemData.unit);
      setEditMinStock(selectedItemData.min_stock.toString());
      setEditMfgDate(selectedItemData.mfg_date || '');
      setEditExpDate(selectedItemData.exp_date || '');
      setEditRemindDate(selectedItemData.remind_date || '');
      setEditImageUrl(selectedItemData.image_url || null);
      setEditBoxPrice(selectedItemData.box_price?.toString() || '');
      setEditPiecePrice(selectedItemData.piece_price?.toString() || '');
      setEditPricePerKg(selectedItemData.price_per_kg?.toString() || '');
      setQuantity(selectedItemData.current_quantity.toString());
    } else {
      setEditName('');
      setEditBarcode('');
      setEditBrandId('');
      setEditCategoryId('');
      setEditUnit('');
      setEditMinStock('');
      setEditMfgDate('');
      setEditExpDate('');
      setEditRemindDate('');
      setEditImageUrl(null);
      setEditBoxPrice('');
      setEditPiecePrice('');
      setEditPricePerKg('');
      setQuantity('');
    }
  }, [selectedItemData]);

  const handleBarcodeScan = (barcode: string) => {
    const foundItem = items?.find(item => item.barcode === barcode);
    if (foundItem) {
      setSelectedItem(foundItem.id);
      setSearchQuery(foundItem.name);
      toast.success(`مادەی "${foundItem.name}" هەڵبژێردرا`);
    } else {
      toast.error('مادە بە ئەم باڕکۆدە نەدۆزرایەوە');
    }
  };

  const handleSubmitQuantity = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem || quantity === '' || parseInt(quantity) < 0) {
      toast.error('تکایە زانیارییەکان بە تەواوی پڕبکەرەوە');
      return;
    }

    addMovement.mutate({
      item_id: selectedItem,
      movement_type: 'ADJUST',
      quantity: parseInt(quantity),
      movement_date: date,
      note: note || undefined,
      created_by: user?.id,
    }, {
      onSuccess: () => {
        setNote('');
      },
    });
  };

  const handleSubmitItemEdit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem || !editName.trim() || !editBarcode.trim()) {
      toast.error('تکایە ناو و باڕکۆد پڕبکەرەوە');
      return;
    }

    updateItem.mutate({
      id: selectedItem,
      name: editName.trim(),
      barcode: editBarcode.trim(),
      brand_id: editBrandId || null,
      category_id: editCategoryId || null,
      unit: editUnit || 'دانە',
      min_stock: parseInt(editMinStock) || 10,
      mfg_date: editMfgDate || null,
      exp_date: editExpDate || null,
      remind_date: editRemindDate || null,
      image_url: editImageUrl || null,
      box_price: editBoxPrice ? parseFloat(editBoxPrice) : null,
      piece_price: editPiecePrice ? parseFloat(editPiecePrice) : null,
      price_per_kg: editPricePerKg ? parseFloat(editPricePerKg) : null,
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-warning/10 p-3">
              <RefreshCw className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">ڕاستکردنەوە</h1>
              <p className="mt-1 text-muted-foreground">
                چاککردنی ژمارە و زانیارییەکانی مادە
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Form */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-slide-up">
            {/* Search Section */}
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">گەڕان بۆ مادە</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="گەڕان بە ناو یان باڕکۆد..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setScannerOpen(true)}
                    className="shrink-0"
                  >
                    <ScanBarcode className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">مادە</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="مادەیەک هەڵبژێرە" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[60vh]">
                    {filteredItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground">ستۆک: {item.current_quantity} {item.unit}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedItemData ? (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info" className="gap-2">
                    <Edit className="h-4 w-4" />
                    زانیاری مادە
                  </TabsTrigger>
                  <TabsTrigger value="quantity" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    ڕاستکردنەوەی ژمارە
                  </TabsTrigger>
                </TabsList>

                {/* Edit Item Info Tab */}
                <TabsContent value="info" className="mt-4">
                  <form onSubmit={handleSubmitItemEdit} className="space-y-4">
                    {/* Image Upload */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        وێنەی مادە
                      </Label>
                      <ItemImageUpload
                        currentImageUrl={editImageUrl}
                        onImageUploaded={setEditImageUrl}
                        onImageRemoved={() => setEditImageUrl(null)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">ناو *</Label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="ناوی مادە"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">باڕکۆد *</Label>
                        <Input
                          value={editBarcode}
                          onChange={(e) => setEditBarcode(e.target.value)}
                          placeholder="باڕکۆدی مادە"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">براند</Label>
                        <Select value={editBrandId || "none"} onValueChange={(val) => setEditBrandId(val === "none" ? "" : val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="براند هەڵبژێرە" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- بێ براند --</SelectItem>
                            {brands?.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">هاوپۆل</Label>
                        <Select value={editCategoryId || "none"} onValueChange={(val) => setEditCategoryId(val === "none" ? "" : val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="هاوپۆل هەڵبژێرە" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- بێ هاوپۆل --</SelectItem>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">یەکە</Label>
                        <Input
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          placeholder="دانە، کیلۆگرام، لیتر..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">کەمترین ستۆک</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editMinStock}
                          onChange={(e) => setEditMinStock(e.target.value)}
                          placeholder="10"
                        />
                      </div>
                    </div>

                    {/* Pricing Fields */}
                    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                      <Label className="text-sm font-semibold text-foreground">نرخەکان (دینار)</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">نرخی بۆکس</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editBoxPrice}
                            onChange={(e) => setEditBoxPrice(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">نرخی دانە</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editPiecePrice}
                            onChange={(e) => setEditPiecePrice(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">نرخی کیلۆ</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editPricePerKg}
                            onChange={(e) => setEditPricePerKg(e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">بەرواری بەرهەمهێنان</Label>
                        <Input
                          type="date"
                          value={editMfgDate}
                          onChange={(e) => setEditMfgDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">بەرواری بەسەرچوون</Label>
                        <Input
                          type="date"
                          value={editExpDate}
                          onChange={(e) => setEditExpDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">بەرواری بیرخستنەوە</Label>
                        <Input
                          type="date"
                          value={editRemindDate}
                          onChange={(e) => setEditRemindDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full gap-2" 
                      disabled={updateItem.isPending}
                    >
                      {updateItem.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Save className="h-5 w-5" />
                      )}
                      پاشەکەوتکردنی گۆڕانکارییەکان
                    </Button>
                  </form>
                </TabsContent>

                {/* Quantity Adjust Tab */}
                <TabsContent value="quantity" className="mt-4">
                  <form onSubmit={handleSubmitQuantity} className="space-y-4">
                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">ناو:</span>
                          <span className="mr-2 font-medium">{selectedItemData.name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">براند:</span>
                          <span className="mr-2 font-medium">{selectedItemData.brands?.name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ستۆکی ئێستا:</span>
                          <span className="mr-2 font-semibold text-primary">{selectedItemData.current_quantity}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">یەکە:</span>
                          <span className="mr-2 font-medium">{selectedItemData.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">ژمارەی ڕاست</Label>
                      <Input
                        type="number"
                        min="0"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="ژمارەی ڕاستی مادە"
                      />
                      {quantity !== '' && (
                        <p className="text-sm text-muted-foreground">
                          جیاوازی: {parseInt(quantity) - selectedItemData.current_quantity >= 0 ? '+' : ''}{parseInt(quantity) - selectedItemData.current_quantity}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">بەروار</Label>
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">هۆکار</Label>
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="نمونە: هەڵەی ژماردن، بەسەرچوون..."
                        rows={3}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full gap-2 bg-warning hover:bg-warning/90 text-warning-foreground" 
                      disabled={addMovement.isPending}
                    >
                      {addMovement.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-5 w-5" />
                      )}
                      ڕاستکردنەوەی ستۆک
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>مادەیەک هەڵبژێرە بۆ دیتنی زانیاریەکان و گۆڕانکاری</p>
              </div>
            )}
          </div>

          {/* Recent Adjustments */}
          <div className="rounded-xl border border-border bg-card shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 border-b border-border px-6 py-4">
              <div className="rounded-lg bg-warning/10 p-2">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <h3 className="font-semibold text-card-foreground">کۆتا ڕاستکردنەوەکان</h3>
            </div>
            {movementsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">مادە</TableHead>
                    <TableHead className="text-center">ژمارەی نوێ</TableHead>
                    <TableHead className="text-center">بەروار</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                        هیچ ڕیکۆردێک نییە
                      </TableCell>
                    </TableRow>
                  ) : (
                    adjustMovements.map((movement, index) => (
                      <TableRow key={movement.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                        <TableCell className="font-medium">
                          {(movement.items as any)?.name || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-warning/10 text-warning border-warning/20">
                            {movement.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground text-sm">
                          {movement.movement_date}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <BarcodeScannerDialog
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScan={handleBarcodeScan}
        />
      </div>
    </Layout>
  );
}
