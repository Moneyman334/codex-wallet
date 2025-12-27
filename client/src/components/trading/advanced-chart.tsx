import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Maximize2,
  Settings,
  Plus,
  Minus,
} from "lucide-react";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  sma50?: number;
  ema12?: number;
  upperBand?: number;
  lowerBand?: number;
  middleBand?: number;
}

interface AdvancedChartProps {
  symbol?: string;
  onSymbolChange?: (symbol: string) => void;
}

const timeframes = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1H", value: "1h" },
  { label: "4H", value: "4h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
];

const chartTypes = [
  { label: "Candle", value: "candle", icon: BarChart3 },
  { label: "Line", value: "line", icon: Activity },
  { label: "Area", value: "area", icon: TrendingUp },
];

const popularPairs = [
  { symbol: "BTC/USDT", name: "Bitcoin" },
  { symbol: "ETH/USDT", name: "Ethereum" },
  { symbol: "SOL/USDT", name: "Solana" },
  { symbol: "BNB/USDT", name: "BNB" },
  { symbol: "XRP/USDT", name: "XRP" },
  { symbol: "ADA/USDT", name: "Cardano" },
  { symbol: "DOGE/USDT", name: "Dogecoin" },
  { symbol: "AVAX/USDT", name: "Avalanche" },
];

