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
  containerId: string = 'barcode-scanner'
): UseBarcodeScanner {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isBusyRef = useRef(false);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const scanner = html5QrCodeRef.current;
      if (scanner) {
        try {
          scanner.stop().then(() => {}).catch(() => {});
        } catch (e) {
          // Ignore cleanup errors
        }
        html5QrCodeRef.current = null;
      }
    };
  }, []);

  const stopScanning = useCallback(async () => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;

    try {
      const scanner = html5QrCodeRef.current;
      if (scanner) {
        try {
          await scanner.stop();
        } catch (e) {
          // Ignore stop errors
        }
        try {
          scanner.clear();
        } catch (e) {
          // Ignore clear errors
        }
        html5QrCodeRef.current = null;
      }
      setIsScanning(false);
    } finally {
      isBusyRef.current = false;
    }
  }, []);

  const startScanning = useCallback(async () => {
    if (isBusyRef.current) {
      console.log('Scanner busy, skipping');
      return;
    }
    
    const container = document.getElementById(containerId);
    if (!container) {
      setError('Scanner container not found');
      return;
    }

    isBusyRef.current = true;
    setError(null);

    try {
      // Clean up any existing scanner first
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {}
        try {
          html5QrCodeRef.current.clear();
        } catch (e) {}
        html5QrCodeRef.current = null;
      }

      // Clear container content
      container.innerHTML = '';
      
      // Small delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create scanner
      const scanner = new Html5Qrcode(containerId, { verbose: false });
      html5QrCodeRef.current = scanner;

      // Simple config for mobile
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 100 },
        aspectRatio: 1.0,
      };

      // Try environment camera first
      try {
        await scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            console.log('Scanned:', decodedText);
            onScanRef.current(decodedText);
          },
          () => {} // Ignore errors during scanning
        );
        setIsScanning(true);
        console.log('Scanner started with back camera');
      } catch (envError) {
        console.log('Back camera failed, trying front camera');
        
        // Try front camera as fallback
        try {
          await scanner.start(
            { facingMode: 'user' },
            config,
            (decodedText) => {
              console.log('Scanned:', decodedText);
              onScanRef.current(decodedText);
            },
            () => {}
          );
          setIsScanning(true);
          console.log('Scanner started with front camera');
        } catch (userError: any) {
          throw userError;
        }
      }
    } catch (err: any) {
      console.error('Scanner error:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('تکایە ڕێگەپێدانی کامێرا بدە');
      } else if (err.name === 'NotFoundError') {
        setError('کامێرا نەدۆزرایەوە');
      } else if (err.name === 'NotReadableError') {
        setError('کامێرا بەردەست نییە');
      } else if (err.message?.includes('secure') || err.message?.includes('SSL')) {
        setError('پێویستە HTTPS بەکاربهێنرێت');
      } else {
        setError(`هەڵە: ${err.message || 'نەزانراو'}`);
      }
      setIsScanning(false);
    } finally {
      isBusyRef.current = false;
    }
  }, [containerId]);

  return {
    isScanning,
    error,
    startScanning,
    stopScanning,
  };
}
