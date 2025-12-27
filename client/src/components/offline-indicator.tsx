import { useOfflineDetection } from '@/hooks/use-offline-detection';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const { isOnline } = useOfflineDetection();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white py-2 px-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">No Internet Connection</span>
      </div>
    </div>
  );
}
