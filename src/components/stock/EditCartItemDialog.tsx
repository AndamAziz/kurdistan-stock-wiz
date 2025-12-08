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
import { ItemWithRelations } from "@/hooks/useItems";
import { Pencil } from "lucide-react";

interface CartItem {
  item: ItemWithRelations;
  quantity: number;
  boxCount?: number;
  pieceCount?: number;
  giftQuantity?: number;
  price: number;
  note?: string;
}

interface EditCartItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItem: CartItem | null;
  onSave: (updatedItem: CartItem) => void;
}

export function EditCartItemDialog({
  open,
  onOpenChange,
  cartItem,
  onSave,
}: EditCartItemDialogProps) {
  const [boxCount, setBoxCount] = useState<string>('');
  const [pieceCount, setPieceCount] = useState<string>('');
  const [giftQuantity, setGiftQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (cartItem) {
      setBoxCount(cartItem.boxCount?.toString() || '');
      setPieceCount(cartItem.pieceCount?.toString() || '');
      setGiftQuantity(cartItem.giftQuantity?.toString() || '');
      setPrice(cartItem.price.toString());
      setNote(cartItem.note || '');
    }
  }, [cartItem]);

  const handleSave = () => {
    if (!cartItem) return;

    const boxQty = parseInt(boxCount) || 0;
    const pieceQty = parseInt(pieceCount) || 0;
    const giftQty = parseInt(giftQuantity) || 0;
    const totalQuantity = boxQty + pieceQty + giftQty;

    if (totalQuantity <= 0) {
      return;
    }

    const updatedItem: CartItem = {
      ...cartItem,
      boxCount: boxQty || undefined,
      pieceCount: pieceQty || undefined,
      giftQuantity: giftQty || undefined,
      quantity: totalQuantity,
      price: parseFloat(price) || 0,
      note: note || undefined,
    };

    onSave(updatedItem);
    onOpenChange(false);
  };

  if (!cartItem) return null;

  const totalPrice = ((parseInt(boxCount) || 0) + (parseInt(pieceCount) || 0)) * (parseFloat(price) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            دەستکاریکردنی مادە
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
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
            <div>
              <h4 className="font-semibold text-foreground">{cartItem.item.name}</h4>
              <p className="text-xs text-muted-foreground">
                {cartItem.item.brands?.name} • ماوە: {cartItem.item.current_quantity} {cartItem.item.unit}
              </p>
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">بۆکس</Label>
              <Input
                type="number"
                min="0"
                value={boxCount}
                onChange={(e) => setBoxCount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">دانە</Label>
              <Input
                type="number"
                min="0"
                value={pieceCount}
                onChange={(e) => setPieceCount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">هەدیە</Label>
              <Input
                type="number"
                min="0"
                value={giftQuantity}
                onChange={(e) => setGiftQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label className="text-sm">نرخی تاک (دینار)</Label>
            <Input
              type="number"
              min="0"
              step="250"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="نرخ"
              dir="ltr"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label className="text-sm">تێبینی</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="تێبینی..."
            />
          </div>

          {/* Total Preview */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">کۆی گشتی:</span>
              <span className="text-lg font-bold text-primary">{totalPrice.toLocaleString()} د.ع</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            پاشگەزبوونەوە
          </Button>
          <Button onClick={handleSave}>
            پاشەکەوتکردن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
