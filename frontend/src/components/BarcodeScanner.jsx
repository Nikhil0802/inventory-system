import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScanner({ onScan, onError }) {
  const startedRef = useRef(false);
  const scannedRef = useRef(false);

  useEffect(() => {
    let scanner;
    try {
      scanner = new Html5Qrcode('barcode-reader-box');
    } catch (e) {
      onError('Scanner could not be initialized.');
      return;
    }

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 260, height: 140 } },
      (text) => {
        if (scannedRef.current) return;
        scannedRef.current = true;
        startedRef.current = false;
        scanner.stop().catch(() => {});
        onScan(text);
      },
      () => {}
    ).then(() => {
      startedRef.current = true;
    }).catch(() => {
      onError('Camera access denied. Use manual entry below.');
    });

    return () => {
      if (startedRef.current) {
        startedRef.current = false;
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  return <div id="barcode-reader-box" className="w-full rounded-lg overflow-hidden" />;
}
