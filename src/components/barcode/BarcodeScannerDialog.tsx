import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { hapticFeedback } from "@/lib/haptics";
import { X, Loader2, AlertCircle, QrCode } from "lucide-react";

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

const SCANNER_ID = 'barcode-scanner-container';

export function BarcodeScannerDialog({ 
  open, 
  onOpenChange, 
  onScan 
}: BarcodeScannerDialogProps) {
  const [hasScanned, setHasScanned] = useState(false);

  const handleScanResult = useCallback((barcode: string) => {
    if (barcode && !hasScanned) {
      setHasScanned(true);
      hapticFeedback.success();
      onScan(barcode);
      onOpenChange(false);
    }
  }, [hasScanned, onScan, onOpenChange]);

  const { 
    isScanning, 
    error, 
    startScanning, 
    stopScanning,
  } = useBarcodeScanner(handleScanResult, SCANNER_ID);

  // Start scanner when dialog opens
  useEffect(() => {
    if (open && !hasScanned) {
      const timer = setTimeout(() => {
        startScanning();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, hasScanned, startScanning]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setHasScanned(false);
      stopScanning();
    }
  }, [open, stopScanning]);

  const handleClose = useCallback(() => {
    stopScanning();
    onOpenChange(false);
  }, [stopScanning, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-5 w-5 text-primary" />
            سکانی باڕکۆد
          </DialogTitle>
          <DialogDescription className="sr-only">
            باڕکۆدەکە ببە بەرەو کامێراکە بۆ سکانکردن
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <div 
            id={SCANNER_ID}
            className="w-full aspect-[4/3] bg-black relative overflow-hidden flex items-center justify-center"
          >
            {!isScanning && !error && (
              <div className="flex flex-col items-center gap-3 text-white/70">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">کردنەوەی کامێرا...</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-3 text-white/70 p-4 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setHasScanned(false);
                    startScanning();
                  }}
                  className="mt-2"
                >
                  هەوڵدانەوە
                </Button>
              </div>
            )}
          </div>

          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-20">
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-primary" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-primary" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary" />
                <div className="absolute left-0 right-0 h-0.5 bg-primary animate-pulse" style={{ top: '50%' }} />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 pt-3 bg-muted/50">
          <p className="text-xs text-center text-muted-foreground">
            باڕکۆدەکە ببە بەرەو کامێراکە بۆ سکانکردن
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </DialogContent>

      <style>{`
        #${SCANNER_ID} video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </Dialog>
  );
}
