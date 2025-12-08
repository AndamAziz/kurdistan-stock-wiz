import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { hapticFeedback } from "@/lib/haptics";
import { Camera, X, Loader2, AlertCircle, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerDialog({ 
  open, 
  onOpenChange, 
  onScan 
}: BarcodeScannerDialogProps) {
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const handleScan = (barcode: string) => {
    if (barcode !== lastScanned) {
      setLastScanned(barcode);
      hapticFeedback.success();
      onScan(barcode);
      onOpenChange(false);
    }
  };

  const { 
    isScanning, 
    error, 
    startScanning, 
    stopScanning,
    scannerRef 
  } = useBarcodeScanner(handleScan);

  useEffect(() => {
    if (open) {
      // Small delay to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        startScanning();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanning();
      setLastScanned(null);
    }
  }, [open, startScanning, stopScanning]);

  const handleClose = () => {
    stopScanning();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-5 w-5 text-primary" />
            سکانی باڕکۆد
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          {/* Scanner Container */}
          <div 
            id="barcode-scanner"
            ref={scannerRef}
            className={cn(
              "w-full aspect-square bg-black relative overflow-hidden",
              !isScanning && "flex items-center justify-center"
            )}
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
                  onClick={startScanning}
                  className="mt-2"
                >
                  هەوڵدانەوە
                </Button>
              </div>
            )}
          </div>

          {/* Scanning Overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner brackets */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary" />
                
                {/* Scanning line animation */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary animate-pulse" 
                  style={{
                    animation: 'scanLine 2s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 pt-3 bg-muted/50">
          <p className="text-xs text-center text-muted-foreground">
            باڕکۆدەکە ببە بەرەو کامێراکە بۆ سکانکردن
          </p>
        </div>

        {/* Close Button */}
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
        @keyframes scanLine {
          0%, 100% {
            top: 0;
          }
          50% {
            top: calc(100% - 2px);
          }
        }
        
        #barcode-scanner video {
          object-fit: cover !important;
        }
      `}</style>
    </Dialog>
  );
}
