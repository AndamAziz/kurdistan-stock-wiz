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
import { QRCodeSVG } from "qrcode.react";

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

  // QR Code data containing invoice summary
  const qrData = JSON.stringify({
    inv: invoiceNumber,
    date: movementDate,
    customer: recipientName,
    phone: recipientPhone,
    items: cartItems.length,
    total: totalPrice,
    company: invoiceSettings.companyName
  });

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
            padding: 20px; 
            direction: rtl; 
            background: #fff;
            color: #1a1a1a;
            font-size: 12px;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid ${theme.primary};
            border-radius: 12px;
            overflow: hidden;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 20px;
            background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});
            color: white;
          }
          .header-right {
            text-align: right;
          }
          .header-right .customer-label {
            font-size: 10px;
            opacity: 0.8;
            margin-bottom: 4px;
          }
          .header-right .customer-name {
            font-size: 18px;
            font-weight: 700;
          }
          .header-right .customer-phone {
            font-size: 12px;
            opacity: 0.9;
            margin-top: 4px;
            direction: ltr;
            text-align: right;
          }
          .header-center {
            text-align: center;
            flex: 1;
          }
          .header-center .logo-placeholder {
            width: 70px;
            height: 70px;
            margin: 0 auto 8px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .header-center .logo-placeholder img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .header-center .company-name {
            font-size: 20px;
            font-weight: 700;
          }
          .header-center .invoice-type {
            font-size: 12px;
            opacity: 0.9;
            margin-top: 4px;
          }
          .header-center .invoice-number {
            font-size: 10px;
            font-family: monospace;
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 20px;
            margin-top: 8px;
            display: inline-block;
          }
          .header-left {
            text-align: left;
          }
          .header-left .driver-label {
            font-size: 10px;
            opacity: 0.8;
            margin-bottom: 4px;
          }
          .header-left .driver-name {
            font-size: 14px;
            font-weight: 600;
          }
          .header-left .driver-phone {
            font-size: 11px;
            opacity: 0.9;
            margin-top: 2px;
            direction: ltr;
            text-align: left;
          }
          .header-left .date-info {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid rgba(255,255,255,0.3);
          }
          .header-left .date-label {
            font-size: 9px;
            opacity: 0.7;
          }
          .header-left .date-value {
            font-size: 12px;
            font-weight: 600;
          }
          .items-section {
            padding: 15px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid ${theme.light};
            border-radius: 8px;
            overflow: hidden;
          }
          .items-table thead th {
            background: ${theme.primary};
            color: white;
            padding: 10px 8px;
            font-size: 10px;
            font-weight: 600;
            text-align: center;
            border-bottom: 2px solid ${theme.secondary};
          }
          .items-table tbody tr {
            border-bottom: 1px solid ${theme.light};
          }
          .items-table tbody tr:nth-child(even) {
            background: ${theme.light}30;
          }
          .items-table tbody tr:last-child {
            border-bottom: none;
          }
          .items-table td {
            padding: 10px 8px;
            font-size: 11px;
            text-align: center;
            vertical-align: middle;
          }
          .item-cell {
            display: flex;
            align-items: center;
            gap: 8px;
            text-align: right;
          }
          .item-image {
            width: 28px;
            height: 28px;
            min-width: 28px;
            border-radius: 4px;
            object-fit: cover;
            border: 1px solid #ddd;
          }
          .item-image-placeholder {
            width: 28px;
            height: 28px;
            min-width: 28px;
            border-radius: 4px;
            background: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #999;
          }
          .item-details {
            flex: 1;
          }
          .item-name {
            font-weight: 600;
            font-size: 11px;
            color: #1a1a1a;
          }
          .item-brand {
            font-size: 9px;
            color: #888;
          }
          .item-note {
            font-size: 8px;
            color: ${theme.secondary};
            font-style: italic;
            margin-top: 2px;
          }
          .gift-cell {
            color: #16a34a;
            font-weight: 600;
          }
          .price-cell {
            font-family: monospace;
            font-weight: 500;
          }
          .total-cell {
            font-family: monospace;
            font-weight: 700;
            color: ${theme.primary};
          }
          .summary-section {
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            border-top: 2px solid ${theme.light};
          }
          .summary-left {
            flex: 1;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
          .summary-item {
            background: ${theme.light};
            padding: 10px;
            border-radius: 8px;
            text-align: center;
          }
          .summary-item .label {
            font-size: 9px;
            color: #666;
            margin-bottom: 4px;
          }
          .summary-item .value {
            font-size: 16px;
            font-weight: 700;
            color: ${theme.primary};
          }
          .grand-total-box {
            background: ${theme.primary};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            text-align: center;
            min-width: 150px;
          }
          .grand-total-box .label {
            font-size: 10px;
            opacity: 0.9;
            margin-bottom: 4px;
          }
          .grand-total-box .value {
            font-size: 22px;
            font-weight: 700;
            font-family: monospace;
          }
          .grand-total-box .currency {
            font-size: 11px;
            opacity: 0.9;
          }
          .invoice-footer {
            padding: 15px 20px;
            background: ${theme.light};
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .footer-thanks {
            font-size: 10px;
            color: #666;
          }
          .signature-area {
            text-align: center;
          }
          .signature-line {
            width: 120px;
            border-bottom: 1px solid #333;
            height: 30px;
            margin-bottom: 4px;
          }
          .signature-label {
            font-size: 9px;
            color: #666;
          }
          .qr-section {
            text-align: center;
          }
          .qr-box {
            background: white;
            padding: 6px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid #e5e5e5;
            display: inline-block;
          }
          .qr-label {
            font-size: 7px;
            color: #999;
            margin-top: 4px;
          }
          @media print { 
            body { padding: 10px; }
            .invoice-container { border-width: 1px; }
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
            className="bg-white text-black overflow-hidden shadow-lg"
          >
            <div className="invoice-container" style={{ border: `2px solid ${theme.primary}`, borderRadius: '12px', overflow: 'hidden' }}>
              {/* Professional Header - 3 columns */}
              <div 
                className="flex justify-between items-start gap-4 p-4 sm:p-5 text-white"
                style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
              >
                {/* Right side - Customer Info */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[9px] sm:text-[10px] opacity-80 mb-1">وەرگری کاڵا</p>
                  <p className="text-base sm:text-lg font-bold">{recipientName}</p>
                  {recipientPhone && (
                    <p className="text-[11px] sm:text-xs opacity-90 mt-1" dir="ltr" style={{ textAlign: 'right' }}>{recipientPhone}</p>
                  )}
                </div>

                {/* Center - Logo & Company */}
                <div className="text-center flex-1">
                  <div 
                    className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full bg-white flex items-center justify-center overflow-hidden"
                    style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
                  >
                    {invoiceSettings.logoUrl ? (
                      <img src={invoiceSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-2xl">🏪</span>
                    )}
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold">{invoiceSettings.companyName}</h1>
                  <p className="text-[10px] sm:text-xs opacity-90 mt-1">پسولەی دەرچوون</p>
                  <span 
                    className="inline-block text-[9px] sm:text-[10px] font-mono bg-white/20 px-3 py-1 rounded-full mt-2"
                  >
                    {invoiceNumber}
                  </span>
                </div>

                {/* Left side - Driver & Date Info */}
                <div className="text-left flex-shrink-0">
                  {(driverName || driverPhone) && (
                    <>
                      <p className="text-[9px] sm:text-[10px] opacity-80 mb-1">مەندوب</p>
                      <p className="text-sm sm:text-base font-semibold">{driverName || '-'}</p>
                      {driverPhone && (
                        <p className="text-[10px] sm:text-xs opacity-90 mt-0.5" dir="ltr">{driverPhone}</p>
                      )}
                    </>
                  )}
                  <div className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                    <p className="text-[8px] sm:text-[9px] opacity-70">بەرواری پسولە</p>
                    <p className="text-[11px] sm:text-xs font-semibold">{movementDate}</p>
                    <p className="text-[8px] opacity-60 mt-1">چاپ: {today}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="p-3 sm:p-4">
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full border-collapse min-w-[500px]" style={{ border: `1px solid ${theme.light}`, borderRadius: '8px', overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ backgroundColor: theme.primary }}>
                        <th className="py-2 px-2 text-center text-[9px] sm:text-[10px] font-semibold text-white border-b-2" style={{ borderColor: theme.secondary }}>#</th>
                        <th className="py-2 px-2 text-right text-[9px] sm:text-[10px] font-semibold text-white border-b-2" style={{ borderColor: theme.secondary }}>مادە</th>
                        <th className="py-2 px-2 text-center text-[9px] sm:text-[10px] font-semibold text-white border-b-2" style={{ borderColor: theme.secondary }}>بۆکس</th>
                        <th className="py-2 px-2 text-center text-[9px] sm:text-[10px] font-semibold text-white border-b-2" style={{ borderColor: theme.secondary }}>دانە</th>
                        <th className="py-2 px-2 text-center text-[9px] sm:text-[10px] font-semibold text-white border-b-2" style={{ borderColor: theme.secondary }}>🎁</th>
                        <th className="py-2 px-2 text-center text-[9px] sm:text-[10px] font-semibold text-white border-b-2" style={{ borderColor: theme.secondary }}>نرخ</th>
                        <th className="py-2 px-2 text-center text-[9px] sm:text-[10px] font-semibold text-white border-b-2" style={{ borderColor: theme.secondary }}>کۆ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((cartItem, index) => {
                        const itemTotal = ((cartItem.boxCount || 0) + (cartItem.pieceCount || 0)) * cartItem.price;
                        return (
                          <tr 
                            key={index} 
                            style={{ 
                              backgroundColor: index % 2 === 1 ? `${theme.light}30` : 'transparent',
                              borderBottom: `1px solid ${theme.light}`
                            }}
                          >
                            <td className="py-2 px-2 text-center text-[10px] font-bold text-gray-600">{index + 1}</td>
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-2">
                                {cartItem.item.image_url ? (
                                  <img 
                                    src={cartItem.item.image_url} 
                                    alt={cartItem.item.name}
                                    style={{ width: '26px', height: '26px', minWidth: '26px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #ddd' }}
                                  />
                                ) : (
                                  <div style={{ width: '26px', height: '26px', minWidth: '26px', borderRadius: '4px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}>📦</div>
                                )}
                                <div style={{ flex: 1 }}>
                                  <div className="font-semibold text-[10px] sm:text-[11px] text-black">{cartItem.item.name}</div>
                                  {cartItem.item.brands && (
                                    <div className="text-[8px] text-gray-500">{cartItem.item.brands.name}</div>
                                  )}
                                  {cartItem.note && (
                                    <div className="text-[7px] italic mt-0.5" style={{ color: theme.secondary }}>📝 {cartItem.note}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center font-semibold text-[10px]">{cartItem.boxCount || '-'}</td>
                            <td className="py-2 px-2 text-center font-semibold text-[10px]">{cartItem.pieceCount || '-'}</td>
                            <td className="py-2 px-2 text-center font-semibold text-[10px] text-green-600">{cartItem.giftQuantity || '-'}</td>
                            <td className="py-2 px-2 text-center font-mono text-[10px]" dir="ltr">{cartItem.price.toLocaleString()}</td>
                            <td className="py-2 px-2 text-center font-mono font-bold text-[10px]" dir="ltr" style={{ color: theme.primary }}>{itemTotal.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Section */}
              <div className="p-3 sm:p-4 flex flex-wrap justify-between items-start gap-3" style={{ borderTop: `2px solid ${theme.light}` }}>
                {/* Left - Summary Grid */}
                <div className="flex gap-2 flex-wrap flex-1">
                  <div className="text-center px-4 py-2 rounded-lg" style={{ backgroundColor: theme.light }}>
                    <p className="text-[8px] text-gray-500 mb-1">کۆی بۆکس</p>
                    <p className="text-lg font-bold" style={{ color: theme.primary }}>{totalBoxes}</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-lg" style={{ backgroundColor: theme.light }}>
                    <p className="text-[8px] text-gray-500 mb-1">کۆی دانە</p>
                    <p className="text-lg font-bold" style={{ color: theme.primary }}>{totalPieces}</p>
                  </div>
                  {totalGifts > 0 && (
                    <div className="text-center px-4 py-2 rounded-lg" style={{ backgroundColor: theme.light }}>
                      <p className="text-[8px] text-gray-500 mb-1">🎁 هەدیە</p>
                      <p className="text-lg font-bold text-green-600">{totalGifts}</p>
                    </div>
                  )}
                  <div className="text-center px-4 py-2 rounded-lg" style={{ backgroundColor: theme.light }}>
                    <p className="text-[8px] text-gray-500 mb-1">ژمارەی مادە</p>
                    <p className="text-lg font-bold" style={{ color: theme.primary }}>{cartItems.length}</p>
                  </div>
                </div>

                {/* Right - Grand Total */}
                <div 
                  className="text-center px-5 py-3 rounded-xl text-white"
                  style={{ backgroundColor: theme.primary }}
                >
                  <p className="text-[9px] opacity-90 mb-1">کۆی گشتی</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono" dir="ltr">{totalPrice.toLocaleString()}</p>
                  <p className="text-[10px] opacity-90">دینار</p>
                </div>
              </div>

              {/* Footer with QR Code */}
              <div className="p-3 sm:p-4 flex justify-between items-end" style={{ backgroundColor: theme.light }}>
                <div className="text-[9px] text-gray-500">
                  <p>✨ سوپاس بۆ هاوکاریکردنتان</p>
                  <p className="mt-0.5">{invoiceSettings.companyName}</p>
                </div>
                
                {/* QR Code */}
                <div className="text-center">
                  <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-200">
                    <QRCodeSVG 
                      value={qrData} 
                      size={60}
                      level="M"
                      fgColor={theme.primary}
                    />
                  </div>
                  <p className="text-[7px] text-gray-400 mt-1">زانیاری پسولە</p>
                </div>

                <div className="text-center">
                  <div className="w-28 h-8 border-b border-gray-400 mb-1"></div>
                  <p className="text-[8px] text-gray-500">واژووی وەرگر</p>
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
