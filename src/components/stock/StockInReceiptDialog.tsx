import { useRef } from "react";
import bakuryLogo from "@/assets/bakury-logo.jpg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X, Check } from "lucide-react";
import { ItemWithRelations } from "@/hooks/useItems";

interface StockInReceiptData {
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

interface StockInReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: StockInReceiptData | null;
}

export function StockInReceiptDialog({ 
  open, 
  onOpenChange, 
  receiptData 
}: StockInReceiptDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!receiptData) return null;

  const { item, quantity, itemType, boxCount, pieceCount, giftQuantity, boxPrice, piecePrice, date, note, weight_kg, weight_gram, pricePerKg } = receiptData;
  
  // Calculate total price based on item type
  let totalPrice = 0;
  if (itemType === "beverage") {
    const boxTotal = (boxCount || 0) * (boxPrice || 0);
    const pieceTotal = (pieceCount || 0) * (piecePrice || 0);
    totalPrice = boxTotal + pieceTotal;
  } else {
    // Grocery: price per kg
    const totalKg = (weight_kg || 0) + ((weight_gram || 0) / 1000);
    totalPrice = totalKg * (pricePerKg || 0);
  }

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('تکایە Pop-up بلۆکەر لەکاربخە');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ku">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>پسوڵەی داخڵکردن - ${item.name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            padding: 10px;
            background: white;
            color: #1a1a1a;
            direction: rtl;
            font-size: 12px;
          }
          .receipt {
            max-width: 350px;
            margin: 0 auto;
            border: 2px solid #e5e5e5;
            border-radius: 8px;
            padding: 15px;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #e5e5e5;
            padding-bottom: 12px;
            margin-bottom: 15px;
          }
          .header h1 {
            font-size: 16px;
            color: #10b981;
            margin-bottom: 4px;
          }
          .header p {
            font-size: 10px;
            color: #666;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #f0f0f0;
            font-size: 11px;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            color: #666;
          }
          .info-value {
            font-weight: 600;
            color: #1a1a1a;
          }
          .quantity-box {
            background: #f0fdf4;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            margin: 15px 0;
          }
          .quantity-box .label {
            font-size: 10px;
            color: #666;
            margin-bottom: 4px;
          }
          .quantity-box .value {
            font-size: 24px;
            font-weight: 700;
            color: #10b981;
          }
          .quantity-box .unit {
            font-size: 12px;
            color: #10b981;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 12px;
            border-top: 2px dashed #e5e5e5;
            font-size: 9px;
            color: #999;
          }
          .note {
            background: #fafafa;
            padding: 8px;
            border-radius: 6px;
            margin-top: 12px;
            font-size: 11px;
          }
          .note-label {
            font-weight: 600;
            margin-bottom: 3px;
            color: #666;
          }
          @media print {
            body { padding: 0; font-size: 10px; }
            .receipt { border: none; padding: 5px; max-width: 100%; }
            .header h1 { font-size: 14px; }
            .quantity-box .value { font-size: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <img src="${bakuryLogo}" alt="باکوری خۆشەویست" style="height: 50px; width: 50px; object-fit: contain; margin: 0 auto 8px; border-radius: 8px;" />
            <h1>${itemType === "beverage" ? "🥤" : "🛒"} پسوڵەی داخڵکردن</h1>
            <p>باکوری خۆشەویست - سیستەمی بەڕێوەبردنی کۆگا</p>
          </div>
          
          <div class="info-row">
            <span class="info-label">ناوی مادە:</span>
            <span class="info-value">${item.name}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">جۆر:</span>
            <span class="info-value">${itemType === "beverage" ? "خواردنەوە" : "گرۆسەری"}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">براند:</span>
            <span class="info-value">${item.brands?.name || '-'}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">کەتەگۆری:</span>
            <span class="info-value">${item.categories?.name || '-'}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">باڕکۆد:</span>
            <span class="info-value" style="font-family: monospace; font-size: 10px;">${item.barcode}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">بەرواری داخڵکردن:</span>
            <span class="info-value">${date}</span>
          </div>
          
          ${item.mfg_date ? `
          <div class="info-row">
            <span class="info-label">بەرواری ئنتاج:</span>
            <span class="info-value">${item.mfg_date}</span>
          </div>
          ` : ''}
          
          ${item.exp_date ? `
          <div class="info-row">
            <span class="info-label">بەرواری بەسەرچوون:</span>
            <span class="info-value">${item.exp_date}</span>
          </div>
          ` : ''}
          
          ${itemType === "beverage" && ((boxPrice && boxPrice > 0) || (piecePrice && piecePrice > 0)) ? `
          <div class="info-row">
            <span class="info-label">نرخی کڕین:</span>
            <span class="info-value">
              ${boxPrice && boxPrice > 0 ? `بۆکس: ${boxPrice.toLocaleString()} د.ع` : ''}
              ${boxPrice && piecePrice && boxPrice > 0 && piecePrice > 0 ? ' | ' : ''}
              ${piecePrice && piecePrice > 0 ? `دانە: ${piecePrice.toLocaleString()} د.ع` : ''}
            </span>
          </div>
          ` : ''}
          
          ${itemType === "grocery" && pricePerKg && pricePerKg > 0 ? `
          <div class="info-row">
            <span class="info-label">نرخی کیلۆگرام:</span>
            <span class="info-value">${pricePerKg.toLocaleString()} د.ع</span>
          </div>
          ` : ''}
          
          <div class="quantity-box">
            <div class="label">ژمارەی داخڵکراو</div>
            ${itemType === "beverage" ? `
            <div style="display: flex; justify-content: center; gap: 15px; margin: 8px 0; flex-wrap: wrap;">
              ${boxCount ? `<div><span class="value" style="font-size: 20px;">${boxCount}</span> <span class="unit">بۆکس</span>${boxPrice && boxPrice > 0 ? `<div style="font-size: 9px; color: #666;">${(boxCount * boxPrice).toLocaleString()} د.ع</div>` : ''}</div>` : ''}
              ${pieceCount ? `<div><span class="value" style="font-size: 20px;">${pieceCount}</span> <span class="unit">دانە</span>${piecePrice && piecePrice > 0 ? `<div style="font-size: 9px; color: #666;">${(pieceCount * piecePrice).toLocaleString()} د.ع</div>` : ''}</div>` : ''}
              ${giftQuantity ? `<div><span class="value" style="font-size: 20px;">${giftQuantity}</span> <span class="unit">🎁 هەدیە</span></div>` : ''}
            </div>
            <div style="font-size: 11px; color: #666; margin-top: 5px;">کۆی گشتی: ${quantity} ${item.unit}</div>
            ` : `
            <div style="margin: 8px 0;">
              <span class="value">${weight_kg || 0}</span> <span class="unit">کیلۆگرام</span>
              ${weight_gram ? ` و <span class="value" style="font-size: 18px;">${weight_gram}</span> <span class="unit">گرام</span>` : ''}
            </div>
            `}
            ${totalPrice > 0 ? `<div style="margin-top: 8px; font-size: 14px; color: #059669; font-weight: bold;">کۆی نرخ: ${Math.round(totalPrice).toLocaleString()} د.ع</div>` : ''}
          </div>
          
          ${note ? `
          <div class="note">
            <div class="note-label">تێبینی:</div>
            <div>${note}</div>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>چاپکرا لە: ${new Date().toLocaleString('ku')}</p>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-success text-base sm:text-lg">
            <Check className="h-4 w-4 sm:h-5 sm:w-5" />
            مادەکە بە سەرکەوتوویی داخڵکرا
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="space-y-3">
          {/* Item Info */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-xs text-muted-foreground">ناوی مادە:</span>
              <span className="font-semibold text-foreground text-sm">{item.name}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-xs text-muted-foreground">جۆر:</span>
              <span className="font-medium text-foreground text-sm">
                {itemType === "beverage" ? "🥤 خواردنەوە" : "🛒 گرۆسەری"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-xs text-muted-foreground">براند:</span>
              <span className="font-medium text-foreground text-sm">{item.brands?.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-xs text-muted-foreground">کەتەگۆری:</span>
              <span className="font-medium text-foreground text-sm">{item.categories?.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-xs text-muted-foreground">باڕکۆد:</span>
              <span className="font-mono text-xs text-muted-foreground">{item.barcode}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-xs text-muted-foreground">بەرواری داخڵکردن:</span>
              <span className="font-medium text-foreground text-sm">{date}</span>
            </div>
            {item.mfg_date && (
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-xs text-muted-foreground">بەرواری ئنتاج:</span>
                <span className="font-medium text-foreground text-sm">{item.mfg_date}</span>
              </div>
            )}
            {item.exp_date && (
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-muted-foreground">بەرواری بەسەرچوون:</span>
                <span className="font-medium text-foreground text-sm">{item.exp_date}</span>
              </div>
            )}
          </div>

          {/* Price Info */}
          {itemType === "beverage" && ((boxPrice && boxPrice > 0) || (piecePrice && piecePrice > 0)) && (
            <div className="flex justify-between items-center py-1 border-b border-border/50 text-sm">
              <span className="text-xs text-muted-foreground">نرخی کڕین:</span>
              <span className="font-medium text-foreground text-xs">
                {boxPrice && boxPrice > 0 && `بۆکس: ${boxPrice.toLocaleString()} د.ع`}
                {boxPrice && piecePrice && boxPrice > 0 && piecePrice > 0 && ' | '}
                {piecePrice && piecePrice > 0 && `دانە: ${piecePrice.toLocaleString()} د.ع`}
              </span>
            </div>
          )}
          
          {itemType === "grocery" && pricePerKg && pricePerKg > 0 && (
            <div className="flex justify-between items-center py-1 border-b border-border/50 text-sm">
              <span className="text-xs text-muted-foreground">نرخی کیلۆگرام:</span>
              <span className="font-medium text-foreground text-sm">{pricePerKg.toLocaleString()} د.ع</span>
            </div>
          )}

          {/* Quantity Box */}
          <div className="rounded-lg border-2 border-success bg-success/5 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-2">ژمارەی داخڵکراو</p>
            
            {itemType === "beverage" ? (
              <>
                <div className="flex justify-center gap-3 flex-wrap">
                  {boxCount ? (
                    <div>
                      <p className="text-xl font-bold text-success">{boxCount}</p>
                      <p className="text-xs text-success">بۆکس</p>
                      {boxPrice && boxPrice > 0 && (
                        <p className="text-[9px] text-muted-foreground">{(boxCount * boxPrice).toLocaleString()} د.ع</p>
                      )}
                    </div>
                  ) : null}
                  {pieceCount ? (
                    <div>
                      <p className="text-xl font-bold text-success">{pieceCount}</p>
                      <p className="text-xs text-success">دانە</p>
                      {piecePrice && piecePrice > 0 && (
                        <p className="text-[9px] text-muted-foreground">{(pieceCount * piecePrice).toLocaleString()} د.ع</p>
                      )}
                    </div>
                  ) : null}
                  {giftQuantity ? (
                    <div>
                      <p className="text-xl font-bold text-success">{giftQuantity}</p>
                      <p className="text-xs text-success">🎁 هەدیە</p>
                    </div>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground mt-2">کۆی گشتی: {quantity} {item.unit}</p>
              </>
            ) : (
              <div>
                <p className="text-2xl font-bold text-success">
                  {weight_kg || 0} <span className="text-sm">کیلۆگرام</span>
                  {weight_gram ? <span className="text-base"> و {weight_gram} گرام</span> : null}
                </p>
              </div>
            )}
            
            {totalPrice > 0 && (
              <div className="mt-2 pt-2 border-t border-success/20">
                <p className="text-xs text-muted-foreground">کۆی نرخ</p>
                <p className="text-lg font-bold text-success" dir="ltr">{Math.round(totalPrice).toLocaleString()} د.ع</p>
              </div>
            )}
          </div>

          {/* Note */}
          {note && (
            <div className="rounded-lg bg-muted/50 p-2.5">
              <p className="text-xs text-muted-foreground mb-1">تێبینی:</p>
              <p className="text-sm text-foreground">{note}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 gap-1.5 text-sm h-10"
          >
            <X className="h-4 w-4" />
            داخستن
          </Button>
          <Button 
            onClick={handlePrint}
            className="flex-1 gap-1.5 bg-success hover:bg-success/90 text-sm h-10"
          >
            <Printer className="h-4 w-4" />
            پرێنت
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}