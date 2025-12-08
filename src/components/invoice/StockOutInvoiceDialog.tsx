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
            padding: 15px; 
            direction: rtl; 
            background: #fff;
            color: #1a1a1a;
            font-size: 11px;
          }
          .invoice-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
          }
          .header-band {
            background: ${theme.primary};
            height: 8px;
            border-radius: 4px 4px 0 0;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border: 1px solid #e5e5e5;
            border-top: none;
          }
          .header-right {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-box {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            overflow: hidden;
            border: 2px solid ${theme.primary};
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
          }
          .logo-box img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .company-info h1 {
            font-size: 22px;
            font-weight: 700;
            color: ${theme.primary};
            margin: 0;
          }
          .company-info p {
            font-size: 11px;
            color: #666;
            margin-top: 2px;
          }
          .header-left {
            text-align: left;
            font-size: 10px;
            color: #666;
          }
          .header-left .contact-item {
            display: flex;
            align-items: center;
            gap: 4px;
            justify-content: flex-end;
            margin-bottom: 3px;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            padding: 12px 20px;
            border: 1px solid #e5e5e5;
            border-top: none;
            background: #fafafa;
          }
          .info-right {
            text-align: right;
          }
          .info-right .label {
            font-size: 9px;
            color: #888;
          }
          .info-right .inv-number {
            font-size: 14px;
            font-weight: 700;
            color: ${theme.primary};
          }
          .info-right .inv-date {
            font-size: 11px;
            color: #444;
            margin-top: 2px;
          }
          .info-left {
            text-align: left;
            padding: 8px 12px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e5e5e5;
          }
          .info-left .customer-label {
            font-size: 9px;
            color: #888;
            margin-bottom: 2px;
          }
          .info-left .customer-name {
            font-size: 14px;
            font-weight: 700;
            color: #1a1a1a;
          }
          .info-left .customer-phone {
            font-size: 11px;
            color: #666;
            direction: ltr;
            text-align: left;
          }
          .info-left .customer-address {
            font-size: 10px;
            color: #888;
            margin-top: 2px;
          }
          .driver-section {
            display: flex;
            gap: 20px;
            padding: 8px 20px;
            border: 1px solid #e5e5e5;
            border-top: none;
            font-size: 10px;
          }
          .driver-section .driver-item {
            display: flex;
            gap: 8px;
          }
          .driver-section .driver-label {
            color: #888;
          }
          .driver-section .driver-value {
            font-weight: 600;
            color: #333;
          }
          .table-header-label {
            background: ${theme.light};
            padding: 8px 20px;
            font-size: 11px;
            font-weight: 600;
            color: ${theme.primary};
            border: 1px solid #e5e5e5;
            border-top: none;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e5e5e5;
            border-top: none;
          }
          .items-table thead th {
            background: ${theme.primary};
            color: white;
            padding: 8px 6px;
            font-size: 9px;
            font-weight: 600;
            text-align: center;
            border-left: 1px solid rgba(255,255,255,0.2);
          }
          .items-table thead th:last-child {
            border-left: none;
          }
          .items-table tbody tr {
            border-bottom: 1px solid #eee;
          }
          .items-table tbody tr:nth-child(even) {
            background: #fafafa;
          }
          .items-table td {
            padding: 6px;
            font-size: 10px;
            text-align: center;
            vertical-align: middle;
            border-left: 1px solid #f0f0f0;
          }
          .items-table td:last-child {
            border-left: none;
          }
          .item-cell {
            display: flex;
            align-items: center;
            gap: 8px;
            text-align: right;
          }
          .item-image {
            width: 32px;
            height: 32px;
            min-width: 32px;
            border-radius: 4px;
            object-fit: cover;
            border: 1px solid #ddd;
          }
          .item-image-placeholder {
            width: 32px;
            height: 32px;
            min-width: 32px;
            border-radius: 4px;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          }
          .item-name {
            font-weight: 600;
            font-size: 10px;
            color: #1a1a1a;
          }
          .item-brand {
            font-size: 8px;
            color: #888;
          }
          .item-note {
            font-size: 8px;
            color: ${theme.secondary};
            font-style: italic;
          }
          .barcode-cell {
            font-family: monospace;
            font-size: 9px;
            color: #666;
          }
          .gift-cell {
            color: #16a34a;
            font-weight: 600;
          }
          .price-cell {
            font-family: monospace;
            font-size: 10px;
          }
          .total-cell {
            font-family: monospace;
            font-weight: 700;
            color: ${theme.primary};
          }
          .check-cell {
            color: ${theme.primary};
          }
          .row-number {
            font-weight: 700;
            color: #999;
            font-size: 10px;
          }
          .summary-section {
            display: flex;
            justify-content: space-between;
            padding: 12px 20px;
            border: 1px solid #e5e5e5;
            border-top: none;
            background: #fafafa;
          }
          .summary-boxes {
            display: flex;
            gap: 15px;
          }
          .summary-box {
            text-align: center;
            padding: 8px 15px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e5e5e5;
          }
          .summary-box .label {
            font-size: 9px;
            color: #888;
          }
          .summary-box .value {
            font-size: 18px;
            font-weight: 700;
            color: ${theme.primary};
          }
          .grand-total-box {
            background: ${theme.primary};
            color: white;
            padding: 12px 25px;
            border-radius: 10px;
            text-align: center;
          }
          .grand-total-box .label {
            font-size: 10px;
            opacity: 0.9;
          }
          .grand-total-box .value {
            font-size: 24px;
            font-weight: 700;
            font-family: monospace;
          }
          .grand-total-box .currency {
            font-size: 11px;
            opacity: 0.9;
          }
          .footer-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 15px 20px;
            border: 1px solid #e5e5e5;
            border-top: none;
            border-radius: 0 0 4px 4px;
          }
          .footer-thanks {
            font-size: 10px;
            color: #666;
          }
          .qr-section {
            text-align: center;
          }
          .qr-box {
            background: white;
            padding: 6px;
            border-radius: 6px;
            border: 1px solid #e5e5e5;
            display: inline-block;
          }
          .qr-label {
            font-size: 7px;
            color: #999;
            margin-top: 3px;
          }
          .signature-area {
            text-align: center;
          }
          .signature-line {
            width: 120px;
            border-bottom: 1px solid #999;
            height: 25px;
            margin-bottom: 4px;
          }
          .signature-label {
            font-size: 9px;
            color: #666;
          }
          .signature-date {
            font-size: 8px;
            color: #999;
            margin-top: 5px;
          }
          @media print { 
            body { padding: 8px; }
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
            <div className="invoice-container">
              {/* Top Color Band */}
              <div className="header-band" style={{ background: theme.primary, height: '8px', borderRadius: '4px 4px 0 0' }}></div>
              
              {/* Company Header */}
              <div className="flex justify-between items-center p-3 sm:p-4 border border-gray-200 border-t-0">
                {/* Right - Logo & Company Name */}
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden flex items-center justify-center bg-white"
                    style={{ border: `2px solid ${theme.primary}` }}
                  >
                    {invoiceSettings.logoUrl ? (
                      <img src={invoiceSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-2xl">🏪</span>
                    )}
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold" style={{ color: theme.primary }}>{invoiceSettings.companyName}</h1>
                    <p className="text-[10px] text-gray-500">کۆمپانیای باشترین</p>
                  </div>
                </div>
                
                {/* Left - Contact Info */}
                <div className="text-left text-[9px] sm:text-[10px] text-gray-600">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <span>📧 info@company.com</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <span>📞 0750-000-0000</span>
                  </div>
                </div>
              </div>

              {/* Invoice Info Section */}
              <div className="flex justify-between items-center p-3 sm:p-4 border border-gray-200 border-t-0 bg-gray-50">
                {/* Right - Invoice Number & Date */}
                <div>
                  <p className="text-[8px] text-gray-500">ژمارەی پسولە</p>
                  <p className="text-sm sm:text-base font-bold" style={{ color: theme.primary }}>فرۆشتن #{invoiceNumber}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{movementDate}</p>
                </div>
                
                {/* Left - Customer Info */}
                <div className="text-left p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-[8px] text-gray-500 mb-1">وەرگری کاڵا</p>
                  <p className="text-sm sm:text-base font-bold text-gray-900">{recipientName}</p>
                  {recipientPhone && (
                    <p className="text-[10px] text-gray-600" dir="ltr">{recipientPhone}</p>
                  )}
                </div>
              </div>

              {/* Driver Info */}
              {(driverName || driverPhone) && (
                <div className="flex gap-4 sm:gap-6 p-2 sm:p-3 border border-gray-200 border-t-0 text-[9px] sm:text-[10px]">
                  <div className="flex gap-2">
                    <span className="text-gray-500">🚗 مەندوب:</span>
                    <span className="font-semibold text-gray-800">{driverName || '-'}</span>
                  </div>
                  {driverPhone && (
                    <div className="flex gap-2">
                      <span className="text-gray-500">📞</span>
                      <span className="font-semibold text-gray-800" dir="ltr">{driverPhone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Table Section Label */}
              <div className="p-2 sm:p-3 border border-gray-200 border-t-0 text-[10px] font-semibold" style={{ background: theme.light, color: theme.primary }}>
                سیستەمی بۆسکە
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 border-t-0 min-w-[600px]">
                  <thead>
                    <tr style={{ backgroundColor: theme.primary }}>
                      <th className="py-2 px-2 text-center text-[8px] sm:text-[9px] font-semibold text-white border-l border-white/20">کۆ</th>
                      <th className="py-2 px-2 text-center text-[8px] sm:text-[9px] font-semibold text-white border-l border-white/20">نرخ د.ع</th>
                      <th className="py-2 px-2 text-center text-[8px] sm:text-[9px] font-semibold text-white border-l border-white/20">🎁</th>
                      <th className="py-2 px-2 text-center text-[8px] sm:text-[9px] font-semibold text-white border-l border-white/20">دانە</th>
                      <th className="py-2 px-2 text-center text-[8px] sm:text-[9px] font-semibold text-white border-l border-white/20">بۆکس</th>
                      <th className="py-2 px-2 text-right text-[8px] sm:text-[9px] font-semibold text-white border-l border-white/20">ناوی مادە</th>
                      <th className="py-2 px-2 text-center text-[8px] sm:text-[9px] font-semibold text-white border-l border-white/20">بارکۆد</th>
                      <th className="py-2 px-2 text-center text-[8px] sm:text-[9px] font-semibold text-white border-l border-white/20">وێنە</th>
                      <th className="py-2 px-2 text-center text-[8px] sm:text-[9px] font-semibold text-white w-8">#</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((cartItem, index) => {
                      const itemTotal = ((cartItem.boxCount || 0) + (cartItem.pieceCount || 0)) * cartItem.price;
                      return (
                        <tr 
                          key={index} 
                          style={{ 
                            backgroundColor: index % 2 === 1 ? '#fafafa' : 'white',
                          }}
                          className="border-b border-gray-100"
                        >
                          <td className="py-2 px-2 text-center font-mono font-bold text-[9px] sm:text-[10px] border-l border-gray-100" style={{ color: theme.primary }} dir="ltr">
                            {itemTotal.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-[9px] sm:text-[10px] border-l border-gray-100" dir="ltr">
                            {cartItem.price.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-center font-semibold text-[9px] sm:text-[10px] text-green-600 border-l border-gray-100">
                            {cartItem.giftQuantity || '-'}
                          </td>
                          <td className="py-2 px-2 text-center font-semibold text-[9px] sm:text-[10px] border-l border-gray-100">
                            {cartItem.pieceCount || '-'}
                          </td>
                          <td className="py-2 px-2 text-center font-semibold text-[9px] sm:text-[10px] border-l border-gray-100">
                            {cartItem.boxCount || '-'}
                          </td>
                          <td className="py-2 px-2 text-right border-l border-gray-100">
                            <div>
                              <div className="font-semibold text-[9px] sm:text-[10px] text-black">{cartItem.item.name}</div>
                              {cartItem.item.brands && (
                                <div className="text-[7px] sm:text-[8px] text-gray-500">{cartItem.item.brands.name}</div>
                              )}
                              {cartItem.note && (
                                <div className="text-[7px] italic mt-0.5" style={{ color: theme.secondary }}>📝 {cartItem.note}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-[8px] sm:text-[9px] text-gray-500 border-l border-gray-100">
                            {cartItem.item.barcode || '-'}
                          </td>
                          <td className="py-2 px-2 text-center border-l border-gray-100">
                            {cartItem.item.image_url ? (
                              <img 
                                src={cartItem.item.image_url} 
                                alt={cartItem.item.name}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded object-cover border border-gray-200 mx-auto"
                              />
                            ) : (
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-gray-100 flex items-center justify-center text-[10px] mx-auto">📦</div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-[9px] sm:text-[10px] text-gray-400 w-8">
                            {index + 1}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div className="flex flex-wrap justify-between items-center gap-3 p-3 sm:p-4 border border-gray-200 border-t-0 bg-gray-50">
                {/* Summary Boxes */}
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                  <div className="text-center px-3 sm:px-4 py-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-[7px] sm:text-[8px] text-gray-500">کۆی بۆکس</p>
                    <p className="text-base sm:text-lg font-bold" style={{ color: theme.primary }}>{totalBoxes}</p>
                  </div>
                  <div className="text-center px-3 sm:px-4 py-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-[7px] sm:text-[8px] text-gray-500">کۆی دانە</p>
                    <p className="text-base sm:text-lg font-bold" style={{ color: theme.primary }}>{totalPieces}</p>
                  </div>
                  {totalGifts > 0 && (
                    <div className="text-center px-3 sm:px-4 py-2 bg-white rounded-lg border border-gray-200">
                      <p className="text-[7px] sm:text-[8px] text-gray-500">🎁 هەدیە</p>
                      <p className="text-base sm:text-lg font-bold text-green-600">{totalGifts}</p>
                    </div>
                  )}
                  <div className="text-center px-3 sm:px-4 py-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-[7px] sm:text-[8px] text-gray-500">ژمارەی مادە</p>
                    <p className="text-base sm:text-lg font-bold" style={{ color: theme.primary }}>{cartItems.length}</p>
                  </div>
                </div>

                {/* Grand Total */}
                <div 
                  className="text-center px-5 sm:px-6 py-2 sm:py-3 rounded-xl text-white"
                  style={{ backgroundColor: theme.primary }}
                >
                  <p className="text-[8px] sm:text-[9px] opacity-90">کۆی گشتی</p>
                  <p className="text-lg sm:text-2xl font-bold font-mono" dir="ltr">{totalPrice.toLocaleString()}</p>
                  <p className="text-[9px] sm:text-[10px] opacity-90">دینار</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-end p-3 sm:p-4 border border-gray-200 border-t-0 rounded-b">
                {/* Thanks Message */}
                <div className="text-[8px] sm:text-[9px] text-gray-500">
                  <p>✨ سوپاس بۆ هاوکاریکردنتان</p>
                  <p className="mt-0.5">{invoiceSettings.companyName}</p>
                </div>
                
                {/* QR Code */}
                <div className="text-center">
                  <div className="bg-white p-1 sm:p-1.5 rounded-lg border border-gray-200 inline-block">
                    <QRCodeSVG 
                      value={qrData} 
                      size={50}
                      level="M"
                      fgColor={theme.primary}
                    />
                  </div>
                  <p className="text-[6px] sm:text-[7px] text-gray-400 mt-1">زانیاری پسولە</p>
                </div>

                {/* Signature */}
                <div className="text-center">
                  <div className="w-24 sm:w-28 h-6 sm:h-7 border-b border-gray-400 mb-1"></div>
                  <p className="text-[7px] sm:text-[8px] text-gray-500">واژووی وەرگر</p>
                  <div className="mt-1 flex items-center gap-1 justify-center">
                    <span className="text-[7px] sm:text-[8px] text-gray-400">بەروار:</span>
                    <div className="w-12 sm:w-16 border-b border-gray-300"></div>
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
