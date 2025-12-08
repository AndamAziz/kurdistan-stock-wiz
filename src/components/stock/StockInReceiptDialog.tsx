import { useRef } from "react";
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
  date: string;
  note?: string;
  weight_kg?: number;
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

  const { item, quantity, date, note, weight_kg } = receiptData;

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
            padding: 20px;
            background: white;
            color: #1a1a1a;
            direction: rtl;
          }
          .receipt {
            max-width: 400px;
            margin: 0 auto;
            border: 2px solid #e5e5e5;
            border-radius: 12px;
            padding: 24px;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #e5e5e5;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 20px;
            color: #10b981;
            margin-bottom: 4px;
          }
          .header p {
            font-size: 12px;
            color: #666;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            color: #666;
            font-size: 13px;
          }
          .info-value {
            font-weight: 600;
            font-size: 14px;
            color: #1a1a1a;
          }
          .quantity-box {
            background: #f0fdf4;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
            margin: 20px 0;
          }
          .quantity-box .label {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
          }
          .quantity-box .value {
            font-size: 32px;
            font-weight: 700;
            color: #10b981;
          }
          .quantity-box .unit {
            font-size: 14px;
            color: #10b981;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 16px;
            border-top: 2px dashed #e5e5e5;
            font-size: 11px;
            color: #999;
          }
          .note {
            background: #fafafa;
            padding: 12px;
            border-radius: 8px;
            margin-top: 16px;
            font-size: 13px;
          }
          .note-label {
            font-weight: 600;
            margin-bottom: 4px;
            color: #666;
          }
          @media print {
            body { padding: 0; }
            .receipt { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>📦 پسوڵەی داخڵکردن</h1>
            <p>باکوری خۆشەویست - سیستەمی بەڕێوەبردنی کۆگا</p>
          </div>
          
          <div class="info-row">
            <span class="info-label">ناوی مادە:</span>
            <span class="info-value">${item.name}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">براند:</span>
            <span class="info-value">${item.brands?.name || '-'}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">هاوپۆل:</span>
            <span class="info-value">${item.categories?.name || '-'}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">باڕکۆد:</span>
            <span class="info-value" style="font-family: monospace;">${item.barcode}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">یەکە:</span>
            <span class="info-value">${item.unit}</span>
          </div>
          
          ${weight_kg ? `
          <div class="info-row">
            <span class="info-label">کێش:</span>
            <span class="info-value">${weight_kg} کیلۆگرام</span>
          </div>
          ` : ''}
          
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
          
          <div class="quantity-box">
            <div class="label">ژمارەی داخڵکراو</div>
            <div class="value">${quantity}</div>
            <div class="unit">${item.unit}</div>
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-success">
            <Check className="h-5 w-5" />
            مادەکە بە سەرکەوتوویی داخڵکرا
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="space-y-4">
          {/* Item Info */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-sm text-muted-foreground">ناوی مادە:</span>
              <span className="font-semibold text-foreground">{item.name}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-sm text-muted-foreground">براند:</span>
              <span className="font-medium text-foreground">{item.brands?.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-sm text-muted-foreground">هاوپۆل:</span>
              <span className="font-medium text-foreground">{item.categories?.name || '-'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-sm text-muted-foreground">باڕکۆد:</span>
              <span className="font-mono text-sm text-muted-foreground">{item.barcode}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-sm text-muted-foreground">یەکە:</span>
              <span className="font-medium text-foreground">{item.unit}</span>
            </div>
            {weight_kg && (
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-sm text-muted-foreground">کێش:</span>
                <span className="font-medium text-foreground">{weight_kg} کیلۆگرام</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-sm text-muted-foreground">بەرواری داخڵکردن:</span>
              <span className="font-medium text-foreground">{date}</span>
            </div>
            {item.mfg_date && (
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-sm text-muted-foreground">بەرواری ئنتاج:</span>
                <span className="font-medium text-foreground">{item.mfg_date}</span>
              </div>
            )}
            {item.exp_date && (
              <div className="flex justify-between items-center py-1">
                <span className="text-sm text-muted-foreground">بەرواری بەسەرچوون:</span>
                <span className="font-medium text-foreground">{item.exp_date}</span>
              </div>
            )}
          </div>

          {/* Quantity Box */}
          <div className="rounded-lg border-2 border-success bg-success/5 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">ژمارەی داخڵکراو</p>
            <p className="text-4xl font-bold text-success">{quantity}</p>
            <p className="text-sm text-success">{item.unit}</p>
          </div>

          {/* Note */}
          {note && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">تێبینی:</p>
              <p className="text-sm text-foreground">{note}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 gap-2"
          >
            <X className="h-4 w-4" />
            داخستن
          </Button>
          <Button 
            onClick={handlePrint}
            className="flex-1 gap-2 bg-success hover:bg-success/90"
          >
            <Printer className="h-4 w-4" />
            پرێنتی پسوڵە
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