function generateCandleData(basePrice: number, volatility: number = 0.02): CandleData[] {
  const data: CandleData[] = [];
  let price = basePrice;
  const now = Date.now();
  
  for (let i = 100; i >= 0; i--) {
    const change = (Math.random() - 0.5) * 2 * volatility * price;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * price * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * price * 0.5;
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    const time = new Date(now - i * 3600000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    data.push({ time, open, high, low, close, volume });
    price = close;
  }
  
  // Calculate moving averages
  for (let i = 0; i < data.length; i++) {
    if (i >= 19) {
      const sum20 = data.slice(i - 19, i + 1).reduce((acc, d) => acc + d.close, 0);
      data[i].sma20 = sum20 / 20;
    }
    if (i >= 49) {
      const sum50 = data.slice(i - 49, i + 1).reduce((acc, d) => acc + d.close, 0);
      data[i].sma50 = sum50 / 50;
    }
    if (i >= 11) {
      const multiplier = 2 / (12 + 1);
      if (i === 11) {
        const sum12 = data.slice(0, 12).reduce((acc, d) => acc + d.close, 0);
        data[i].ema12 = sum12 / 12;
      } else if (data[i - 1].ema12) {
        data[i].ema12 = (data[i].close - data[i - 1].ema12!) * multiplier + data[i - 1].ema12!;
      }
    }
    
    // Bollinger Bands (20-period, 2 std dev)
    if (i >= 19) {
      const slice = data.slice(i - 19, i + 1);
      const mean = slice.reduce((acc, d) => acc + d.close, 0) / 20;
      const variance = slice.reduce((acc, d) => acc + Math.pow(d.close - mean, 2), 0) / 20;
      const stdDev = Math.sqrt(variance);
      data[i].middleBand = mean;
      data[i].upperBand = mean + 2 * stdDev;
      data[i].lowerBand = mean - 2 * stdDev;
    }
  }
  
  return data;
}

const basePrices: Record<string, number> = {
  "BTC/USDT": 98500,
  "ETH/USDT": 3450,
  "SOL/USDT": 195,
  "BNB/USDT": 695,
  "XRP/USDT": 2.35,
  "ADA/USDT": 0.98,
  "DOGE/USDT": 0.32,
  "AVAX/USDT": 42,
};

export function AdvancedChart({ symbol = "BTC/USDT", onSymbolChange }: AdvancedChartProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [timeframe, setTimeframe] = useState("1h");
  const [chartType, setChartType] = useState("candle");
  const [showMA, setShowMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [data, setData] = useState<CandleData[]>([]);
  
  useEffect(() => {
    const basePrice = basePrices[selectedSymbol] || 1000;
    setData(generateCandleData(basePrice));
    
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev];
        const lastCandle = { ...newData[newData.length - 1] };
        const change = (Math.random() - 0.5) * 0.002 * lastCandle.close;
        lastCandle.close += change;
        lastCandle.high = Math.max(lastCandle.high, lastCandle.close);
        lastCandle.low = Math.min(lastCandle.low, lastCandle.close);
        lastCandle.volume += Math.floor(Math.random() * 100000);
        newData[newData.length - 1] = lastCandle;
        return newData;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [selectedSymbol, timeframe]);
  
  const latestPrice = data[data.length - 1]?.close || 0;
  const previousPrice = data[data.length - 2]?.close || latestPrice;
  const priceChange = latestPrice - previousPrice;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;
  const isPositive = priceChange >= 0;
  
  const dayHigh = Math.max(...data.map(d => d.high));
  const dayLow = Math.min(...data.map(d => d.low));
  const totalVolume = data.reduce((acc, d) => acc + d.volume, 0);
  
  const handleSymbolChange = (newSymbol: string) => {
    setSelectedSymbol(newSymbol);
    onSymbolChange?.(newSymbol);
  };

  const CandlestickBar = (props: any) => {
    const { x, y, width, height, payload } = props;
    if (!payload) return null;
    
    const { open, close, high, low } = payload;
    const isUp = close >= open;
    const color = isUp ? "#22c55e" : "#ef4444";
    const bodyTop = Math.min(open, close);
    const bodyHeight = Math.abs(close - open);
    
    const priceRange = dayHigh - dayLow;
    const chartHeight = 300;
    const yScale = chartHeight / priceRange;
    
    const wickX = x + width / 2;
    const bodyY = chartHeight - (bodyTop - dayLow) * yScale;
    const highY = chartHeight - (high - dayLow) * yScale;
    const lowY = chartHeight - (low - dayLow) * yScale;
    const scaledBodyHeight = bodyHeight * yScale;
    
    return (
      <g>
        <line
          x1={wickX}
          y1={highY}
          x2={wickX}
          y2={lowY}
          stroke={color}
          strokeWidth={1}
        />
        <rect
          x={x + 1}
          y={bodyY - scaledBodyHeight}
          width={Math.max(width - 2, 3)}
          height={Math.max(scaledBodyHeight, 2)}
          fill={color}
          stroke={color}
        />
      </g>
    );
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800" data-testid="advanced-chart">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-700" data-testid="symbol-selector">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {popularPairs.map(pair => (
                  <SelectItem key={pair.symbol} value={pair.symbol}>
                    <span className="font-medium">{pair.symbol}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white" data-testid="current-price">
                  ${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <Badge 
                  className={isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                  data-testid="price-change"
                >
                  {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>H: ${dayHigh.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span>L: ${dayLow.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span>Vol: ${(totalVolume / 1e6).toFixed(2)}M</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-gray-800 rounded-lg p-1">
              {timeframes.map(tf => (
                <Button
                  key={tf.value}
                  variant="ghost"
                  size="sm"
                  className={`px-2 py-1 h-7 text-xs ${timeframe === tf.value ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
                  onClick={() => setTimeframe(tf.value)}
                  data-testid={`timeframe-${tf.value}`}
                >
                  {tf.label}
                </Button>
              ))}
            </div>
            
            <div className="flex bg-gray-800 rounded-lg p-1">
              {chartTypes.map(type => (
                <Button
                  key={type.value}
                  variant="ghost"
                  size="sm"
                  className={`px-2 py-1 h-7 ${chartType === type.value ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"}`}
                  onClick={() => setChartType(type.value)}
                  data-testid={`chart-type-${type.value}`}
                >
                  <type.icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-xs ${showMA ? "bg-blue-600/20 text-blue-400" : "text-gray-400"}`}
                onClick={() => setShowMA(!showMA)}
                data-testid="toggle-ma"
              >
                MA
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-xs ${showBB ? "bg-yellow-600/20 text-yellow-400" : "text-gray-400"}`}
                onClick={() => setShowBB(!showBB)}
                data-testid="toggle-bb"
              >
                BB
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-xs ${showVolume ? "bg-purple-600/20 text-purple-400" : "text-gray-400"}`}
                onClick={() => setShowVolume(!showVolume)}
                data-testid="toggle-volume"
              >
                Vol
              </Button>
            </div>
            
            <Button variant="ghost" size="sm" className="h-7 text-gray-400">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="h-[400px]" data-testid="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#9ca3af" 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                />
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                  strokeWidth={2}
                />
                {showMA && (
                  <>
                    <Line type="monotone" dataKey="sma20" stroke="#3b82f6" dot={false} strokeWidth={1} />
                    <Line type="monotone" dataKey="sma50" stroke="#f59e0b" dot={false} strokeWidth={1} />
                  </>
                )}
              </AreaChart>
            ) : chartType === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#9ca3af" 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                />
                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#8b5cf6" 
                  dot={false} 
                  strokeWidth={2}
                />
                {showMA && (
                  <>
                    <Line type="monotone" dataKey="sma20" stroke="#3b82f6" dot={false} strokeWidth={1} />
                    <Line type="monotone" dataKey="sma50" stroke="#f59e0b" dot={false} strokeWidth={1} />
                  </>
                )}
                {showBB && (
                  <>
                    <Line type="monotone" dataKey="upperBand" stroke="#eab308" dot={false} strokeWidth={1} strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="lowerBand" stroke="#eab308" dot={false} strokeWidth={1} strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="middleBand" stroke="#eab308" dot={false} strokeWidth={1} />
                  </>
                )}
              </LineChart>
            ) : (
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  yAxisId="price"
                  stroke="#9ca3af" 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  orientation="right"
                />
                {showVolume && (
                  <YAxis 
                    yAxisId="volume"
                    stroke="#6b7280" 
                    orientation="left"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `${(value / 1e6).toFixed(0)}M`}
                  />
                )}
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'volume') return [`${(value / 1e6).toFixed(2)}M`, 'Volume'];
                    return [`$${value.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)];
                  }}
                />
                {showVolume && (
                  <Bar 
                    yAxisId="volume"
                    dataKey="volume" 
                    fill="#8b5cf6" 
                    opacity={0.3}
                  />
                )}
                <Line 
                  yAxisId="price"
                  type="monotone" 
                  dataKey="close" 
                  stroke="#8b5cf6" 
                  dot={false} 
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="price"
                  type="monotone" 
                  dataKey="high" 
                  stroke="#22c55e" 
                  dot={false} 
                  strokeWidth={1}
                  strokeOpacity={0.5}
                />
                <Line 
                  yAxisId="price"
                  type="monotone" 
                  dataKey="low" 
                  stroke="#ef4444" 
                  dot={false} 
                  strokeWidth={1}
                  strokeOpacity={0.5}
                />
                {showMA && (
                  <>
                    <Line yAxisId="price" type="monotone" dataKey="sma20" stroke="#3b82f6" dot={false} strokeWidth={1} />
                    <Line yAxisId="price" type="monotone" dataKey="sma50" stroke="#f59e0b" dot={false} strokeWidth={1} />
                  </>
                )}
                {showBB && (
                  <>
                    <Line yAxisId="price" type="monotone" dataKey="upperBand" stroke="#eab308" dot={false} strokeWidth={1} strokeDasharray="3 3" />
                    <Line yAxisId="price" type="monotone" dataKey="lowerBand" stroke="#eab308" dot={false} strokeWidth={1} strokeDasharray="3 3" />
                  </>
                )}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800">
          <div className="flex items-center gap-4 text-xs">
            {showMA && (
              <>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-blue-500"></div>
                  <span className="text-gray-400">SMA 20</span>
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-yellow-500"></div>
                  <span className="text-gray-400">SMA 50</span>
                </span>
              </>
            )}
            {showBB && (
              <span className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-yellow-500 opacity-60"></div>
                <span className="text-gray-400">Bollinger Bands</span>
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdvancedChart;
