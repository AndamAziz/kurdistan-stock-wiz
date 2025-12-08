import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ItemWithRelations } from "@/hooks/useItems";
import { FileText, Printer, Send, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface CartItem {
  item: ItemWithRelations;
  quantity: number;
  note?: string;
}

interface StockOutInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  recipientName: string;
  recipientPhone: string;
  movementDate: string;
}

export function StockOutInvoiceDialog({
  open,
  onOpenChange,
  cartItems,
  recipientName,
  recipientPhone,
  movementDate,
}: StockOutInvoiceDialogProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (cartItems.length === 0) return null;

  const invoiceNumber = `OUT-${Date.now().toString(36).toUpperCase()}`;
  const today = format(new Date(), "yyyy/MM/dd");
  const totalItems = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

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
        <title>پسولەی دەرچوون - ${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif; padding: 20px; direction: rtl; }
          .invoice { max-width: 500px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 12px; }
          .info-section { margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
          .divider { border-top: 1px dashed #333; margin: 15px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .items-table th, .items-table td { padding: 8px; text-align: right; border-bottom: 1px solid #ddd; font-size: 12px; }
          .items-table th { background: #f0f0f0; font-weight: bold; }
          .items-table .qty { text-align: center; }
          .items-table .exp { color: #e53e3e; font-size: 11px; }
          .items-table .note { color: #666; font-size: 10px; display: block; }
          .total-row { font-size: 16px; font-weight: bold; text-align: center; padding: 10px; background: #f5f5f5; border-radius: 5px; }
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
    handlePrint();
    toast.success("بۆ داگرتن PDF، لە پەنجەرەی چاپدا \"Save as PDF\" هەڵبژێرە");
  };

  const handleWhatsApp = () => {
    if (!recipientPhone) {
      toast.error("ژمارەی مۆبایل داخڵ نەکراوە");
      return;
    }

    let itemsList = cartItems.map((ci, idx) => 
      `${idx + 1}. ${ci.item.name} (${ci.quantity} ${ci.item.unit})${ci.item.exp_date ? ` - بەسەرچوون: ${ci.item.exp_date}` : ''}${ci.note ? ` - ${ci.note}` : ''}`
    ).join('\n');

    const message = `
*پسولەی دەرچوون - ${invoiceNumber}*
━━━━━━━━━━━━━━━━
📅 بەروار: ${movementDate}
👤 وەرگر: ${recipientName}

*لیستی مادەکان:*
${itemsList}

━━━━━━━━━━━━━━━━
📊 کۆی گشتی: ${totalItems} دانە

*باکوری خۆشەویست*
سیستەمی بەڕێوەبردنی کۆگا
    `.trim();

    const phone = recipientPhone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("بەردەوام بوو بۆ WhatsApp");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            پسولەی دەرچوون لە کۆگا
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Preview */}
        <div
          ref={invoiceRef}
          className="border border-border rounded-lg p-4 bg-background text-foreground"
        >
          <div className="invoice">
            {/* Header */}
            <div className="header text-center mb-4">
              <h1 className="text-xl font-bold">باکوری خۆشەویست</h1>
              <p className="text-xs text-muted-foreground">پسولەی دەرچوون لە کۆگا</p>
            </div>

            {/* Invoice Info */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ژمارەی پسولە:</span>
                <span className="font-mono text-xs">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">بەرواری دەرچوون:</span>
                <span>{movementDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">بەرواری چاپ:</span>
                <span>{today}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">وەرگر:</span>
                <span className="font-semibold">{recipientName}</span>
              </div>
              {recipientPhone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مۆبایل:</span>
                  <span dir="ltr">{recipientPhone}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-right py-2 px-1">#</th>
                  <th className="text-right py-2 px-1">ناوی مادە</th>
                  <th className="text-center py-2 px-1">بڕ</th>
                  <th className="text-right py-2 px-1">بەسەرچوون</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((cartItem, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-2 px-1 text-muted-foreground">{index + 1}</td>
                    <td className="py-2 px-1">
                      <span className="font-medium">{cartItem.item.name}</span>
                      {cartItem.item.brands && (
                        <span className="text-xs text-muted-foreground block">
                          {cartItem.item.brands.name}
                        </span>
                      )}
                      {cartItem.note && (
                        <span className="text-xs text-primary block">
                          تێبینی: {cartItem.note}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-1 text-center font-semibold">
                      {cartItem.quantity}
                      <span className="text-xs text-muted-foreground block">
                        {cartItem.item.unit}
                      </span>
                    </td>
                    <td className="py-2 px-1 text-destructive text-xs">
                      {cartItem.item.exp_date || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <span className="text-muted-foreground">کۆی گشتی: </span>
              <span className="font-bold text-lg">{totalItems}</span>
              <span className="text-muted-foreground"> دانە</span>
            </div>

            <Separator className="my-3" />

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground">
              <p>سوپاس بۆ هاوکاریکردنتان</p>
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
          {recipientPhone && (
            <Button onClick={handleWhatsApp} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4" />
              WhatsApp
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
