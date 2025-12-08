import { useState } from "react";
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
import { useItems, useStockMovements, useAddStockMovement, ItemWithRelations } from "@/hooks/useItems";
import { useCreateInvoice, useInvoices, useInvoiceWithItems, useDeleteInvoice, Invoice } from "@/hooks/useInvoices";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { ArrowUpFromLine, Clock, Search, Loader2, ScanBarcode, FileText, Plus, Trash2, ShoppingCart, Pencil, Eye, MoreVertical } from "lucide-react";
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
import { ItemDetailCard } from "@/components/items/ItemDetailCard";
import { StockOutInvoiceDialog } from "@/components/invoice/StockOutInvoiceDialog";
import { EditCartItemDialog } from "@/components/stock/EditCartItemDialog";
import { EditInvoiceDialog } from "@/components/invoice/EditInvoiceDialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CartItem {
  item: ItemWithRelations;
  quantity: number;
  boxCount?: number;
  pieceCount?: number;
  giftQuantity?: number;
  price: number;
  note?: string;
}

export default function StockOut() {
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [boxCount, setBoxCount] = useState<string>('');
  const [pieceCount, setPieceCount] = useState<string>('');
  const [giftQuantity, setGiftQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Invoice management
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [viewInvoiceOpen, setViewInvoiceOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  
  // Cart system
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');

  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const { data: items, refetch: refetchItems } = useItems();
  const { data: movements, isLoading: movementsLoading } = useStockMovements();
  const { data: recentInvoices, isLoading: invoicesLoading } = useInvoices('stock_out');
  const { data: selectedInvoice } = useInvoiceWithItems(selectedInvoiceId);
  const addMovement = useAddStockMovement();
  const deleteInvoice = useDeleteInvoice();
  const createInvoice = useCreateInvoice();

  const filteredItems = items?.filter(item => 
    item.name.includes(searchQuery) || item.barcode.includes(searchQuery)
  ) || [];

  const selectedItemData = items?.find(item => item.id === selectedItem);
  const outMovements = movements?.filter(m => m.movement_type === 'OUT').slice(0, 5) || [];

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

  const handleAddToCart = () => {
    const boxQty = parseInt(boxCount) || 0;
    const pieceQty = parseInt(pieceCount) || 0;
    const giftQty = parseInt(giftQuantity) || 0;
    // Gift is NOT counted in total quantity for stock deduction - only box + pieces
    const totalQuantity = boxQty + pieceQty;
    const totalWithGift = boxQty + pieceQty + giftQty;

    if (!selectedItem || totalWithGift <= 0) {
      toast.error('تکایە مادە هەڵبژێرە و ژمارە داخڵ بکە');
      return;
    }

    if (!price || parseFloat(price) < 0) {
      toast.error('تکایە نرخ داخڵ بکە');
      return;
    }

    if (!selectedItemData) {
      toast.error('مادە نەدۆزرایەوە');
      return;
    }

    // Check if already in cart
    const existingIndex = cartItems.findIndex(ci => ci.item.id === selectedItem);
    const currentCartQty = existingIndex >= 0 ? cartItems[existingIndex].quantity : 0;

    if (totalWithGift + currentCartQty > selectedItemData.current_quantity) {
      toast.error(`ژمارەی داواکراو زیاترە لەوەی هەیە (${selectedItemData.current_quantity - currentCartQty} ماوە)`);
      return;
    }

    if (existingIndex >= 0) {
      // Update existing item in cart
      const updated = [...cartItems];
      updated[existingIndex].quantity += totalWithGift;
      updated[existingIndex].boxCount = (updated[existingIndex].boxCount || 0) + boxQty;
      updated[existingIndex].pieceCount = (updated[existingIndex].pieceCount || 0) + pieceQty;
      updated[existingIndex].giftQuantity = (updated[existingIndex].giftQuantity || 0) + giftQty;
      updated[existingIndex].price = parseFloat(price);
      if (note) updated[existingIndex].note = note;
      setCartItems(updated);
      toast.success('بڕ زیادکرا بۆ مادەی هەبوو لە سەبەتە');
    } else {
      // Add new item to cart
      setCartItems([...cartItems, {
        item: selectedItemData,
        quantity: totalWithGift,
        boxCount: boxQty || undefined,
        pieceCount: pieceQty || undefined,
        giftQuantity: giftQty || undefined,
        price: parseFloat(price),
        note: note || undefined,
      }]);
      toast.success('مادە زیادکرا بۆ سەبەتە');
    }

    // Reset form
    setSelectedItem('');
    setBoxCount('');
    setPieceCount('');
    setGiftQuantity('');
    setPrice('');
    setNote('');
    setSearchQuery('');
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
    toast.success('مادە لابرا لە سەبەتە');
  };

  const handleEditCartItem = (index: number) => {
    setEditingItem(cartItems[index]);
    setEditingIndex(index);
  };

  const handleSaveEditedItem = (updatedItem: CartItem) => {
    if (editingIndex === null) return;
    
    const updated = [...cartItems];
    updated[editingIndex] = updatedItem;
    setCartItems(updated);
    setEditingItem(null);
    setEditingIndex(null);
    toast.success('مادە نوێکرایەوە');
  };

  const handleSubmitAll = async () => {
    if (cartItems.length === 0) {
      toast.error('تکایە مادە زیاد بکە بۆ سەبەتە');
      return;
    }

    if (!recipientName.trim()) {
      toast.error('تکایە ناوی کۆمپانیا/دوکان داخڵ بکە');
      return;
    }

    // Process all items
    let successCount = 0;
    for (const cartItem of cartItems) {
      try {
        await addMovement.mutateAsync({
          item_id: cartItem.item.id,
          movement_type: 'OUT',
          quantity: cartItem.quantity,
          price: cartItem.price,
          movement_date: date,
          note: cartItem.note || `بۆ: ${recipientName}`,
          created_by: user?.id,
        });
        successCount++;
      } catch (error) {
        toast.error(`هەڵە لە دەرکردنی ${cartItem.item.name}`);
      }
    }

    if (successCount === cartItems.length) {
      // Calculate totals
      const totalPrice = cartItems.reduce((sum, ci) => sum + (((ci.boxCount || 0) + (ci.pieceCount || 0)) * ci.price), 0);
      
      // Save invoice to database
      const invoiceNumber = `OUT-${Date.now().toString(36).toUpperCase()}`;
      
      await createInvoice.mutateAsync({
        invoice_number: invoiceNumber,
        invoice_type: 'stock_out',
        recipient_name: recipientName,
        recipient_phone: recipientPhone || undefined,
        total_amount: totalPrice,
        invoice_date: date,
        created_by: user?.id,
        items: cartItems.map(ci => ({
          item_id: ci.item.id,
          item_name: ci.item.name,
          item_brand: ci.item.brands?.name || null,
          item_category: ci.item.categories?.name || null,
          item_barcode: ci.item.barcode,
          item_unit: ci.item.unit,
          quantity: ci.quantity,
          boxes: ci.boxCount || 0,
          pieces: ci.pieceCount || 0,
          gifts: ci.giftQuantity || 0,
          weight_kg: 0,
          weight_gram: 0,
          price: ci.price,
          total_price: ((ci.boxCount || 0) + (ci.pieceCount || 0)) * ci.price,
          exp_date: ci.item.exp_date || null,
          mfg_date: ci.item.mfg_date || null,
          note: ci.note || null,
        })),
      });
      
      toast.success(`${successCount} مادە بە سەرکەوتوویی دەرکران`);
      // Open invoice dialog
      setInvoiceOpen(true);
    }
  };

  const handleInvoiceClosed = () => {
    setInvoiceOpen(false);
    // Reset everything after invoice is closed
    setCartItems([]);
    setRecipientName('');
    setRecipientPhone('');
    setDriverName('');
    setDriverPhone('');
    refetchItems();
  };

  const totalCartItems = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-destructive/10 p-3">
              <ArrowUpFromLine className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">دەرکردن لە کۆگا</h1>
              <p className="mt-1 text-muted-foreground">
                کەمکردنەوەی مادە لە ستۆک (فرۆشتن/بەخشین)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Form */}
          <div className="space-y-6">
            {/* Recipient Info Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-slide-up">
              <h2 className="mb-4 text-lg font-semibold text-card-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                زانیاری وەرگر
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ناوی کۆمپانیا / دوکان <span className="text-destructive">*</span></Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="نمونە: کۆمپانیای ئاشتی"
                    className="bg-background"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ژمارەی مۆبایل</Label>
                  <Input
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="07xxxxxxxx"
                    dir="ltr"
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ناوی مەندوب</Label>
                  <Input
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="ناوی مەندوب"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ژمارەی مۆبایلی مەندوب</Label>
                  <Input
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="07xxxxxxxx"
                    dir="ltr"
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label className="text-sm font-medium">بەرواری دەرچوون <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-background"
                  required
                />
              </div>
            </div>

            {/* Add Item Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-slide-up" style={{ animationDelay: '50ms' }}>
              <h2 className="mb-4 text-lg font-semibold text-card-foreground">
                زیادکردنی مادە
              </h2>
              
              <div className="space-y-4">
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
                <Label className="text-sm font-medium">مادە <span className="text-destructive">*</span></Label>
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="مادەیەک هەڵبژێرە" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[60vh] z-50">
                      {filteredItems.map((item) => (
                        <SelectItem key={item.id} value={item.id} className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 shrink-0 rounded-md overflow-hidden bg-muted border border-border">
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-[10px]">
                                  📦
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-0 min-w-0">
                              <span className="text-xs font-medium tracking-tight text-foreground truncate max-w-[180px]">
                                {item.name}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px]">
                                {item.brands && (
                                  <span className="text-primary font-medium truncate max-w-[60px]">{item.brands.name}</span>
                                )}
                                {item.brands && <span className="text-muted-foreground/50">•</span>}
                                <span className="text-muted-foreground">
                                  <span className="font-medium text-foreground">{item.current_quantity}</span> {item.unit}
                                </span>
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedItemData && (
                  <div className="animate-scale-in">
                    <ItemDetailCard item={selectedItemData} showFullDetails={true} />
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <Label className="text-[10px] font-medium truncate block">بۆکس <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      min="0"
                      value={boxCount}
                      onChange={(e) => setBoxCount(e.target.value)}
                      placeholder="0"
                      className="h-9 text-sm px-2"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <Label className="text-[10px] font-medium truncate block">دانە <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      min="0"
                      value={pieceCount}
                      onChange={(e) => setPieceCount(e.target.value)}
                      placeholder="0"
                      className="h-9 text-sm px-2"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <Label className="text-[10px] font-medium truncate block">هەدیە</Label>
                    <Input
                      type="number"
                      min="0"
                      value={giftQuantity}
                      onChange={(e) => setGiftQuantity(e.target.value)}
                      placeholder="0"
                      className="h-9 text-sm px-2"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <Label className="text-[10px] font-medium truncate block">نرخ <span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      min="0"
                      step="250"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      dir="ltr"
                      className="h-9 text-sm px-2"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">تێبینی مادە</Label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="تێبینی تایبەت بە ئەم مادەیە..."
                  />
                </div>

                <Button 
                  type="button" 
                  onClick={handleAddToCart}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Plus className="h-5 w-5" />
                  زیادکردن بۆ سەبەتە
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Cart */}
            <div className="rounded-xl border border-border bg-card shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-card-foreground">سەبەتەی دەرچوون</h3>
                </div>
                {cartItems.length > 0 && (
                  <Badge className="bg-primary text-primary-foreground">
                    {totalCartItems} دانە
                  </Badge>
                )}
              </div>
              
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                  <p>سەبەتە بەتاڵە</p>
                  <p className="text-sm">مادە زیاد بکە بۆ دەرکردن</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {cartItems.map((cartItem, index) => (
                    <div key={index} className="p-4 flex items-start gap-3 animate-fade-in">
                      <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
                        {cartItem.item.image_url ? (
                          <img 
                            src={cartItem.item.image_url} 
                            alt={cartItem.item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{cartItem.item.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                          {cartItem.boxCount ? (
                            <span>بۆکس: <span className="font-semibold text-foreground">{cartItem.boxCount}</span></span>
                          ) : null}
                          {cartItem.pieceCount ? (
                            <span>دانە: <span className="font-semibold text-foreground">{cartItem.pieceCount}</span></span>
                          ) : null}
                          {cartItem.giftQuantity ? (
                            <span className="text-green-600">🎁 هەدیە: <span className="font-semibold">{cartItem.giftQuantity}</span></span>
                          ) : null}
                          <span>•</span>
                          <span>نرخی تاک: <span className="font-semibold text-primary">{cartItem.price.toLocaleString()}</span> د.ع</span>
                          <span>•</span>
                          <span>کۆ: <span className="font-semibold text-green-600">{(((cartItem.boxCount || 0) + (cartItem.pieceCount || 0)) * cartItem.price).toLocaleString()}</span> د.ع</span>
                        </div>
                        {cartItem.note && (
                          <p className="text-xs text-muted-foreground mt-1">📝 {cartItem.note}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCartItem(index)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFromCart(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cartItems.length > 0 && (
                <div className="p-4 border-t border-border">
                  <Button 
                    onClick={handleSubmitAll}
                    variant="destructive" 
                    className="w-full gap-2"
                    disabled={addMovement.isPending || !recipientName.trim()}
                  >
                    {addMovement.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <ArrowUpFromLine className="h-5 w-5" />
                        <FileText className="h-4 w-4" />
                      </>
                    )}
                    دەرکردن + پسولە ({cartItems.length} مادە)
                  </Button>
                </div>
              )}
            </div>

            {/* Recent Invoices */}
            <div className="rounded-xl border border-border bg-card shadow-card animate-slide-up" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                <div className="rounded-lg bg-muted p-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-card-foreground">کۆتا ئینڤۆیسەکان</h3>
              </div>
              {invoicesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">وەرگر</TableHead>
                      <TableHead className="text-center">کۆی گشتی</TableHead>
                      <TableHead className="text-center">بەروار</TableHead>
                      <TableHead className="text-center w-[100px]">کردارەکان</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!recentInvoices || recentInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          هیچ ئینڤۆیسێک نییە
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentInvoices.slice(0, 5).map((invoice, index) => (
                        <TableRow key={invoice.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <TableCell className="font-medium">
                            {invoice.recipient_name || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                              {invoice.total_amount?.toLocaleString() || 0} د.ع
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground text-sm">
                            {invoice.invoice_date}
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedInvoiceId(invoice.id);
                                    setViewInvoiceOpen(true);
                                  }}
                                  className="gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  بینین
                                </DropdownMenuItem>
                                {isAdmin && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedInvoiceId(invoice.id);
                                        setEditInvoiceOpen(true);
                                      }}
                                      className="gap-2"
                                    >
                                      <Pencil className="h-4 w-4" />
                                      دەستکاری
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setInvoiceToDelete(invoice);
                                        setDeleteDialogOpen(true);
                                      }}
                                      className="gap-2 text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      سڕینەوە
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>

        <BarcodeScannerDialog
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScan={handleBarcodeScan}
        />

        <StockOutInvoiceDialog
          open={invoiceOpen}
          onOpenChange={handleInvoiceClosed}
          cartItems={cartItems}
          recipientName={recipientName}
          recipientPhone={recipientPhone}
          driverName={driverName}
          driverPhone={driverPhone}
          movementDate={date}
        />

        <EditCartItemDialog
          open={editingItem !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingItem(null);
              setEditingIndex(null);
            }
          }}
          cartItem={editingItem}
          onSave={handleSaveEditedItem}
        />

        {/* Invoice View/Edit Dialog */}
        {selectedInvoice && (
          <EditInvoiceDialog
            open={editInvoiceOpen}
            onOpenChange={(open) => {
              setEditInvoiceOpen(open);
              if (!open) setSelectedInvoiceId(null);
            }}
            invoice={selectedInvoice}
          />
        )}

        {/* Invoice View Dialog - Reuses the StockOut Invoice layout */}
        {selectedInvoice && viewInvoiceOpen && (
          <StockOutInvoiceDialog
            open={viewInvoiceOpen}
            onOpenChange={(open) => {
              setViewInvoiceOpen(open);
              if (!open) setSelectedInvoiceId(null);
            }}
            cartItems={selectedInvoice.items.map(item => ({
              item: {
                id: item.item_id || '',
                name: item.item_name,
                barcode: item.item_barcode || '',
                unit: item.item_unit || 'دانە',
                current_quantity: 0,
                min_stock: 0,
                total_in: 0,
                total_out: 0,
                date_added: '',
                created_at: '',
                updated_at: '',
                brand_id: null,
                category_id: null,
                exp_date: item.exp_date,
                mfg_date: item.mfg_date,
                image_url: null,
                remind_date: null,
                brands: item.item_brand ? { id: '', name: item.item_brand, created_at: '' } : null,
                categories: item.item_category ? { id: '', name: item.item_category, created_at: '' } : null,
              },
              quantity: item.quantity,
              boxCount: item.boxes || 0,
              pieceCount: item.pieces || 0,
              giftQuantity: item.gifts || 0,
              price: item.price || 0,
              note: item.note || undefined,
            }))}
            recipientName={selectedInvoice.recipient_name || ''}
            recipientPhone={selectedInvoice.recipient_phone || ''}
            driverName=""
            driverPhone=""
            movementDate={selectedInvoice.invoice_date}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>سڕینەوەی ئینڤۆیس</AlertDialogTitle>
              <AlertDialogDescription>
                ئایا دڵنیایت لە سڕینەوەی ئەم ئینڤۆیسە؟ ئەم کردارە ناگەڕێتەوە.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>پاشگەزبوونەوە</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  if (invoiceToDelete) {
                    await deleteInvoice.mutateAsync(invoiceToDelete.id);
                    setInvoiceToDelete(null);
                    setDeleteDialogOpen(false);
                  }
                }}
              >
                سڕینەوە
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
