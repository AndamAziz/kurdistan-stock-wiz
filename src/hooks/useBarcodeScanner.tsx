import { useState, useRef, useCallback, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface UseBarcodeScanner {
  isScanning: boolean;
  error: string | null;
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
}

export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  containerId: string
): UseBarcodeScanner {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);

  // Keep callback reference updated
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopScanning = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (e) {
      console.log('Stop scanner cleanup:', e);
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    setError(null);
    
    // Ensure any existing scanner is stopped
    await stopScanning();

    // Small delay for DOM readiness
    await new Promise(resolve => setTimeout(resolve, 100));

    const container = document.getElementById(containerId);
    if (!container) {
      setError('Scanner container not found');
      return;
    }

    try {
      const scanner = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 100 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onScanRef.current(decodedText);
        },
        () => {} // Ignore scan failures
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Scanner start error:', err);
      
      // Try front camera as fallback
      try {
        const scanner = new Html5Qrcode(containerId, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'user' },
          {
            fps: 10,
            qrbox: { width: 250, height: 100 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            onScanRef.current(decodedText);
          },
          () => {}
        );

        setIsScanning(true);
      } catch (fallbackErr: any) {
        const errorMessage = fallbackErr?.message || String(fallbackErr);
        
        if (errorMessage.includes('Permission')) {
          setError('تکایە ڕێگە بە کامێرا بدە');
        } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('Requested device not found')) {
          setError('کامێرا نەدۆزرایەوە');
        } else {
          setError('نەتوانرا کامێرا بکرێتەوە');
        }
      }
    }
  }, [containerId, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
          scannerRef.current.clear();
        } catch (e) {}
      }
    };
  }, []);

  return { isScanning, error, startScanning, stopScanning };
}
