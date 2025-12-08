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
  boxCount?: number;
  pieceCount?: number;
  giftQuantity?: number;
  price: number;
  note?: string;
}

interface StockOutInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  recipientName: string;
  recipientPhone: string;
  driverName?: string;
  driverPhone?: string;
  movementDate: string;
}

export function StockOutInvoiceDialog({
  open,
  onOpenChange,
  cartItems,
  recipientName,
  recipientPhone,
  driverName,
  driverPhone,
  movementDate,
}: StockOutInvoiceDialogProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { settings: invoiceSettings } = useInvoiceSettings();

  if (cartItems.length === 0) return null;

  const invoiceNumber = `OUT-${Date.now().toString(36).toUpperCase()}`;
  const today = format(new Date(), "yyyy/MM/dd");
  const totalBoxes = cartItems.reduce((sum, ci) => sum + (ci.boxCount || 0), 0);
  const totalPieces = cartItems.reduce((sum, ci) => sum + (ci.pieceCount || 0), 0);
  const totalGifts = cartItems.reduce((sum, ci) => sum + (ci.giftQuantity || 0), 0);
  const totalItems = totalBoxes + totalPieces;
  const totalPrice = cartItems.reduce((sum, ci) => sum + (((ci.boxCount || 0) + (ci.pieceCount || 0)) * ci.price), 0);

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
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .meta-box {
            background: ${theme.light};
            padding: 18px;
            border-radius: 10px;
            border-right: 4px solid ${theme.primary};
          }
          .meta-box.driver {
            border-right-color: ${theme.secondary};
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
            border-bottom: 2px solid ${theme.light};
          }
          .items-table tbody tr:last-child {
            border-bottom: none;
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
          .item-image { width: 32px; height: 32px; border-radius: 4px; object-fit: cover; border: 1px solid #e5e5e5; }
          .item-image-placeholder { width: 32px; height: 32px; border-radius: 4px; background: #f5f5f5; border: 1px solid #e5e5e5; display: flex; align-items: center; justify-content: center; font-size: 12px; }
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

    let itemsList = cartItems.map((ci, idx) => {
      const boxQty = ci.boxCount || 0;
      const pieceQty = ci.pieceCount || 0;
      const giftQty = ci.giftQuantity || 0;
      const itemTotal = (boxQty + pieceQty) * ci.price;
      
      let qtyParts = [];
      if (boxQty > 0) qtyParts.push(`📦 بۆکس: ${boxQty}`);
      if (pieceQty > 0) qtyParts.push(`🔢 دانە: ${pieceQty}`);
      if (giftQty > 0) qtyParts.push(`🎁 هەدیە: ${giftQty}`);
      
      return `${idx + 1}. *${ci.item.name}*\n   ${qtyParts.join(' | ')}\n   💰 نرخی تاک: ${ci.price.toLocaleString()} د.ع\n   🧾 کۆی نرخ: *${itemTotal.toLocaleString()}* د.ع${ci.note ? `\n   📝 ${ci.note}` : ''}`;
    }).join('\n\n');

    const message = `
╔══════════════════════╗
       *${invoiceSettings.companyName}*
      پسولەی دەرچوون لە کۆگا
╚══════════════════════╝

📋 *ژمارەی پسولە:* ${invoiceNumber}
📅 *بەروار:* ${movementDate}
👤 *وەرگر:* ${recipientName}
${recipientPhone ? `📱 *مۆبایل:* ${recipientPhone}` : ''}
${driverName ? `\n🚗 *مەندوب:* ${driverName}` : ''}${driverPhone ? `\n📞 *مۆبایلی مەندوب:* ${driverPhone}` : ''}

━━━━━━━━━━━━━━━━━━━━

*لیستی مادەکان:*

${itemsList}

━━━━━━━━━━━━━━━━━━━━

📦 *کۆی بۆکس:* ${totalBoxes}
🔢 *کۆی دانە:* ${totalPieces}
${totalGifts > 0 ? `🎁 *کۆی هەدیە:* ${totalGifts}\n` : ''}💰 *کۆی گشتی:* *${totalPrice.toLocaleString()}* د.ع

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
      <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto p-0 w-[95vw] sm:w-auto">
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            پسولەی دەرچوون لە کۆگا
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Preview */}
        <div className="p-4 sm:p-6 pt-3 sm:pt-4">
          <div
            ref={invoiceRef}
            className="border border-border rounded-xl bg-white text-black overflow-hidden shadow-lg"
          >
            <div className="invoice-wrapper p-0">
              {/* Header */}
              <div 
                className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 sm:p-6 text-white"
                style={{ backgroundColor: theme.primary }}
              >
                <div className="flex items-center gap-3">
                  {invoiceSettings.logoUrl && (
                    <img 
                      src={invoiceSettings.logoUrl} 
                      alt="Logo" 
                      className="h-10 w-10 sm:h-14 sm:w-14 rounded-lg bg-white p-1 object-contain"
                    />
                  )}
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold">{invoiceSettings.companyName}</h1>
                    <p className="text-xs sm:text-sm opacity-90">سیستەمی بەڕێوەبردنی کۆگا</p>
                  </div>
                </div>
                <div className="text-center sm:text-left bg-white/15 px-3 sm:px-5 py-2 sm:py-3 rounded-lg">
                  <h2 className="text-sm sm:text-lg font-bold">پسولەی دەرچوون</h2>
                  <p className="text-[10px] sm:text-xs font-mono opacity-90">{invoiceNumber}</p>
                </div>
              </div>

              {/* Body */}
              <div 
                className="p-3 sm:p-6 border-x-2 border-b-2 rounded-b-xl"
                style={{ borderColor: theme.light }}
              >
                {/* Meta Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div 
                    className="p-3 sm:p-4 rounded-lg border-r-4"
                    style={{ backgroundColor: theme.light, borderRightColor: theme.primary }}
                  >
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">زانیاری وەرگر</p>
                    <p className="text-sm sm:text-lg font-semibold text-black">{recipientName}</p>
                    {recipientPhone && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1" dir="ltr">{recipientPhone}</p>
                    )}
                  </div>
                  {(driverName || driverPhone) && (
                    <div 
                      className="p-3 sm:p-4 rounded-lg border-r-4"
                      style={{ backgroundColor: theme.light, borderRightColor: theme.secondary }}
                    >
                      <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">زانیاری مەندوب</p>
                      <p className="text-sm sm:text-lg font-semibold text-black">{driverName || '-'}</p>
                      {driverPhone && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-1" dir="ltr">{driverPhone}</p>
                      )}
                    </div>
                  )}
                  <div 
                    className="p-3 sm:p-4 rounded-lg border-r-4"
                    style={{ backgroundColor: theme.light, borderRightColor: theme.primary }}
                  >
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">زانیاری پسولە</p>
                    <p className="text-sm sm:text-lg font-semibold text-black">{movementDate}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">چاپکرا: {today}</p>
                  </div>
                </div>

                {/* Items Table - Mobile Optimized */}
                <div className="overflow-x-auto mb-4 sm:mb-6 -mx-3 sm:mx-0">
                  <table className="w-full border-collapse min-w-[600px] text-xs sm:text-sm">
                    <thead>
                      <tr style={{ backgroundColor: theme.primary }}>
                        <th className="py-2 sm:py-3 px-1.5 sm:px-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white rounded-tr-lg">#</th>
                        <th className="py-2 sm:py-3 px-1.5 sm:px-2 text-right text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white">وێنە</th>
                        <th className="py-2 sm:py-3 px-1.5 sm:px-2 text-right text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white">ناوی مادە</th>
                        <th className="py-2 sm:py-3 px-1.5 sm:px-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white">بۆکس</th>
                        <th className="py-2 sm:py-3 px-1.5 sm:px-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white">دانە</th>
                        <th className="py-2 sm:py-3 px-1.5 sm:px-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white">🎁</th>
                        <th className="py-2 sm:py-3 px-1.5 sm:px-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white">نرخ</th>
                        <th className="py-2 sm:py-3 px-1.5 sm:px-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white rounded-tl-lg">کۆ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((cartItem, index) => {
                        const itemTotal = ((cartItem.boxCount || 0) + (cartItem.pieceCount || 0)) * cartItem.price;
                        return (
                          <tr 
                            key={index} 
                            style={{ 
                              backgroundColor: index % 2 === 1 ? `${theme.light}40` : 'transparent',
                              borderBottom: `2px solid ${theme.light}`
                            }}
                          >
                            <td className="py-2 sm:py-3 px-1.5 sm:px-2 text-center text-xs font-bold text-gray-700">{index + 1}</td>
                            <td className="py-2 sm:py-3 px-1.5 sm:px-2">
                              {cartItem.item.image_url ? (
                                <img 
                                  src={cartItem.item.image_url} 
                                  alt={cartItem.item.name}
                                  className="item-image"
                                  style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #e5e5e5' }}
                                />
                              ) : (
                                <div 
                                  className="item-image-placeholder"
                                  style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#f5f5f5', border: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                                >📦</div>
                              )}
                            </td>
                            <td className="py-2 sm:py-3 px-1.5 sm:px-2">
                              <div className="font-semibold text-black text-xs sm:text-sm">{cartItem.item.name}</div>
                              {cartItem.item.brands && (
                                <div className="text-[10px] sm:text-xs text-gray-500">{cartItem.item.brands.name}</div>
                              )}
                              {cartItem.note && (
                                <div className="text-[9px] sm:text-xs mt-0.5 italic" style={{ color: theme.secondary }}>📝 {cartItem.note}</div>
                              )}
                            </td>
                            <td className="py-2 sm:py-3 px-1.5 sm:px-2 text-center font-semibold text-xs">{cartItem.boxCount || '-'}</td>
                            <td className="py-2 sm:py-3 px-1.5 sm:px-2 text-center font-semibold text-xs">{cartItem.pieceCount || '-'}</td>
                            <td className="py-2 sm:py-3 px-1.5 sm:px-2 text-center font-semibold text-green-600 text-xs">{cartItem.giftQuantity || '-'}</td>
                            <td className="py-2 sm:py-3 px-1.5 sm:px-2 text-center font-mono text-xs" dir="ltr">{cartItem.price.toLocaleString()}</td>
                            <td className="py-2 sm:py-3 px-1.5 sm:px-2 text-center font-mono font-bold text-xs" dir="ltr" style={{ color: theme.primary }}>{itemTotal.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Total Section */}
                <div className="flex justify-end">
                  <div className="w-full sm:w-72 rounded-lg overflow-hidden border-2 text-sm" style={{ borderColor: theme.light }}>
                    <div className="flex justify-between px-3 sm:px-5 py-2 border-b" style={{ borderColor: theme.light }}>
                      <span className="text-gray-600 text-xs sm:text-sm">کۆی بۆکس</span>
                      <span className="font-semibold">{totalBoxes}</span>
                    </div>
                    <div className="flex justify-between px-3 sm:px-5 py-2 border-b" style={{ borderColor: theme.light }}>
                      <span className="text-gray-600 text-xs sm:text-sm">کۆی دانە</span>
                      <span className="font-semibold">{totalPieces}</span>
                    </div>
                    {totalGifts > 0 && (
                      <div className="flex justify-between px-3 sm:px-5 py-2 border-b" style={{ borderColor: theme.light }}>
                        <span className="text-gray-600 text-xs sm:text-sm">🎁 کۆی هەدیە</span>
                        <span className="font-semibold text-green-600">{totalGifts}</span>
                      </div>
                    )}
                    <div className="flex justify-between px-3 sm:px-5 py-2 border-b" style={{ borderColor: theme.light }}>
                      <span className="text-gray-600 text-xs sm:text-sm">کۆی مادە</span>
                      <span className="font-semibold">{cartItems.length}</span>
                    </div>
                    <div 
                      className="flex justify-between items-center px-3 sm:px-5 py-3 text-white"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <span className="text-xs sm:text-sm font-medium">کۆی گشتی</span>
                      <span className="text-base sm:text-xl font-bold font-mono" dir="ltr">{totalPrice.toLocaleString()} د.ع</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 sm:mt-10 pt-4 sm:pt-6 border-t-2 border-dashed border-gray-300 flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6">
                  <div className="text-[10px] sm:text-xs text-gray-500">
                    <p>✨ سوپاس بۆ هاوکاریکردنتان</p>
                    <p className="mt-1">{invoiceSettings.companyName} - سیستەمی بەڕێوەبردنی کۆگا</p>
                  </div>
                  <div className="text-left">
                    <div className="w-32 sm:w-44 h-8 sm:h-10 border-b border-black mb-1"></div>
                    <p className="text-[10px] sm:text-xs text-gray-500">واژووی وەرگر</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 p-4 sm:p-6 pt-0">
          <Button onClick={handlePrint} variant="outline" className="flex-1 gap-1.5 h-10 sm:h-12 text-sm sm:text-base">
            <Printer className="h-4 w-4 sm:h-5 sm:w-5" />
            چاپ
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" className="flex-1 gap-1.5 h-10 sm:h-12 text-sm sm:text-base">
            <Download className="h-4 w-4 sm:h-5 sm:w-5" />
            PDF
          </Button>
          {recipientPhone && (
            <Button onClick={handleWhatsApp} className="flex-1 gap-1.5 h-10 sm:h-12 bg-green-600 hover:bg-green-700 text-sm sm:text-base">
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              WhatsApp
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
