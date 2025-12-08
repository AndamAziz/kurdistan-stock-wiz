import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

interface UseBarcodeScanner {
  isScanning: boolean;
  error: string | null;
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
  scannerRef: React.RefObject<HTMLDivElement>;
}

export function useBarcodeScanner(onScan: (barcode: string) => void): UseBarcodeScanner {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const startScanning = useCallback(async () => {
    if (!scannerRef.current) {
      setError('Scanner container not found');
      return;
    }

    try {
      setError(null);
      
      // Create scanner instance if not exists
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('barcode-scanner');
      }

      const scanner = html5QrCodeRef.current;
      
      // Check if already scanning
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        return;
      }

      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 100 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onScan(decodedText);
          // Optionally stop after successful scan
        },
        (errorMessage) => {
          // Ignore scan errors (happens when no barcode in view)
          console.debug('Scan frame error:', errorMessage);
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Scanner error:', err);
      if (err.message?.includes('Permission')) {
        setError('ڕێگەپێدانی کامێرا نەدراوە');
      } else if (err.message?.includes('NotFound')) {
        setError('کامێرا نەدۆزرایەوە');
      } else {
        setError('هەڵەیەک ڕوویدا لە کردنەوەی کامێرا');
      }
      setIsScanning(false);
    }
  }, [onScan]);

  const stopScanning = useCallback(async () => {
    try {
      const scanner = html5QrCodeRef.current;
      if (scanner && scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        await scanner.stop();
      }
      setIsScanning(false);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const scanner = html5QrCodeRef.current;
      if (scanner) {
        try {
          if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
            scanner.stop().catch(console.error);
          }
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      }
    };
  }, []);

  return {
    isScanning,
    error,
    startScanning,
    stopScanning,
    scannerRef,
  };
}
