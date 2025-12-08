import { useState, useRef, useCallback, useEffect } from 'react';
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
  const isStartingRef = useRef(false);
  const onScanRef = useRef(onScan);

  // Keep onScan ref updated
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopScanning = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    try {
      const scanner = html5QrCodeRef.current;
      if (scanner) {
        try {
          const state = scanner.getState();
          if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
            await scanner.stop();
          }
        } catch (e) {
          console.log('Stop error (ignored):', e);
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
    if (isStartingRef.current || isStoppingRef.current) {
      console.log('Scanner busy, skipping start');
      return;
    }
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Scanner container not found:', containerId);
      setError('Scanner container not found');
      return;
    }

    isStartingRef.current = true;

    try {
      setError(null);

      // Stop any existing scanner first
      if (html5QrCodeRef.current) {
        try {
          const state = html5QrCodeRef.current.getState();
          if (state === Html5QrcodeScannerState.SCANNING) {
            await html5QrCodeRef.current.stop();
          }
          await html5QrCodeRef.current.clear();
        } catch (e) {
          console.log('Cleanup error (ignored):', e);
        }
        html5QrCodeRef.current = null;
      }

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 200));

      // Clear container
      container.innerHTML = '';

      // Check camera availability first
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('Available cameras:', videoDevices.length);
      
      if (videoDevices.length === 0) {
        setError('هیچ کامێرایەک نەدۆزرایەوە');
        return;
      }

      // Create new scanner instance
      html5QrCodeRef.current = new Html5Qrcode(containerId, {
        verbose: false,
        formatsToSupport: undefined, // Support all formats
      });
      
      const scanner = html5QrCodeRef.current;

      // Try to get camera with environment facing mode first
      let cameraConfig: any = { facingMode: 'environment' };
      
      // On some mobile devices, we need to be more specific
      const backCamera = videoDevices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );
      
      if (backCamera) {
        cameraConfig = { deviceId: { exact: backCamera.deviceId } };
        console.log('Using back camera:', backCamera.label);
      }

      // Scanner config - more mobile-friendly
      const scanConfig = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.7);
          return { width: qrboxSize, height: Math.floor(qrboxSize * 0.4) };
        },
        aspectRatio: 1.0,
        disableFlip: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      await scanner.start(
        cameraConfig,
        scanConfig,
        (decodedText) => {
          console.log('Barcode scanned:', decodedText);
          onScanRef.current(decodedText);
        },
        () => {
          // Ignore scan frame errors
        }
      );

      setIsScanning(true);
      console.log('Scanner started successfully');
    } catch (err: any) {
      console.error('Scanner error:', err);
      
      // Try with any available camera if environment mode fails
      if (err.name === 'NotFoundError' || err.message?.includes('Requested device not found')) {
        try {
          console.log('Retrying with any available camera...');
          
          const scanner = new Html5Qrcode(containerId);
          html5QrCodeRef.current = scanner;
          
          await scanner.start(
            { facingMode: 'user' }, // Try front camera as fallback
            {
              fps: 15,
              qrbox: { width: 200, height: 80 },
            },
            (decodedText) => {
              console.log('Barcode scanned:', decodedText);
              onScanRef.current(decodedText);
            },
            () => {}
          );
          
          setIsScanning(true);
          console.log('Scanner started with front camera');
          return;
        } catch (fallbackErr) {
          console.error('Fallback camera error:', fallbackErr);
        }
      }
      
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        setError('تکایە ڕێگەپێدانی کامێرا بدە لە ڕێکخستنەکانی براوسەر');
      } else if (err.name === 'NotFoundError' || err.message?.includes('NotFound')) {
        setError('کامێرا نەدۆزرایەوە - تکایە دڵنیابە لە هەبوونی کامێرا');
      } else if (err.name === 'NotReadableError') {
        setError('کامێرا لە لایەن ئەپێکی تر بەکاردەهێنرێت');
      } else if (err.message?.includes('SSL') || err.message?.includes('secure')) {
        setError('پێویستە سایتەکە HTTPS بێت بۆ بەکارهێنانی کامێرا');
      } else {
        setError(`هەڵە لە کردنەوەی کامێرا: ${err.message || 'نەزانراو'}`);
      }
      setIsScanning(false);
    } finally {
      isStartingRef.current = false;
    }
  }, [containerId, stopScanning]);

  return {
    isScanning,
    error,
    startScanning,
    stopScanning,
  };
}
