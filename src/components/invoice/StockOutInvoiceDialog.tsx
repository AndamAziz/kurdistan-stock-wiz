import { useRef } from "react";
import bakuryLogo from "@/assets/bakury-logo.jpg";
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
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Noto Sans Arabic', sans-serif; 
            direction: rtl; 
            background: #fff;
            color: #1a1a1a;
            font-size: 11px;
            width: 210mm;
            min-height: 297mm;
            padding: 8mm;
          }
          .invoice-container {
            width: 100%;
            border: 3px solid ${theme.primary};
            border-radius: 16px;
            overflow: hidden;
            background: white;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 24px 28px;
            background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});
            color: white;
          }
          .header-right {
            text-align: right;
            min-width: 140px;
          }
          .header-right .customer-label {
            font-size: 10px;
            opacity: 0.85;
            margin-bottom: 6px;
            letter-spacing: 0.5px;
          }
          .header-right .customer-name {
            font-size: 20px;
            font-weight: 700;
            line-height: 1.3;
          }
          .header-right .customer-phone {
            font-size: 13px;
            opacity: 0.95;
            margin-top: 6px;
            direction: ltr;
            text-align: right;
            font-family: monospace;
          }
          .header-center {
            text-align: center;
            flex: 1;
            padding: 0 20px;
          }
          .header-center .logo-placeholder {
            width: 80px;
            height: 80px;
            margin: 0 auto 10px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            box-shadow: 0 6px 20px rgba(0,0,0,0.25);
          }
          .header-center .logo-placeholder img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .header-center .company-name {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .header-center .invoice-type {
            font-size: 13px;
            opacity: 0.9;
            margin-top: 6px;
          }
          .header-center .invoice-number {
            font-size: 11px;
            font-family: monospace;
            background: rgba(255,255,255,0.25);
            padding: 6px 16px;
            border-radius: 20px;
            margin-top: 10px;
            display: inline-block;
            letter-spacing: 1px;
          }
          .header-left {
            text-align: left;
            min-width: 140px;
          }
          .header-left .driver-label {
            font-size: 10px;
            opacity: 0.85;
            margin-bottom: 4px;
          }
          .header-left .driver-name {
            font-size: 16px;
            font-weight: 600;
          }
          .header-left .driver-phone {
            font-size: 12px;
            opacity: 0.9;
            margin-top: 4px;
            direction: ltr;
            text-align: left;
            font-family: monospace;
          }
          .header-left .date-info {
            margin-top: 14px;
            padding-top: 10px;
            border-top: 1px solid rgba(255,255,255,0.35);
          }
          .header-left .date-label {
            font-size: 9px;
            opacity: 0.7;
          }
          .header-left .date-value {
            font-size: 13px;
            font-weight: 600;
            font-family: monospace;
          }
          .items-section {
            padding: 20px 24px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid ${theme.primary};
            border-radius: 12px;
            overflow: hidden;
          }
          .items-table thead th {
            background: linear-gradient(180deg, ${theme.primary}, ${theme.secondary});
            color: white;
            padding: 14px 10px;
            font-size: 12px;
            font-weight: 700;
            text-align: center;
            border-bottom: 3px solid ${theme.secondary};
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .items-table tbody tr {
            border-bottom: 1.5px solid ${theme.light};
            transition: background 0.2s;
          }
          .items-table tbody tr:nth-child(even) {
            background: ${theme.light}40;
          }
          .items-table tbody tr:last-child {
            border-bottom: none;
          }
          .items-table td {
            padding: 12px 10px;
            font-size: 12px;
            text-align: center;
            vertical-align: middle;
          }
          .item-cell {
            display: flex;
            align-items: center;
            gap: 12px;
            text-align: right;
          }
          .item-image {
            width: 48px;
            height: 48px;
            min-width: 48px;
            border-radius: 8px;
            object-fit: cover;
            border: 2px solid ${theme.light};
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .item-image-placeholder {
            width: 48px;
            height: 48px;
            min-width: 48px;
            border-radius: 8px;
            background: linear-gradient(135deg, #f5f5f5, #e5e5e5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: #aaa;
            border: 2px solid ${theme.light};
          }
          .item-details {
            flex: 1;
          }
          .item-name {
            font-weight: 700;
            font-size: 14px;
            color: #1a1a1a;
            margin-bottom: 3px;
          }
          .item-brand {
            font-size: 10px;
            color: #666;
            font-weight: 500;
          }
          .item-id {
            font-size: 9px;
            color: ${theme.secondary};
            font-family: monospace;
            margin-top: 2px;
          }
          .item-note {
            font-size: 9px;
            color: ${theme.secondary};
            font-style: italic;
            margin-top: 4px;
            background: ${theme.light}50;
            padding: 3px 6px;
            border-radius: 4px;
            display: inline-block;
          }
          .qty-cell {
            font-weight: 700;
            font-size: 14px;
            color: #333;
          }
          .gift-cell {
            color: #16a34a;
            font-weight: 700;
            font-size: 14px;
          }
          .price-cell {
            font-family: monospace;
            font-weight: 600;
            font-size: 12px;
            color: #555;
          }
          .total-cell {
            font-family: monospace;
            font-weight: 800;
            font-size: 14px;
            color: ${theme.primary};
          }
          .summary-section {
            padding: 20px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 24px;
            border-top: 3px solid ${theme.light};
            background: ${theme.light}20;
          }
          .summary-left {
            flex: 1;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          .summary-item {
            background: white;
            padding: 12px 18px;
            border-radius: 10px;
            text-align: center;
            border: 2px solid ${theme.light};
            min-width: 80px;
          }
          .summary-item .label {
            font-size: 10px;
            color: #666;
            margin-bottom: 6px;
            font-weight: 500;
          }
          .summary-item .value {
            font-size: 20px;
            font-weight: 800;
            color: ${theme.primary};
          }
          .grand-total-box {
            background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});
            color: white;
            padding: 18px 32px;
            border-radius: 14px;
            text-align: center;
            min-width: 180px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          }
          .grand-total-box .label {
            font-size: 11px;
            opacity: 0.95;
            margin-bottom: 6px;
            font-weight: 500;
          }
          .grand-total-box .value {
            font-size: 28px;
            font-weight: 800;
            font-family: monospace;
          }
          .grand-total-box .currency {
            font-size: 12px;
            opacity: 0.9;
            margin-top: 4px;
          }
          .invoice-footer {
            padding: 18px 24px;
            background: ${theme.light};
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 2px solid ${theme.primary}30;
          }
          .footer-thanks {
            font-size: 11px;
            color: #555;
          }
          .signature-area {
            text-align: center;
          }
          .signature-line {
            width: 140px;
            border-bottom: 2px solid #333;
            height: 35px;
            margin-bottom: 6px;
          }
          .signature-label {
            font-size: 10px;
            color: #555;
            font-weight: 500;
          }
          .signature-date {
            margin-top: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
            justify-content: center;
          }
          .signature-date span {
            font-size: 9px;
            color: #666;
          }
          .signature-date-line {
            width: 80px;
            border-bottom: 1px solid #999;
          }
          .qr-section {
            text-align: center;
          }
          .qr-box {
            background: white;
            padding: 8px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border: 2px solid ${theme.light};
            display: inline-block;
          }
          .qr-label {
            font-size: 8px;
            color: #888;
            margin-top: 6px;
          }
          @media print { 
            body { 
              padding: 0;
              width: 100%;
            }
            .invoice-container { 
              border-width: 2px;
            }
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
                      <img src={bakuryLogo} alt="باکوری خۆشەویست" className="w-full h-full object-contain" />
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

              {/* Items Table - A4 Professional Design */}
              <div className="p-4 sm:p-5">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" style={{ border: `2px solid ${theme.primary}`, borderRadius: '12px', overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ background: `linear-gradient(180deg, ${theme.primary}, ${theme.secondary})` }}>
                        <th className="py-3 px-2 text-center text-[10px] sm:text-xs font-bold text-white" style={{ width: '40px' }}>#</th>
                        <th className="py-3 px-2 text-center text-[10px] sm:text-xs font-bold text-white" style={{ width: '60px' }}>وێنە</th>
                        <th className="py-3 px-2 text-center text-[10px] sm:text-xs font-bold text-white" style={{ width: '80px' }}>ئایدی</th>
                        <th className="py-3 px-3 text-right text-[10px] sm:text-xs font-bold text-white">ناوی بەرهەم</th>
                        <th className="py-3 px-2 text-center text-[10px] sm:text-xs font-bold text-white" style={{ width: '70px' }}>عەدەد</th>
                        <th className="py-3 px-2 text-center text-[10px] sm:text-xs font-bold text-white" style={{ width: '60px' }}>🎁</th>
                        <th className="py-3 px-2 text-center text-[10px] sm:text-xs font-bold text-white" style={{ width: '90px' }}>نرخی تاک</th>
                        <th className="py-3 px-2 text-center text-[10px] sm:text-xs font-bold text-white" style={{ width: '100px' }}>کۆی نرخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((cartItem, index) => {
                        const totalQty = (cartItem.boxCount || 0) + (cartItem.pieceCount || 0);
                        const itemTotal = totalQty * cartItem.price;
                        return (
                          <tr 
                            key={index} 
                            style={{ 
                              backgroundColor: index % 2 === 1 ? `${theme.light}40` : 'white',
                              borderBottom: `1.5px solid ${theme.light}`
                            }}
                          >
                            <td className="py-3 px-2 text-center text-sm font-bold" style={{ color: theme.primary }}>{index + 1}</td>
                            <td className="py-3 px-2 text-center">
                              {cartItem.item.image_url ? (
                                <img 
                                  src={cartItem.item.image_url} 
                                  alt={cartItem.item.name}
                                  style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: `2px solid ${theme.light}`, margin: '0 auto', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                                />
                              ) : (
                                <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: `linear-gradient(135deg, #f5f5f5, #e5e5e5)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#aaa', margin: '0 auto', border: `2px solid ${theme.light}` }}>📦</div>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="text-[10px] sm:text-xs font-mono px-2 py-1 rounded" style={{ background: theme.light, color: theme.secondary }}>
                                {cartItem.item.barcode?.slice(-8) || cartItem.item.id.slice(0, 8)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="font-bold text-sm text-black">{cartItem.item.name}</div>
                              {cartItem.item.brands && (
                                <div className="text-[10px] text-gray-500 mt-0.5">{cartItem.item.brands.name}</div>
                              )}
                              {cartItem.note && (
                                <div className="text-[9px] italic mt-1 px-2 py-1 rounded inline-block" style={{ background: `${theme.light}50`, color: theme.secondary }}>📝 {cartItem.note}</div>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <div className="font-bold text-base text-gray-800">{totalQty}</div>
                              {(cartItem.boxCount || 0) > 0 && (cartItem.pieceCount || 0) > 0 && (
                                <div className="text-[8px] text-gray-500 mt-0.5">({cartItem.boxCount}📦 + {cartItem.pieceCount})</div>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center font-bold text-base text-green-600">{cartItem.giftQuantity || '-'}</td>
                            <td className="py-3 px-2 text-center font-mono text-sm font-semibold text-gray-600" dir="ltr">{cartItem.price.toLocaleString()}</td>
                            <td className="py-3 px-2 text-center font-mono text-base font-bold" dir="ltr" style={{ color: theme.primary }}>{itemTotal.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Section - Enhanced A4 */}
              <div className="p-4 sm:p-5 flex flex-wrap justify-between items-center gap-4" style={{ borderTop: `3px solid ${theme.light}`, background: `${theme.light}20` }}>
                {/* Left - Summary Grid */}
                <div className="flex gap-3 flex-wrap flex-1">
                  <div className="text-center px-5 py-3 rounded-xl bg-white" style={{ border: `2px solid ${theme.light}` }}>
                    <p className="text-[9px] text-gray-500 mb-1 font-medium">کۆی بۆکس</p>
                    <p className="text-xl font-extrabold" style={{ color: theme.primary }}>{totalBoxes}</p>
                  </div>
                  <div className="text-center px-5 py-3 rounded-xl bg-white" style={{ border: `2px solid ${theme.light}` }}>
                    <p className="text-[9px] text-gray-500 mb-1 font-medium">کۆی دانە</p>
                    <p className="text-xl font-extrabold" style={{ color: theme.primary }}>{totalPieces}</p>
                  </div>
                  {totalGifts > 0 && (
                    <div className="text-center px-5 py-3 rounded-xl bg-white" style={{ border: `2px solid ${theme.light}` }}>
                      <p className="text-[9px] text-gray-500 mb-1 font-medium">🎁 هەدیە</p>
                      <p className="text-xl font-extrabold text-green-600">{totalGifts}</p>
                    </div>
                  )}
                  <div className="text-center px-5 py-3 rounded-xl bg-white" style={{ border: `2px solid ${theme.light}` }}>
                    <p className="text-[9px] text-gray-500 mb-1 font-medium">ژمارەی مادە</p>
                    <p className="text-xl font-extrabold" style={{ color: theme.primary }}>{cartItems.length}</p>
                  </div>
                </div>

                {/* Right - Grand Total */}
                <div 
                  className="text-center px-7 py-4 rounded-2xl text-white"
                  style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }}
                >
                  <p className="text-[10px] opacity-95 mb-1 font-medium">کۆی گشتی</p>
                  <p className="text-2xl sm:text-3xl font-extrabold font-mono" dir="ltr">{totalPrice.toLocaleString()}</p>
                  <p className="text-[11px] opacity-90 mt-1">دینار</p>
                </div>
              </div>

              {/* Footer with QR Code - Enhanced */}
              <div className="p-4 sm:p-5 flex justify-between items-end" style={{ backgroundColor: theme.light }}>
                <div className="text-[10px] text-gray-600">
                  <p className="font-medium">✨ سوپاس بۆ هاوکاریکردنتان</p>
                  <p className="mt-1 font-semibold" style={{ color: theme.primary }}>{invoiceSettings.companyName}</p>
                </div>
                
                {/* QR Code */}
                <div className="text-center">
                  <div className="bg-white p-2 rounded-xl shadow-sm" style={{ border: `2px solid ${theme.light}` }}>
                    <QRCodeSVG 
                      value={qrData} 
                      size={70}
                      level="M"
                      fgColor={theme.primary}
                    />
                  </div>
                  <p className="text-[8px] text-gray-500 mt-1.5">زانیاری پسولە</p>
                </div>

                <div className="text-center">
                  <div className="w-32 h-9 border-b-2 border-gray-400 mb-1.5"></div>
                  <p className="text-[9px] text-gray-600 font-medium">واژووی وەرگر</p>
                  <div className="mt-2 flex items-center gap-1.5 justify-center">
                    <span className="text-[9px] text-gray-500">بەروار:</span>
                    <div className="w-20 border-b border-gray-400"></div>
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
