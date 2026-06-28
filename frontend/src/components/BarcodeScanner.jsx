import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const activeRef = useRef(true);

  useEffect(() => {
    const scanner = new Html5Qrcode('barcode-reader-box');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 260, height: 140 } },
      (text) => {
        if (!activeRef.current) return;
        activeRef.current = false;
        scanner.stop().catch(() => {});
        onScan(text);
      },
      () => {}
    ).catch(() => {
      onError('Camera access denied. Allow camera permission or enter barcode manually below.');
    });

    return () => {
      activeRef.current = false;
      scanner.stop().catch(() => {});
    };
  }, []);

  return <div id="barcode-reader-box" className="w-full rounded-lg overflow-hidden" />;
}
