import { useState, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

interface UseBarcodeScanner {
  isScanning: boolean;
  error: string | null;
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
}

export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  containerId: string = 'barcode-scanner'
): UseBarcodeScanner {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);

  const stopScanning = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    try {
      const scanner = html5QrCodeRef.current;
      if (scanner) {
        const state = scanner.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scanner.stop();
        }
        // Clear the scanner instance
        try {
          await scanner.clear();
        } catch (e) {
          // Ignore clear errors
        }
        html5QrCodeRef.current = null;
      }
      setIsScanning(false);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    } finally {
      isStoppingRef.current = false;
    }
  }, []);

  const startScanning = useCallback(async () => {
    const container = document.getElementById(containerId);
    if (!container) {
      setError('Scanner container not found');
      return;
    }

    try {
      setError(null);

      // Stop any existing scanner first
      await stopScanning();

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create new scanner instance
      html5QrCodeRef.current = new Html5Qrcode(containerId);
      const scanner = html5QrCodeRef.current;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 100 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {
          // Ignore scan frame errors
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
  }, [containerId, onScan, stopScanning]);

  return {
    isScanning,
    error,
    startScanning,
    stopScanning,
  };
}
