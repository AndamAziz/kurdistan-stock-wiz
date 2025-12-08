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
import { useItems, useStockMovements, useAddStockMovement } from "@/hooks/useItems";
import { useAuth } from "@/hooks/useAuth";
import { ArrowUpFromLine, Clock, Search, Loader2, ScanBarcode } from "lucide-react";
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

export default function StockOut() {
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const { user } = useAuth();
  const { data: items } = useItems();
  const { data: movements, isLoading: movementsLoading } = useStockMovements();
  const addMovement = useAddStockMovement();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem || !quantity || parseInt(quantity) <= 0) {
      toast.error('تکایە زانیارییەکان بە تەواوی پڕبکەرەوە');
      return;
    }

    if (selectedItemData && parseInt(quantity) > selectedItemData.current_quantity) {
      toast.error(`ژمارەی داواکراو زیاترە لەوەی هەیە (${selectedItemData.current_quantity})`);
      return;
    }

    addMovement.mutate({
      item_id: selectedItem,
      movement_type: 'OUT',
      quantity: parseInt(quantity),
      movement_date: date,
      note: note || undefined,
      created_by: user?.id,
    }, {
      onSuccess: () => {
        setSelectedItem('');
        setQuantity('');
        setNote('');
        setSearchQuery('');
      },
    });
  };

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
          <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-slide-up">
            <h2 className="mb-6 text-lg font-semibold text-card-foreground">
              دەرکردنی مادە
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {selectedItemData && (
                <div className="rounded-lg border border-border bg-muted/50 p-4 animate-scale-in">
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
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">ژمارە</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedItemData?.current_quantity || undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="ژمارەی مادە"
                />
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
                <Label className="text-sm font-medium">تێبینی</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="نمونە: فرۆشتن بۆ کڕیار..."
                  rows={3}
                />
              </div>

              <Button type="submit" variant="destructive" className="w-full gap-2" disabled={addMovement.isPending}>
                {addMovement.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowUpFromLine className="h-5 w-5" />
                )}
                دەرکردن لە کۆگا
              </Button>
            </form>
          </div>

          {/* Recent Movements */}
          <div className="rounded-xl border border-border bg-card shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 border-b border-border px-6 py-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-card-foreground">کۆتا دەرکردنەکان</h3>
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
                    <TableHead className="text-center">ژمارە</TableHead>
                    <TableHead className="text-center">بەروار</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                        هیچ ڕیکۆردێک نییە
                      </TableCell>
                    </TableRow>
                  ) : (
                    outMovements.map((movement, index) => (
                      <TableRow key={movement.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                        <TableCell className="font-medium">
                          {(movement.items as any)?.name || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                            -{movement.quantity}
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
