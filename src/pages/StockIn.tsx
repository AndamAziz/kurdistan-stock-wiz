import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddItem, useCategories, useBrands, ItemWithRelations } from "@/hooks/useItems";
import { useAuth } from "@/hooks/useAuth";
import { ArrowDownToLine, Loader2, ScanBarcode, FileText } from "lucide-react";
import { BarcodeScannerDialog } from "@/components/barcode/BarcodeScannerDialog";
import { StockInReceiptDialog } from "@/components/stock/StockInReceiptDialog";
import { ItemImageUpload } from "@/components/items/ItemImageUpload";

const formSchema = z.object({
  barcode: z.string().min(1, "باڕکۆد پێویستە"),
  name: z.string().min(1, "ناوی مادە پێویستە"),
  itemType: z.enum(["beverage", "grocery"]).default("beverage"),
  // Beverage quantities
  boxCount: z.coerce.number().min(0).default(0),
  pieceCount: z.coerce.number().min(0).default(0),
  giftQuantity: z.coerce.number().min(0).default(0),
  boxPrice: z.coerce.number().min(0).default(0),
  piecePrice: z.coerce.number().min(0).default(0),
  // Grocery quantities (weight-based)
  weight_kg: z.coerce.number().min(0).default(0),
  weight_gram: z.coerce.number().min(0).default(0),
  pricePerKg: z.coerce.number().min(0).default(0),
  brand_id: z.string().optional(),
  category_id: z.string().optional(),
  unit: z.string().default("دانە"),
  min_stock: z.coerce.number().min(0).default(10),
  date_added: z.string().default(() => new Date().toISOString().split('T')[0]),
  mfg_date: z.string().optional(),
  exp_date: z.string().optional(),
  note: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ReceiptData {
  item: ItemWithRelations;
  quantity: number;
  itemType: "beverage" | "grocery";
  boxCount?: number;
  pieceCount?: number;
  giftQuantity?: number;
  boxPrice?: number;
  piecePrice?: number;
  date: string;
  note?: string;
  weight_kg?: number;
  weight_gram?: number;
  pricePerKg?: number;
}

export default function StockIn() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const { user } = useAuth();
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const addItem = useAddItem();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      barcode: "",
      name: "",
      itemType: "beverage",
      boxCount: 0,
      pieceCount: 0,
      giftQuantity: 0,
      boxPrice: 0,
      piecePrice: 0,
      weight_kg: 0,
      weight_gram: 0,
      pricePerKg: 0,
      brand_id: undefined,
      category_id: undefined,
      unit: "دانە",
      min_stock: 10,
      date_added: new Date().toISOString().split('T')[0],
      mfg_date: "",
      exp_date: "",
      note: "",
    },
  });

  const itemType = form.watch("itemType");

  const handleBarcodeScan = (barcode: string) => {
    form.setValue("barcode", barcode);
    setScannerOpen(false);
  };

  const handleSubmit = (data: FormData) => {
    let totalQuantity = 0;
    
    if (data.itemType === "beverage") {
      const boxQty = data.boxCount || 0;
      const pieceQty = data.pieceCount || 0;
      const giftQty = data.giftQuantity || 0;
      totalQuantity = boxQty + pieceQty + giftQty;
    } else {
      // For grocery, use weight as quantity (in grams)
      const kgInGrams = (data.weight_kg || 0) * 1000;
      const grams = data.weight_gram || 0;
      totalQuantity = kgInGrams + grams;
    }

    if (totalQuantity <= 0) {
      return;
    }

    addItem.mutate({
      barcode: data.barcode,
      name: data.name,
      current_quantity: totalQuantity,
      total_in: totalQuantity,
      brand_id: data.brand_id || undefined,
      category_id: data.category_id || undefined,
      unit: data.itemType === "grocery" ? "گرام" : data.unit,
      min_stock: data.min_stock,
      mfg_date: data.mfg_date || undefined,
      exp_date: data.exp_date || undefined,
      image_url: imageUrl || undefined,
    }, {
      onSuccess: (newItem) => {
        const receiptItem: ItemWithRelations = {
          id: newItem?.id || '',
          barcode: data.barcode,
          name: data.name,
          current_quantity: totalQuantity,
          total_in: totalQuantity,
          total_out: 0,
          unit: data.itemType === "grocery" ? "گرام" : data.unit,
          min_stock: data.min_stock,
          brand_id: data.brand_id || null,
          category_id: data.category_id || null,
          mfg_date: data.mfg_date || null,
          exp_date: data.exp_date || null,
          remind_date: null,
          image_url: imageUrl || null,
          date_added: data.date_added,
          brands: brands?.find(b => b.id === data.brand_id) || null,
          categories: categories?.find(c => c.id === data.category_id) || null,
        };

        setReceiptData({
          item: receiptItem,
          quantity: totalQuantity,
          itemType: data.itemType,
          boxCount: data.boxCount || undefined,
          pieceCount: data.pieceCount || undefined,
          giftQuantity: data.giftQuantity || undefined,
          boxPrice: data.boxPrice || undefined,
          piecePrice: data.piecePrice || undefined,
          date: data.date_added,
          note: data.note || undefined,
          weight_kg: data.weight_kg || undefined,
          weight_gram: data.weight_gram || undefined,
          pricePerKg: data.pricePerKg || undefined,
        });
        setReceiptOpen(true);
        
        form.reset();
        setImageUrl(null);
      },
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-success/10 p-3">
              <ArrowDownToLine className="h-6 w-6 text-success" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">داخڵکردن بۆ کۆگا</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                زیادکردنی مادەی نوێ بۆ ستۆک
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card animate-slide-up max-w-2xl mx-auto">
          <h2 className="mb-6 text-lg font-semibold text-card-foreground">
            داخڵکردنی مادەی نوێ
          </h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              {/* Image Upload */}
              <div className="space-y-2">
                <FormLabel>وێنەی مادە</FormLabel>
                <ItemImageUpload
                  currentImageUrl={imageUrl}
                  onImageUploaded={setImageUrl}
                  onImageRemoved={() => setImageUrl(null)}
                />
              </div>

              {/* Barcode with scanner */}
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>باڕکۆد</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="باڕکۆدی مادە" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setScannerOpen(true)}
                      >
                        <ScanBarcode className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ناوی مادە</FormLabel>
                    <FormControl>
                      <Input placeholder="ناوی مادە" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Item Type Selection */}
              <FormField
                control={form.control}
                name="itemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>جۆری مادە</FormLabel>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={field.value === "beverage" ? "default" : "outline"}
                        className="flex-1 text-sm"
                        onClick={() => field.onChange("beverage")}
                      >
                        🥤 خواردنەوە (بۆکس/دانە)
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === "grocery" ? "default" : "outline"}
                        className="flex-1 text-sm"
                        onClick={() => field.onChange("grocery")}
                      >
                        🛒 گرۆسەری (کیلۆ/گرام)
                      </Button>
                    </div>
                  </FormItem>
                )}
              />

              {/* Beverage: Box/Piece/Gift Quantities */}
              {itemType === "beverage" && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="boxCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">ژمارەی بۆکس</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} placeholder="بۆکس" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pieceCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">ژمارەی دانە</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} placeholder="دانە" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="giftQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">هەدیە</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} placeholder="هەدیە" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Prices for Box and Piece */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="boxPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">نرخی بۆکس (دینار)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              step="250"
                              placeholder="نرخ" 
                              dir="ltr"
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="piecePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">نرخی دانە (دینار)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              step="250"
                              placeholder="نرخ" 
                              dir="ltr"
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Grocery: Weight-based quantities */}
              {itemType === "grocery" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="weight_kg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">کێش (کیلۆگرام)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              step="0.5"
                              placeholder="کیلۆگرام" 
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weight_gram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">کێش (گرام)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              step="50"
                              placeholder="گرام" 
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Price per KG */}
                  <FormField
                    control={form.control}
                    name="pricePerKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">نرخی هەر کیلۆگرامێک (دینار)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            step="250"
                            placeholder="نرخی کیلۆگرام" 
                            dir="ltr"
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Brand & Category */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="brand_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>براند</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="هەڵبژێرە" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {brands?.map((brand) => (
                            <SelectItem key={brand.id} value={brand.id}>
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>هاوپۆل (کاتەگۆری)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="هەڵبژێرە" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Unit & Min Stock */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>یەکە (یونت)</FormLabel>
                      <FormControl>
                        <Input placeholder="دانە، کیلۆ، گرام..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="min_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>کەمترین ستۆک</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="date_added"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>بەرواری داخڵکردن</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mfg_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>بەرواری ئنتاج</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exp_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>بەرواری بەسەرچوون</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Note */}
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تێبینی</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="نمونە: کڕا لە کۆمپانیای..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <Button type="submit" className="w-full gap-2 h-11" disabled={addItem.isPending}>
                {addItem.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowDownToLine className="h-5 w-5" />
                )}
                داخڵکردن
              </Button>
            </form>
          </Form>
        </div>

        <BarcodeScannerDialog
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScan={handleBarcodeScan}
        />

        <StockInReceiptDialog
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          receiptData={receiptData}
        />
      </div>
    </Layout>
  );
}
