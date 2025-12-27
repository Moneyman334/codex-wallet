import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Coins, TrendingUp, ShoppingCart, Crown, Zap, Target,
  Users, Trophy, Rocket, Sparkles, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VisualizerNode {
  id: string;
  label: string;
  path: string;
  icon: any;
  x: number;
  y: number;
  color: string;
  value?: string;
  scale: number;
}

interface CosmicVisualizerProps {
  empireStats?: {
    totalPortfolioValue: string;
    totalInvested: string;
    totalEarned: string;
    activePositions: number;
    totalPnL: string;
    pnlPercent: string;
  };
  onClose: () => void;
}

export default function CosmicVisualizer({ empireStats, onClose }: CosmicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Define empire nodes with positions
  const nodes: VisualizerNode[] = [
    { id: "center", label: "Empire Core", path: "/", icon: Crown, x: 50, y: 50, color: "#a855f7", value: `$${empireStats?.totalPortfolioValue || "0"}`, scale: 2.5 },
    { id: "defi", label: "DeFi Hub", path: "/staking", icon: Coins, x: 30, y: 25, color: "#8b5cf6", value: `${empireStats?.activePositions || 0} Active`, scale: 1.5 },
    { id: "trading", label: "Trading", path: "/social-trading", icon: TrendingUp, x: 70, y: 25, color: "#10b981", value: empireStats?.totalPnL, scale: 1.5 },
    { id: "ecommerce", label: "E-Commerce", path: "/products", icon: ShoppingCart, x: 20, y: 60, color: "#3b82f6", scale: 1.3 },
    { id: "nft", label: "NFT Gallery", path: "/nft-gallery", icon: Sparkles, x: 80, y: 60, color: "#ec4899", scale: 1.3 },
    { id: "governance", label: "DAO", path: "/dao", icon: Users, x: 30, y: 80, color: "#f59e0b", scale: 1.2 },
    { id: "achievements", label: "Achievements", path: "/achievements", icon: Trophy, x: 70, y: 80, color: "#eab308", scale: 1.2 },
    { id: "lending", label: "Lending", path: "/lending", icon: Zap, x: 15, y: 40, color: "#06b6d4", scale: 1.1 },
    { id: "markets", label: "Prediction", path: "/prediction-markets", icon: Target, x: 85, y: 40, color: "#8b5cf6", scale: 1.1 },
    { id: "launchpad", label: "Launchpad", path: "/token-launchpad", icon: Rocket, x: 50, y: 15, color: "#f97316", scale: 1.2 },
  ];

  // Particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections between nodes
      ctx.strokeStyle = "rgba(168, 85, 247, 0.1)";
      ctx.lineWidth = 1;
      nodes.forEach((node1, i) => {
        nodes.forEach((node2, j) => {
          if (i < j) {
            const x1 = (node1.x / 100) * canvas.width;
            const y1 = (node1.y / 100) * canvas.height;
            const x2 = (node2.x / 100) * canvas.width;
            const y2 = (node2.y / 100) * canvas.height;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        });
      });

      // Draw and update particles
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.fillStyle = `rgba(168, 85, 247, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [nodes]);

  const handleNodeClick = (path: string) => {
    setLocation(path);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
      data-testid="cosmic-visualizer"
    >
      {/* Animated background canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 50%, #1a0b2e 0%, #000000 100%)" }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Cosmic Empire Visualizer
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            </h1>
            <p className="text-sm text-purple-300">Interactive 3D Command Center</p>
          </div>
        </motion.div>

        <Button
          onClick={onClose}
          variant="outline"
          className="border-purple-500/50 hover:bg-purple-500/20"
          data-testid="button-close-visualizer"
        >
          Exit Visualizer
        </Button>
      </div>

      {/* Empire Stats Overlay */}
      {empireStats && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-6 top-24 p-4 bg-black/50 backdrop-blur-lg border border-purple-500/30 rounded-lg"
        >
          <h3 className="text-sm font-semibold text-purple-400 mb-2">Empire Stats</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Portfolio:</span>
              <span className="text-white font-bold">${empireStats.totalPortfolioValue}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">P&L:</span>
              <span className={parseFloat(empireStats.totalPnL) >= 0 ? "text-green-400" : "text-red-400"}>
                ${empireStats.totalPnL} ({empireStats.pnlPercent})
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Active:</span>
              <span className="text-white">{empireStats.activePositions} positions</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Interactive Nodes */}
      <AnimatePresence>
        {nodes.map((node, index) => {
          const Icon = node.icon;
          const isHovered = hoveredNode === node.id;
          const isCenterNode = node.id === "center";
          
          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: isHovered ? node.scale * 1.2 : node.scale,
                x: isHovered ? (mousePos.x - window.innerWidth * node.x / 100) * 0.02 : 0,
                y: isHovered ? (mousePos.y - window.innerHeight * node.y / 100) * 0.02 : 0,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              className="absolute cursor-pointer group"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(node.path)}
              data-testid={`node-${node.id}`}
            >
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse"
                style={{ 
                  backgroundColor: node.color,
                  width: isCenterNode ? "120px" : "80px",
                  height: isCenterNode ? "120px" : "80px",
                  transform: "translate(-50%, -50%)",
                  left: "50%",
                  top: "50%"
                }}
              />
              
              {/* Node circle */}
              <div
                className={`relative rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCenterNode ? "w-24 h-24" : "w-16 h-16"
                }`}
                style={{
                  background: `linear-gradient(135deg, ${node.color}dd, ${node.color}66)`,
                  boxShadow: `0 0 30px ${node.color}88, inset 0 0 20px ${node.color}44`,
                  border: `2px solid ${node.color}`,
                }}
              >
                <Icon className={`${isCenterNode ? "w-12 h-12" : "w-8 h-8"} text-white`} />
                
                {/* Rotating ring */}
                {isCenterNode && (
                  <div 
                    className="absolute inset-0 rounded-full animate-spin"
                    style={{
                      border: `2px solid transparent`,
                      borderTopColor: node.color,
                      borderRightColor: node.color,
                      animationDuration: "3s"
                    }}
                  />
                )}
              </div>

              {/* Info card on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full mt-4 left-1/2 -translate-x-1/2 p-3 bg-black/80 backdrop-blur-lg border border-purple-500/50 rounded-lg whitespace-nowrap"
                  >
                    <div className="text-center">
                      <h4 className="text-white font-bold mb-1">{node.label}</h4>
                      {node.value && (
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                          {node.value}
                        </Badge>
                      )}
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        Click to navigate <ChevronRight className="w-3 h-3" />
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Label below node */}
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-center">
                <p className={`text-xs font-semibold whitespace-nowrap transition-all ${
                  isHovered ? "text-white scale-110" : "text-gray-400"
                }`}>
                  {node.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 p-4 bg-black/50 backdrop-blur-lg border border-purple-500/30 rounded-lg text-center"
      >
        <p className="text-sm text-purple-300">
          ✨ Hover over nodes to explore • Click to navigate • Move your mouse to interact with the cosmic field ✨
        </p>
      </motion.div>

      {/* Cursor glow effect */}
      <motion.div
        className="absolute w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)",
          left: mousePos.x - 80,
          top: mousePos.y - 80,
        }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
