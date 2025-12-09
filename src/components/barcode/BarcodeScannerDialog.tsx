import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { hapticFeedback } from "@/lib/haptics";
import { X, Loader2, AlertCircle, QrCode, Camera } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.log('Scanner cleanup:', e);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setIsLoading(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    hasScannedRef.current = false;

    // Wait for container to be ready
    await new Promise(resolve => setTimeout(resolve, 500));

    const container = document.getElementById(SCANNER_ID);
    if (!container) {
      setError('کۆنتەینەری سکانەر نەدۆزرایەوە');
      setIsLoading(false);
      return;
    }

    // Clean up any existing scanner
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }

    try {
      // Support all barcode formats for better detection
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
        Html5QrcodeSupportedFormats.AZTEC,
        Html5QrcodeSupportedFormats.PDF_417,
      ];

      const scanner = new Html5Qrcode(SCANNER_ID, { 
        verbose: false,
        formatsToSupport: formatsToSupport
      });
      scannerRef.current = scanner;

      const config = {
        fps: 15, // Higher FPS for faster detection
        qrbox: { width: 280, height: 180 }, // Larger scan area
        aspectRatio: 1.333,
        disableFlip: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true // Use native BarcodeDetector when available
        }
      };

      const onSuccess = (decodedText: string) => {
        if (!hasScannedRef.current && decodedText) {
          hasScannedRef.current = true;
          hapticFeedback.success();
          stopScanner();
          onScan(decodedText);
          onOpenChange(false);
        }
      };

      // Try back camera first
      try {
        await scanner.start(
          { facingMode: "environment" },
          config,
          onSuccess,
          () => {} // Ignore failures
        );
        setIsScanning(true);
        setIsLoading(false);
        return;
      } catch (backCamError) {
        console.log('Back camera failed, trying front:', backCamError);
      }

      // Try front camera as fallback
      try {
        await scanner.start(
          { facingMode: "user" },
          config,
          onSuccess,
          () => {}
        );
        setIsScanning(true);
        setIsLoading(false);
        return;
      } catch (frontCamError) {
        console.log('Front camera failed:', frontCamError);
      }

      // Try any available camera
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          await scanner.start(
            devices[0].id,
            config,
            onSuccess,
            () => {}
          );
          setIsScanning(true);
          setIsLoading(false);
          return;
        }
      } catch (deviceError) {
        console.log('Device enumeration failed:', deviceError);
      }

      setError('هیچ کامێرایەک نەدۆزرایەوە');
      setIsLoading(false);
    } catch (err: any) {
      console.error('Scanner initialization error:', err);
      const errorMessage = err?.message || String(err);
      
      if (errorMessage.includes('Permission')) {
        setError('تکایە ڕێگە بە کامێرا بدە');
      } else if (errorMessage.includes('NotFound') || errorMessage.includes('not found')) {
        setError('کامێرا نەدۆزرایەوە');
      } else if (errorMessage.includes('NotReadable') || errorMessage.includes('Could not start')) {
        setError('کامێرا لەلایەن ئەپێکی تر بەکاردەهێنرێت');
      } else {
        setError('نەتوانرا کامێرا بکرێتەوە');
      }
      setIsLoading(false);
    }
  }, [onScan, onOpenChange, stopScanner]);

  // Start scanner when dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
      hasScannedRef.current = false;
      setError(null);
    }
  }, [open, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleClose = useCallback(() => {
    stopScanner();
    onOpenChange(false);
  }, [stopScanner, onOpenChange]);

  const handleRetry = useCallback(() => {
    setError(null);
    startScanner();
  }, [startScanner]);

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

        <div className="relative bg-black">
          {/* Scanner Container - must always be in DOM */}
          <div 
            id={SCANNER_ID}
            className="w-full min-h-[300px] bg-black"
            style={{ minHeight: '300px' }}
          />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
              <Camera className="h-12 w-12 text-primary mb-3 animate-pulse" />
              <Loader2 className="h-6 w-6 animate-spin text-white/70 mb-2" />
              <p className="text-sm text-white/70">کردنەوەی کامێرا...</p>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 p-4 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-sm text-white/80 mb-4">{error}</p>
              <Button
                size="sm"
                onClick={handleRetry}
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                هەوڵدانەوە
              </Button>
            </div>
          )}

          {/* Scanning overlay with guide box */}
          {isScanning && !isLoading && !error && (
            <div className="absolute inset-0 pointer-events-none z-5">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-36">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-primary rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-primary rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-primary rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-primary rounded-br" />
                <div 
                  className="absolute left-2 right-2 h-0.5 bg-primary/80 animate-pulse" 
                  style={{ top: '50%' }} 
                />
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
        #${SCANNER_ID} {
          position: relative;
          overflow: hidden;
        }
        #${SCANNER_ID} video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 300px !important;
        }
        #${SCANNER_ID} img {
          display: none !important;
        }
      `}</style>
    </Dialog>
  );
}
