import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Camera, Flashlight, Copy, Check, AlertCircle } from 'lucide-react';
import { useHaptics } from '@/hooks/use-haptics';
import { Capacitor } from '@capacitor/core';

interface NativeQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
}

export function NativeQRScanner({ isOpen, onClose, onScan, title = 'Scan QR Code' }: NativeQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const { successNotification, heavyImpact } = useHaptics();

  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === 'ios';

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasPermission(true);
        setIsScanning(true);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setHasPermission(false);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please enable camera permissions in Settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Failed to access camera. Please try again.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleScan = useCallback((result: string) => {
    heavyImpact();
    successNotification();
    stopCamera();
    onScan(result);
    onClose();
  }, [heavyImpact, successNotification, stopCamera, onScan, onClose]);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (isScanning) requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        barcodeDetector.detect(imageData).then((barcodes: any[]) => {
          if (barcodes.length > 0) {
            handleScan(barcodes[0].rawValue);
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.debug('Barcode detection not available');
    }

    if (isScanning) {
      requestAnimationFrame(scanFrame);
    }
  }, [isScanning, handleScan]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  useEffect(() => {
    if (isScanning) {
      requestAnimationFrame(scanFrame);
    }
  }, [isScanning, scanFrame]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black"
      style={{ paddingTop: isIOS ? 'env(safe-area-inset-top)' : 0 }}
    >
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
            data-testid="button-close-scanner"
          >
            <X className="h-6 w-6" />
          </Button>
          <h2 className="text-white font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFlashOn(!flashOn)}
            className={`text-white hover:bg-white/20 ${flashOn ? 'bg-yellow-500/30' : ''}`}
            data-testid="button-toggle-flash"
          >
            <Flashlight className="h-6 w-6" />
          </Button>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-64 h-64 border-2 border-white/50 rounded-2xl relative">
                {/* Corner accents */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-lg" />
                
                {/* Scanning line animation */}
                {isScanning && (
                  <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-scan" />
                )}
              </div>
            </div>
          </div>

          {/* Error or permission message */}
          {(error || hasPermission === false) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <Card className="mx-4 bg-background/90">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {error || 'Camera permission denied'}
                  </p>
                  <Button onClick={startCamera} data-testid="button-retry-camera">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white/80 text-center text-sm">
            Point your camera at a QR code to scan
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 85%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

interface QRDisplayProps {
  value: string;
  size?: number;
  label?: string;
}

export function NativeQRDisplay({ value, size = 200, label }: QRDisplayProps) {
  const [copied, setCopied] = useState(false);
  const { successNotification } = useHaptics();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      successNotification();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="bg-white p-4 inline-block">
      <div className="flex flex-col items-center gap-3">
        <div 
          className="bg-white p-4 rounded-lg"
          style={{ width: size, height: size }}
        >
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`}
            alt="QR Code"
            className="w-full h-full"
          />
        </div>
        {label && (
          <p className="text-xs text-gray-600 text-center max-w-[200px] truncate">
            {label}
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
          data-testid="button-copy-qr-value"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Address
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
