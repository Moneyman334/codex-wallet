import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileLoadingProps {
  isLoading: boolean;
  text?: string;
  fullScreen?: boolean;
}

export function MobileLoading({ isLoading, text = "Loading...", fullScreen = false }: MobileLoadingProps) {
  if (!isLoading) return null;

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50' : ''
      }`}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-8 w-8 text-primary" />
      </motion.div>
      <p className="text-sm text-muted-foreground font-medium">{text}</p>
    </motion.div>
  );

  return <AnimatePresence>{isLoading && content}</AnimatePresence>;
}

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  pullProgress: number;
}

export function PullToRefreshIndicator({ isPulling, pullProgress }: PullToRefreshIndicatorProps) {
  if (!isPulling && pullProgress === 0) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ 
        height: Math.min(pullProgress * 60, 60),
        opacity: Math.min(pullProgress, 1)
      }}
      className="flex items-center justify-center overflow-hidden"
    >
      <motion.div
        animate={{ rotate: pullProgress >= 1 ? 360 : pullProgress * 360 }}
        transition={{ duration: pullProgress >= 1 ? 1 : 0 }}
      >
        <Loader2 className="h-6 w-6 text-primary" />
      </motion.div>
    </motion.div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = "" }: SkeletonCardProps) {
  return (
    <div className={`rounded-lg border bg-card p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="h-20 bg-muted rounded animate-pulse" />
      <div className="flex gap-2">
        <div className="h-8 flex-1 bg-muted rounded animate-pulse" />
        <div className="h-8 flex-1 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

interface SkeletonListProps {
  count?: number;
  className?: string;
}

export function SkeletonList({ count = 3, className = "" }: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/4 bg-muted rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

interface TransactionLoadingProps {
  status: 'pending' | 'processing' | 'confirming' | 'success' | 'error';
  message?: string;
}

export function TransactionLoading({ status, message }: TransactionLoadingProps) {
  const statusConfig = {
    pending: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', text: 'Preparing transaction...' },
    processing: { color: 'text-blue-500', bg: 'bg-blue-500/10', text: 'Processing...' },
    confirming: { color: 'text-purple-500', bg: 'bg-purple-500/10', text: 'Confirming on blockchain...' },
    success: { color: 'text-green-500', bg: 'bg-green-500/10', text: 'Transaction successful!' },
    error: { color: 'text-red-500', bg: 'bg-red-500/10', text: 'Transaction failed' },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-3 p-4 rounded-lg ${config.bg}`}
    >
      {status !== 'success' && status !== 'error' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className={`h-5 w-5 ${config.color}`} />
        </motion.div>
      )}
      <span className={`text-sm font-medium ${config.color}`}>
        {message || config.text}
      </span>
    </motion.div>
  );
}
