import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ScanBarcode } from "lucide-react";
import { useAddItem, useCategories, useBrands } from "@/hooks/useItems";
import { ItemImageUpload } from "./ItemImageUpload";
import { BarcodeScannerDialog } from "@/components/barcode/BarcodeScannerDialog";

const formSchema = z.object({
  barcode: z.string().min(1, "باڕکۆد پێویستە"),
  name: z.string().min(1, "ناو پێویستە"),
  brand_id: z.string().optional(),
  category_id: z.string().optional(),
  unit: z.string().default("دانە"),
  min_stock: z.coerce.number().min(0).default(10),
  mfg_date: z.string().optional(),
  exp_date: z.string().optional(),
  remind_date: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddItemDialog({ open, onOpenChange }: AddItemDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const addItem = useAddItem();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      barcode: "",
      name: "",
      brand_id: undefined,
      category_id: undefined,
      unit: "دانە",
      min_stock: 10,
      mfg_date: "",
      exp_date: "",
      remind_date: "",
    },
  });

  const handleSubmit = (data: FormData) => {
    addItem.mutate({
      barcode: data.barcode,
      name: data.name,
      brand_id: data.brand_id || undefined,
      category_id: data.category_id || undefined,
      unit: data.unit,
      min_stock: data.min_stock,
      mfg_date: data.mfg_date || undefined,
      exp_date: data.exp_date || undefined,
      remind_date: data.remind_date || undefined,
      image_url: imageUrl || undefined,
    }, {
      onSuccess: () => {
        form.reset();
        setImageUrl(null);
        onOpenChange(false);
      },
    });
  };

  const handleBarcodeScan = (barcode: string) => {
    form.setValue("barcode", barcode);
    setScannerOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>زیادکردنی مادەی نوێ</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                    <FormLabel>ناو</FormLabel>
                    <FormControl>
                      <Input placeholder="ناوی بەرهەم" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <FormLabel>کەتەگۆری</FormLabel>
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
                      <FormLabel>یەکە</FormLabel>
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
                  name="mfg_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>بەرواری بەرهەمهێنان</FormLabel>
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

                <FormField
                  control={form.control}
                  name="remind_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>بەرواری بیرخستنەوە</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={addItem.isPending}>
                {addItem.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : null}
                زیادکردن
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScan}
      />
    </>
  );
}