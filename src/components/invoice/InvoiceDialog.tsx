import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ItemWithRelations } from "@/hooks/useItems";
import { FileText, Printer, Send, Download, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface InvoiceItem {
  item: ItemWithRelations;
  quantity: number;
  note?: string;
}

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceItem: InvoiceItem | null;
  movementDate: string;
}

export function InvoiceDialog({
  open,
  onOpenChange,
  invoiceItem,
  movementDate,
}: InvoiceDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!invoiceItem) return null;

  const { item, quantity, note } = invoiceItem;
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
  const today = format(new Date(), "yyyy/MM/dd");

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("ناتوانرێت پەنجەرەی چاپ بکرێتەوە");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ku">
      <head>
        <meta charset="UTF-8">
        <title>ئینڤۆیس - ${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif; padding: 20px; direction: rtl; }
          .invoice { max-width: 400px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 12px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
          .divider { border-top: 1px dashed #333; margin: 15px 0; }
          .item-details { margin-bottom: 15px; }
          .item-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
          .total { font-size: 16px; font-weight: bold; text-align: center; margin-top: 15px; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
          @media print { body { padding: 0; } .invoice { border: none; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = async () => {
    // Using browser print to PDF functionality
    handlePrint();
    toast.success("بۆ داگرتن PDF، لە پەنجەرەی چاپدا \"Save as PDF\" هەڵبژێرە");
  };

  const handleWhatsApp = () => {
    if (!customerPhone) {
      toast.error("تکایە ژمارەی مۆبایلی کڕیار داخڵ بکە");
      return;
    }

    const message = `
*ئینڤۆیس - ${invoiceNumber}*
━━━━━━━━━━━━━━━━
📅 بەروار: ${today}
👤 کڕیار: ${customerName || "نەناسراو"}

*زانیاری مادە:*
📦 ناو: ${item.name}
🏷️ براند: ${item.brands?.name || "-"}
📂 هاوپۆل: ${item.categories?.name || "-"}
📊 یەکە: ${item.unit}
🔢 بڕ: ${quantity}
${item.exp_date ? `📅 بەسەرچوون: ${item.exp_date}` : ""}

${note ? `📝 تێبینی: ${note}` : ""}
━━━━━━━━━━━━━━━━
*باکوری خۆشەویست*
سیستەمی بەڕێوەبردنی کۆگا
    `.trim();

    const phone = customerPhone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("بەردەوام بوو بۆ WhatsApp");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            ئینڤۆیسی فرۆشتن
          </DialogTitle>
        </DialogHeader>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">ناوی کڕیار</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="ناوی کڕیار..."
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">ژمارەی مۆبایل</Label>
            <Input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="07xxxxxxxx"
              className="h-9"
              dir="ltr"
            />
          </div>
        </div>

        <Separator />

        {/* Invoice Preview */}
        <div
          ref={invoiceRef}
          className="border border-border rounded-lg p-4 bg-background text-foreground"
        >
          <div className="invoice">
            {/* Header */}
            <div className="header text-center mb-4">
              <h1 className="text-xl font-bold">باکوری خۆشەویست</h1>
              <p className="text-xs text-muted-foreground">سیستەمی بەڕێوەبردنی کۆگا</p>
            </div>

            {/* Invoice Info */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ژمارەی ئینڤۆیس:</span>
                <span className="font-mono text-xs">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">بەروار:</span>
                <span>{today}</span>
              </div>
              {customerName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">کڕیار:</span>
                  <span>{customerName}</span>
                </div>
              )}
            </div>

            <Separator className="my-3" />

            {/* Item Details */}
            <div className="space-y-2">
              <h3 className="font-semibold text-base">{item.name}</h3>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">براند:</span>
                  <span>{item.brands?.name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">هاوپۆل:</span>
                  <span>{item.categories?.name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">یەکە:</span>
                  <span>{item.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">بڕ:</span>
                  <span className="font-semibold">{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">باڕکۆد:</span>
                  <span className="font-mono text-xs">{item.barcode}</span>
                </div>
                {item.exp_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">بەسەرچوون:</span>
                    <span>{item.exp_date}</span>
                  </div>
                )}
              </div>

              {note && (
                <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                  <span className="text-muted-foreground">تێبینی: </span>
                  {note}
                </div>
              )}
            </div>

            <Separator className="my-3" />

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground">
              <p>سوپاس بۆ هاوکاریکردنتان</p>
              <p className="mt-1">بەرواری جوڵە: {movementDate}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2">
            <Printer className="h-4 w-4" />
            چاپکردن
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Button onClick={handleWhatsApp} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
            <Send className="h-4 w-4" />
            WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}