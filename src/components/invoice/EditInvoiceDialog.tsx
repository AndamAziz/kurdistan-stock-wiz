import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InvoiceWithItems, InvoiceItem, useUpdateInvoice, useUpdateInvoiceItems } from "@/hooks/useInvoices";
import { Save, Loader2, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface EditInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceWithItems | null;
  onSuccess?: () => void;
}

interface EditableItem extends InvoiceItem {
  isDeleted?: boolean;
}

export function EditInvoiceDialog({ open, onOpenChange, invoice, onSuccess }: EditInvoiceDialogProps) {
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<EditableItem[]>([]);
  
  const updateInvoice = useUpdateInvoice();
  const updateItems = useUpdateInvoiceItems();

  useEffect(() => {
    if (invoice) {
      setRecipientName(invoice.recipient_name || '');
      setRecipientPhone(invoice.recipient_phone || '');
      setNotes(invoice.notes || '');
      setItems(invoice.items.map(item => ({ ...item, isDeleted: false })));
    }
  }, [invoice]);

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Recalculate total price
      const item = updated[index];
      if (invoice?.invoice_type === 'stock_out') {
        // For stock out: (boxes + pieces) * price
        const qty = (item.boxes || 0) + (item.pieces || 0);
        updated[index].total_price = qty * (item.price || 0);
      } else {
        // For stock in: quantity * price
        updated[index].total_price = (item.quantity || 0) * (item.price || 0);
      }
      
      return updated;
    });
  };

  const handleDeleteItem = (index: number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isDeleted: true };
      return updated;
    });
  };

  const handleRestoreItem = (index: number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isDeleted: false };
      return updated;
    });
  };

  const calculateTotal = () => {
    return items
      .filter(item => !item.isDeleted)
      .reduce((sum, item) => sum + (item.total_price || 0), 0);
  };

  const handleSave = async () => {
    if (!invoice) return;

    try {
      // Update invoice header
      await updateInvoice.mutateAsync({
        id: invoice.id,
        data: {
          recipient_name: recipientName || null,
          recipient_phone: recipientPhone || null,
          notes: notes || null,
          total_amount: calculateTotal(),
        }
      });

      // Update invoice items
      const activeItems = items.filter(item => !item.isDeleted);
      const deletedItemIds = items.filter(item => item.isDeleted).map(item => item.id);

      await updateItems.mutateAsync({
        invoiceId: invoice.id,
        items: activeItems.map(item => ({
          id: item.id,
          boxes: item.boxes || 0,
          pieces: item.pieces || 0,
          gifts: item.gifts || 0,
          quantity: item.quantity || 0,
          weight_kg: item.weight_kg || 0,
          weight_gram: item.weight_gram || 0,
          price: item.price || 0,
          total_price: item.total_price || 0,
          note: item.note || null,
        })),
        deletedItemIds,
      });

      toast.success('ئینڤۆیس نوێکرایەوە');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('هەڵە لە نوێکردنەوەی ئینڤۆیس');
    }
  };

  const isStockOut = invoice?.invoice_type === 'stock_out';
  const activeItems = items.filter(item => !item.isDeleted);
  const isSaving = updateInvoice.isPending || updateItems.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            دەستکاریکردنی ئینڤۆیس
            <span className="text-muted-foreground font-mono text-sm">
              #{invoice?.invoice_number}
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Recipient Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">زانیاری وەرگر</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">ناوی وەرگر</Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="ناوی کۆمپانیا/کەس"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">ژمارەی مۆبایل</Label>
                  <Input
                    id="recipientPhone"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="07xxxxxxxxx"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">تێبینی</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="تێبینی ئینڤۆیس..."
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground">مادەکان</h3>
                <span className="text-xs text-muted-foreground">
                  {activeItems.length} مادە
                </span>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`rounded-lg border p-4 space-y-3 transition-opacity ${
                      item.isDeleted ? 'opacity-50 bg-destructive/5 border-destructive/30' : 'bg-muted/30'
                    }`}
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold">{item.item_name}</p>
                        {item.item_brand && (
                          <p className="text-xs text-muted-foreground">{item.item_brand}</p>
                        )}
                      </div>
                      {item.isDeleted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreItem(index)}
                        >
                          گەڕاندنەوە
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {!item.isDeleted && (
                      <>
                        {/* Quantity Fields */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {isStockOut ? (
                            <>
                              <div className="space-y-1">
                                <Label className="text-xs">بۆکس</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.boxes || 0}
                                  onChange={(e) => handleItemChange(index, 'boxes', parseInt(e.target.value) || 0)}
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">دانە</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.pieces || 0}
                                  onChange={(e) => handleItemChange(index, 'pieces', parseInt(e.target.value) || 0)}
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">هەدیە 🎁</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.gifts || 0}
                                  onChange={(e) => handleItemChange(index, 'gifts', parseInt(e.target.value) || 0)}
                                  className="h-9"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="space-y-1">
                              <Label className="text-xs">بڕ</Label>
                              <Input
                                type="number"
                                min="0"
                                value={item.quantity || 0}
                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                className="h-9"
                              />
                            </div>
                          )}
                          <div className="space-y-1">
                            <Label className="text-xs">نرخ (د.ع)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={item.price || 0}
                              onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                              className="h-9"
                            />
                          </div>
                        </div>

                        {/* Note and Total */}
                        <div className="flex items-end gap-3">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">تێبینی</Label>
                            <Input
                              value={item.note || ''}
                              onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                              placeholder="تێبینی..."
                              className="h-9"
                            />
                          </div>
                          <div className="text-left min-w-[100px]">
                            <p className="text-xs text-muted-foreground">کۆ</p>
                            <p className="font-bold text-primary">
                              {(item.total_price || 0).toLocaleString()} د.ع
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>کۆی گشتی:</span>
            <span className="text-primary">{calculateTotal().toLocaleString()} د.ع</span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              پاشگەزبوونەوە
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              پاشەکەوتکردن
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
