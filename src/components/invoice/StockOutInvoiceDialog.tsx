import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ItemWithRelations } from "@/hooks/useItems";
import { FileText, Printer, Send, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface CartItem {
  item: ItemWithRelations;
  quantity: number;
  price: number;
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
  const totalPrice = cartItems.reduce((sum, ci) => sum + (ci.quantity * ci.price), 0);

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
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Noto Sans Arabic', sans-serif; 
            padding: 0; 
            direction: rtl; 
            background: #fff;
            color: #1a1a1a;
          }
          .invoice-wrapper {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 30px;
            border-bottom: 3px solid #1a1a1a;
            margin-bottom: 30px;
          }
          .company-info h1 {
            font-size: 32px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 5px;
          }
          .company-info p {
            font-size: 14px;
            color: #666;
          }
          .invoice-title {
            text-align: left;
          }
          .invoice-title h2 {
            font-size: 28px;
            font-weight: 700;
            color: #dc2626;
            letter-spacing: 2px;
            margin-bottom: 10px;
          }
          .invoice-title .invoice-number {
            font-size: 12px;
            color: #666;
            font-family: monospace;
          }
          .meta-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }
          .meta-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-right: 4px solid #1a1a1a;
          }
          .meta-box h3 {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 1px;
          }
          .meta-box .value {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
          }
          .meta-box .sub-value {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table thead {
            background: #1a1a1a;
            color: #fff;
          }
          .items-table th {
            padding: 15px 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: right;
          }
          .items-table th.center { text-align: center; }
          .items-table th.left { text-align: left; }
          .items-table tbody tr {
            border-bottom: 1px solid #e5e7eb;
          }
          .items-table tbody tr:nth-child(even) {
            background: #f8f9fa;
          }
          .items-table td {
            padding: 15px 12px;
            font-size: 14px;
            vertical-align: top;
          }
          .items-table td.center { text-align: center; }
          .items-table td.left { text-align: left; }
          .item-name {
            font-weight: 600;
            color: #1a1a1a;
          }
          .item-brand {
            font-size: 12px;
            color: #666;
            margin-top: 3px;
          }
          .item-note {
            font-size: 11px;
            color: #2563eb;
            margin-top: 3px;
            font-style: italic;
          }
          .exp-date {
            color: #dc2626;
            font-weight: 500;
            font-size: 13px;
          }
          .price-value {
            font-family: 'Courier New', monospace;
            font-weight: 600;
          }
          .total-section {
            display: flex;
            justify-content: flex-end;
          }
          .total-box {
            width: 300px;
            background: #f8f9fa;
            border-radius: 8px;
            overflow: hidden;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 20px;
            border-bottom: 1px solid #e5e7eb;
          }
          .total-row span:first-child {
            color: #666;
            font-size: 14px;
          }
          .total-row span:last-child {
            font-weight: 600;
            font-size: 14px;
          }
          .grand-total {
            background: #1a1a1a;
            color: #fff;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .grand-total span:first-child {
            font-size: 14px;
            font-weight: 500;
          }
          .grand-total span:last-child {
            font-size: 22px;
            font-weight: 700;
            font-family: 'Courier New', monospace;
          }
          .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .footer-left {
            font-size: 12px;
            color: #666;
          }
          .footer-right {
            text-align: left;
          }
          .signature-line {
            width: 200px;
            border-bottom: 1px solid #1a1a1a;
            margin-bottom: 5px;
            height: 40px;
          }
          .signature-label {
            font-size: 11px;
            color: #666;
          }
          @media print {
            body { padding: 0; }
            .invoice-wrapper { padding: 20px; max-width: 100%; }
          }
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
      `${idx + 1}. ${ci.item.name}\n   📦 ${ci.quantity} × ${ci.price.toLocaleString()} = *${(ci.quantity * ci.price).toLocaleString()}* د.ع${ci.item.exp_date ? `\n   ⏰ بەسەرچوون: ${ci.item.exp_date}` : ''}${ci.note ? `\n   📝 ${ci.note}` : ''}`
    ).join('\n\n');

    const message = `
╔══════════════════════╗
       *باکوری خۆشەویست*
      پسولەی دەرچوون لە کۆگا
╚══════════════════════╝

📋 *ژمارەی پسولە:* ${invoiceNumber}
📅 *بەروار:* ${movementDate}
👤 *وەرگر:* ${recipientName}
${recipientPhone ? `📱 *مۆبایل:* ${recipientPhone}` : ''}

━━━━━━━━━━━━━━━━━━━━

*لیستی مادەکان:*

${itemsList}

━━━━━━━━━━━━━━━━━━━━

📊 *کۆی دانە:* ${totalItems}
💰 *کۆی گشتی:* *${totalPrice.toLocaleString()}* د.ع

━━━━━━━━━━━━━━━━━━━━
✨ سوپاس بۆ هاوکاریکردنتان ✨
    `.trim();

    const phone = recipientPhone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("بەردەوام بوو بۆ WhatsApp");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            پسولەی دەرچوون لە کۆگا
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Preview */}
        <div className="p-6 pt-4">
          <div
            ref={invoiceRef}
            className="border border-border rounded-lg bg-white text-black overflow-hidden"
          >
            <div className="invoice-wrapper p-6 sm:p-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-[3px] border-black mb-6">
                <div className="company-info">
                  <h1 className="text-2xl sm:text-3xl font-bold text-black mb-1">باکوری خۆشەویست</h1>
                  <p className="text-sm text-gray-500">سیستەمی بەڕێوەبردنی کۆگا</p>
                </div>
                <div className="invoice-title text-right sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold text-destructive tracking-wider mb-2">پسولەی دەرچوون</h2>
                  <p className="text-xs text-gray-500 font-mono">{invoiceNumber}</p>
                </div>
              </div>

              {/* Meta Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg border-r-4 border-black">
                  <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">زانیاری وەرگر</h3>
                  <p className="text-lg font-semibold text-black">{recipientName}</p>
                  {recipientPhone && (
                    <p className="text-sm text-gray-600 mt-1" dir="ltr">{recipientPhone}</p>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border-r-4 border-black">
                  <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">زانیاری پسولە</h3>
                  <p className="text-lg font-semibold text-black">{movementDate}</p>
                  <p className="text-sm text-gray-600 mt-1">چاپکرا: {today}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-black text-white">
                      <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider">#</th>
                      <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider">ناوی مادە</th>
                      <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wider">بڕ</th>
                      <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wider">نرخ</th>
                      <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wider">کۆ</th>
                      <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider">بەسەرچوون</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((cartItem, index) => (
                      <tr key={index} className={`border-b border-gray-200 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}>
                        <td className="py-4 px-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="py-4 px-3">
                          <div className="font-semibold text-black">{cartItem.item.name}</div>
                          {cartItem.item.brands && (
                            <div className="text-xs text-gray-500 mt-1">{cartItem.item.brands.name}</div>
                          )}
                          {cartItem.note && (
                            <div className="text-xs text-blue-600 mt-1 italic">📝 {cartItem.note}</div>
                          )}
                        </td>
                        <td className="py-4 px-3 text-center font-semibold">{cartItem.quantity}</td>
                        <td className="py-4 px-3 text-center font-mono" dir="ltr">{cartItem.price.toLocaleString()}</td>
                        <td className="py-4 px-3 text-center font-mono font-semibold" dir="ltr">{(cartItem.quantity * cartItem.price).toLocaleString()}</td>
                        <td className="py-4 px-3 text-destructive text-sm font-medium">
                          {cartItem.item.exp_date || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Section */}
              <div className="flex justify-end">
                <div className="w-full sm:w-72 bg-gray-50 rounded-lg overflow-hidden">
                  <div className="flex justify-between px-5 py-3 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">کۆی دانە</span>
                    <span className="font-semibold">{totalItems}</span>
                  </div>
                  <div className="flex justify-between px-5 py-3 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">کۆی مادە</span>
                    <span className="font-semibold">{cartItems.length}</span>
                  </div>
                  <div className="bg-black text-white flex justify-between items-center px-5 py-4">
                    <span className="text-sm font-medium">کۆی گشتی</span>
                    <span className="text-xl font-bold font-mono" dir="ltr">{totalPrice.toLocaleString()} د.ع</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start gap-6">
                <div className="text-xs text-gray-500">
                  <p>✨ سوپاس بۆ هاوکاریکردنتان</p>
                  <p className="mt-1">باکوری خۆشەویست - سیستەمی بەڕێوەبردنی کۆگا</p>
                </div>
                <div className="text-left">
                  <div className="w-48 h-10 border-b border-black mb-1"></div>
                  <p className="text-xs text-gray-500">واژووی وەرگر</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 p-6 pt-0">
          <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2 h-12">
            <Printer className="h-5 w-5" />
            چاپکردن
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" className="flex-1 gap-2 h-12">
            <Download className="h-5 w-5" />
            PDF
          </Button>
          {recipientPhone && (
            <Button onClick={handleWhatsApp} className="flex-1 gap-2 h-12 bg-green-600 hover:bg-green-700">
              <Send className="h-5 w-5" />
              WhatsApp
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
