import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingOverlay() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);

    // Hide after app is ready
    const timeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-background via-purple-500/10 to-pink-500/10 backdrop-blur-sm"
          data-testid="loading-overlay"
        >
          <div className="text-center space-y-6">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity }
              }}
              className="inline-block"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary via-purple-500 to-accent rounded-2xl flex items-center justify-center glow-primary divine-glow">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              </div>
            </motion.div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
                Initializing Empire
              </h2>
              <p className="text-sm text-muted-foreground">
                Preparing your blockchain experience...
              </p>
            </div>

            <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-purple-500 to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
