import { useState } from "react";
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
import { items, Item } from "@/lib/mockData";
import { ArrowDownToLine, ArrowUpFromLine, Search } from "lucide-react";
import { toast } from "sonner";

interface StockMovementFormProps {
  type: 'IN' | 'OUT';
}

export function StockMovementForm({ type }: StockMovementFormProps) {
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = items.filter(item => 
    item.name.includes(searchQuery) || item.barcode.includes(searchQuery)
  );

  const selectedItemData = items.find(item => item.id === selectedItem);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem || !quantity || parseInt(quantity) <= 0) {
      toast.error('تکایە زانیارییەکان بە تەواوی پڕبکەرەوە');
      return;
    }

    if (type === 'OUT' && selectedItemData && parseInt(quantity) > selectedItemData.quantity) {
      toast.error(`ژمارەی داواکراو زیاترە لەوەی هەیە (${selectedItemData.quantity})`);
      return;
    }

    // In a real app, this would be an API call
    toast.success(
      type === 'IN' 
        ? `${quantity} دانە ${selectedItemData?.name} زیادکرا بۆ کۆگا` 
        : `${quantity} دانە ${selectedItemData?.name} دەرکرا لە کۆگا`
    );

    // Reset form
    setSelectedItem('');
    setQuantity('');
    setNote('');
    setSearchQuery('');
  };

  const isInType = type === 'IN';
  const iconColor = isInType ? 'text-success' : 'text-destructive';
  const buttonVariant = isInType ? 'default' : 'destructive';
  const Icon = isInType ? ArrowDownToLine : ArrowUpFromLine;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Item Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">گەڕان بۆ مادە</Label>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="گەڕان بە ناو یان باڕکۆد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">مادە</Label>
        <Select value={selectedItem} onValueChange={setSelectedItem}>
          <SelectTrigger>
            <SelectValue placeholder="مادەیەک هەڵبژێرە" />
          </SelectTrigger>
          <SelectContent>
            {filteredItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                <div className="flex items-center gap-2">
                  <span>{item.name}</span>
                  <span className="text-xs text-muted-foreground">({item.quantity} ماوە)</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Item Info */}
      {selectedItemData && (
        <div className="rounded-lg border border-border bg-muted/50 p-4 animate-scale-in">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">ناو:</span>
              <span className="mr-2 font-medium">{selectedItemData.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">براند:</span>
              <span className="mr-2 font-medium">{selectedItemData.brand}</span>
            </div>
            <div>
              <span className="text-muted-foreground">ستۆکی ئێستا:</span>
              <span className="mr-2 font-semibold text-primary">{selectedItemData.quantity}</span>
            </div>
            <div>
              <span className="text-muted-foreground">یەکە:</span>
              <span className="mr-2 font-medium">{selectedItemData.unit}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">ژمارە</Label>
        <Input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="ژمارەی مادە"
        />
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">بەروار</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">تێبینی</Label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={isInType ? "نمونە: کڕا لە کۆمپانیای..." : "نمونە: فرۆشتن بۆ کڕیار..."}
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full gap-2" variant={buttonVariant as "default" | "destructive"}>
        <Icon className="h-5 w-5" />
        {isInType ? 'داخڵکردن بۆ کۆگا' : 'دەرکردن لە کۆگا'}
      </Button>
    </form>
  );
}
