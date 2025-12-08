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
import { useInvoiceSettings, colorThemes } from "@/pages/Settings";

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
  const { settings: invoiceSettings } = useInvoiceSettings();

  if (cartItems.length === 0) return null;

  const invoiceNumber = `OUT-${Date.now().toString(36).toUpperCase()}`;
  const today = format(new Date(), "yyyy/MM/dd");
  const totalItems = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);
  const totalPrice = cartItems.reduce((sum, ci) => sum + (ci.quantity * ci.price), 0);

  const theme = colorThemes[invoiceSettings.colorTheme];

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
            background: ${theme.primary};
            color: white;
            padding: 25px 30px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .company-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .company-logo {
            width: 60px;
            height: 60px;
            border-radius: 10px;
            background: white;
            padding: 5px;
            object-fit: contain;
          }
          .company-info h1 {
            font-size: 26px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .company-info p {
            font-size: 12px;
            opacity: 0.9;
          }
          .invoice-badge {
            text-align: left;
            background: rgba(255,255,255,0.15);
            padding: 12px 20px;
            border-radius: 8px;
          }
          .invoice-badge h2 {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .invoice-badge .number {
            font-size: 11px;
            font-family: monospace;
            opacity: 0.9;
          }
          .invoice-body {
            border: 2px solid ${theme.light};
            border-top: none;
            border-radius: 0 0 12px 12px;
            padding: 30px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .meta-box {
            background: ${theme.light};
            padding: 18px;
            border-radius: 10px;
            border-right: 4px solid ${theme.primary};
          }
          .meta-box .label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }
          .meta-box .value {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
          }
          .meta-box .sub {
            font-size: 13px;
            color: #666;
            margin-top: 3px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .items-table thead th {
            background: ${theme.primary};
            color: white;
            padding: 14px 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .items-table thead th:first-child { border-radius: 8px 0 0 0; }
          .items-table thead th:last-child { border-radius: 0 8px 0 0; }
          .items-table tbody tr {
            border-bottom: 1px solid #eee;
          }
          .items-table tbody tr:nth-child(even) {
            background: ${theme.light}40;
          }
          .items-table td {
            padding: 14px 12px;
            font-size: 13px;
            vertical-align: top;
          }
          .item-name { font-weight: 600; color: #1a1a1a; }
          .item-brand { font-size: 11px; color: #888; margin-top: 2px; }
          .item-note { font-size: 10px; color: ${theme.secondary}; margin-top: 3px; font-style: italic; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .exp-date { color: #dc2626; font-weight: 500; }
          .price { font-family: 'Courier New', monospace; }
          .totals-section {
            display: flex;
            justify-content: flex-end;
          }
          .totals-box {
            width: 280px;
            border-radius: 10px;
            overflow: hidden;
            border: 2px solid ${theme.light};
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 18px;
            border-bottom: 1px solid ${theme.light};
            font-size: 14px;
          }
          .total-row .label { color: #666; }
          .total-row .value { font-weight: 600; }
          .grand-total {
            background: ${theme.primary};
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 18px;
          }
          .grand-total .label { font-size: 14px; }
          .grand-total .value { font-size: 22px; font-weight: 700; font-family: 'Courier New', monospace; }
          .invoice-footer {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 2px dashed #ddd;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .footer-text { font-size: 12px; color: #888; }
          .signature-area { text-align: left; }
          .signature-line { width: 180px; border-bottom: 1px solid #333; height: 40px; margin-bottom: 5px; }
          .signature-label { font-size: 11px; color: #666; }
          @media print { 
            body { padding: 0; } 
            .invoice-wrapper { padding: 15px; max-width: 100%; }
            .invoice-header { border-radius: 0; }
            .invoice-body { border-radius: 0; }
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
       *${invoiceSettings.companyName}*
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
            className="border border-border rounded-xl bg-white text-black overflow-hidden shadow-lg"
          >
            <div className="invoice-wrapper p-0">
              {/* Header */}
              <div 
                className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 text-white"
                style={{ backgroundColor: theme.primary }}
              >
                <div className="flex items-center gap-4">
                  {invoiceSettings.logoUrl && (
                    <img 
                      src={invoiceSettings.logoUrl} 
                      alt="Logo" 
                      className="h-14 w-14 rounded-lg bg-white p-1.5 object-contain"
                    />
                  )}
                  <div>
                    <h1 className="text-2xl font-bold">{invoiceSettings.companyName}</h1>
                    <p className="text-sm opacity-90">سیستەمی بەڕێوەبردنی کۆگا</p>
                  </div>
                </div>
                <div className="text-center sm:text-left bg-white/15 px-5 py-3 rounded-lg">
                  <h2 className="text-lg font-bold">پسولەی دەرچوون</h2>
                  <p className="text-xs font-mono opacity-90">{invoiceNumber}</p>
                </div>
              </div>

              {/* Body */}
              <div 
                className="p-6 border-x-2 border-b-2 rounded-b-xl"
                style={{ borderColor: theme.light }}
              >
                {/* Meta Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div 
                    className="p-4 rounded-lg border-r-4"
                    style={{ backgroundColor: theme.light, borderRightColor: theme.primary }}
                  >
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">زانیاری وەرگر</p>
                    <p className="text-lg font-semibold text-black">{recipientName}</p>
                    {recipientPhone && (
                      <p className="text-sm text-gray-600 mt-1" dir="ltr">{recipientPhone}</p>
                    )}
                  </div>
                  <div 
                    className="p-4 rounded-lg border-r-4"
                    style={{ backgroundColor: theme.light, borderRightColor: theme.primary }}
                  >
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">زانیاری پسولە</p>
                    <p className="text-lg font-semibold text-black">{movementDate}</p>
                    <p className="text-sm text-gray-600 mt-1">چاپکرا: {today}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse min-w-[500px]">
                    <thead>
                      <tr style={{ backgroundColor: theme.primary }}>
                        <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-white rounded-tr-lg">#</th>
                        <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-white">ناوی مادە</th>
                        <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wider text-white">بڕ</th>
                        <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wider text-white">نرخ</th>
                        <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wider text-white">کۆ</th>
                        <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider text-white rounded-tl-lg">بەسەرچوون</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((cartItem, index) => (
                        <tr 
                          key={index} 
                          className="border-b border-gray-200"
                          style={{ backgroundColor: index % 2 === 1 ? `${theme.light}40` : 'transparent' }}
                        >
                          <td className="py-4 px-3 text-sm text-gray-500">{index + 1}</td>
                          <td className="py-4 px-3">
                            <div className="font-semibold text-black">{cartItem.item.name}</div>
                            {cartItem.item.brands && (
                              <div className="text-xs text-gray-500 mt-1">{cartItem.item.brands.name}</div>
                            )}
                            {cartItem.note && (
                              <div className="text-xs mt-1 italic" style={{ color: theme.secondary }}>📝 {cartItem.note}</div>
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
                  <div className="w-full sm:w-72 rounded-lg overflow-hidden border-2" style={{ borderColor: theme.light }}>
                    <div className="flex justify-between px-5 py-3 border-b" style={{ borderColor: theme.light }}>
                      <span className="text-gray-600 text-sm">کۆی دانە</span>
                      <span className="font-semibold">{totalItems}</span>
                    </div>
                    <div className="flex justify-between px-5 py-3 border-b" style={{ borderColor: theme.light }}>
                      <span className="text-gray-600 text-sm">کۆی مادە</span>
                      <span className="font-semibold">{cartItems.length}</span>
                    </div>
                    <div 
                      className="flex justify-between items-center px-5 py-4 text-white"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <span className="text-sm font-medium">کۆی گشتی</span>
                      <span className="text-xl font-bold font-mono" dir="ltr">{totalPrice.toLocaleString()} د.ع</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-10 pt-6 border-t-2 border-dashed border-gray-300 flex flex-col sm:flex-row justify-between items-start gap-6">
                  <div className="text-xs text-gray-500">
                    <p>✨ سوپاس بۆ هاوکاریکردنتان</p>
                    <p className="mt-1">{invoiceSettings.companyName} - سیستەمی بەڕێوەبردنی کۆگا</p>
                  </div>
                  <div className="text-left">
                    <div className="w-44 h-10 border-b border-black mb-1"></div>
                    <p className="text-xs text-gray-500">واژووی وەرگر</p>
                  </div>
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
