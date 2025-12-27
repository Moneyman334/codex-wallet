import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";

interface IndicatorData {
  time: string;
  value: number;
  signal?: number;
  histogram?: number;
  upper?: number;
  lower?: number;
}

interface TechnicalIndicatorsProps {
  symbol?: string;
}

function generateRSIData(): IndicatorData[] {
  const data: IndicatorData[] = [];
  let rsi = 50;
  
  for (let i = 0; i < 50; i++) {
    rsi = Math.max(0, Math.min(100, rsi + (Math.random() - 0.5) * 10));
    data.push({
      time: `${i}`,
      value: rsi,
    });
  }
  
  return data;
}

function generateMACDData(): IndicatorData[] {
  const data: IndicatorData[] = [];
  let macd = 0;
  let signal = 0;
  
  for (let i = 0; i < 50; i++) {
    macd += (Math.random() - 0.5) * 50;
    signal = signal * 0.9 + macd * 0.1;
    data.push({
      time: `${i}`,
      value: macd,
      signal: signal,
      histogram: macd - signal,
    });
  }
  
  return data;
}

function generateStochData(): IndicatorData[] {
  const data: IndicatorData[] = [];
  let k = 50;
  let d = 50;
  
  for (let i = 0; i < 50; i++) {
    k = Math.max(0, Math.min(100, k + (Math.random() - 0.5) * 15));
    d = d * 0.8 + k * 0.2;
    data.push({
      time: `${i}`,
      value: k,
      signal: d,
    });
  }
  
  return data;
}

export function TechnicalIndicators({ symbol = "BTC/USDT" }: TechnicalIndicatorsProps) {
  const [rsiData, setRsiData] = useState<IndicatorData[]>(generateRSIData);
  const [macdData, setMacdData] = useState<IndicatorData[]>(generateMACDData);
  const [stochData, setStochData] = useState<IndicatorData[]>(generateStochData);
  
  const currentRSI = rsiData[rsiData.length - 1]?.value || 50;
  const currentMACD = macdData[macdData.length - 1]?.histogram || 0;
  const currentK = stochData[stochData.length - 1]?.value || 50;
  
  const getRSISignal = (rsi: number) => {
    if (rsi > 70) return { label: "Overbought", color: "text-red-400", bg: "bg-red-500/20" };
    if (rsi < 30) return { label: "Oversold", color: "text-green-400", bg: "bg-green-500/20" };
    return { label: "Neutral", color: "text-gray-400", bg: "bg-gray-500/20" };
  };
  
  const getMACDSignal = (histogram: number) => {
    if (histogram > 50) return { label: "Strong Buy", color: "text-green-400", bg: "bg-green-500/20" };
    if (histogram > 0) return { label: "Buy", color: "text-green-300", bg: "bg-green-500/10" };
    if (histogram < -50) return { label: "Strong Sell", color: "text-red-400", bg: "bg-red-500/20" };
    if (histogram < 0) return { label: "Sell", color: "text-red-300", bg: "bg-red-500/10" };
    return { label: "Neutral", color: "text-gray-400", bg: "bg-gray-500/20" };
  };
  
  const rsiSignal = getRSISignal(currentRSI);
  const macdSignal = getMACDSignal(currentMACD);

  useEffect(() => {
    const interval = setInterval(() => {
      setRsiData(prev => {
        const newData = [...prev.slice(1)];
        const lastValue = prev[prev.length - 1].value;
        const newValue = Math.max(0, Math.min(100, lastValue + (Math.random() - 0.5) * 5));
        newData.push({ time: `${Date.now()}`, value: newValue });
        return newData;
      });
      
      setMacdData(prev => {
        const newData = [...prev.slice(1)];
        const last = prev[prev.length - 1];
        const newMacd = last.value + (Math.random() - 0.5) * 20;
        const newSignal = (last.signal || 0) * 0.9 + newMacd * 0.1;
        newData.push({
          time: `${Date.now()}`,
          value: newMacd,
          signal: newSignal,
          histogram: newMacd - newSignal,
        });
        return newData;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-gray-900/50 border-gray-800" data-testid="technical-indicators">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-300">Technical Indicators</CardTitle>
          <Badge variant="outline" className="text-xs border-gray-700">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* RSI */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">RSI (14)</span>
              <Badge className={`${rsiSignal.bg} ${rsiSignal.color} text-xs`}>
                {rsiSignal.label}
              </Badge>
            </div>
            <span className="text-sm font-mono text-white">{currentRSI.toFixed(2)}</span>
          </div>
          
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rsiData}>
                <defs>
                  <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis domain={[0, 100]} hide />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  fill="url(#rsiGradient)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="absolute h-full bg-gradient-to-r from-green-500 via-gray-500 to-red-500 opacity-30"
              style={{ width: '100%' }}
            />
            <div 
              className="absolute h-full w-1 bg-white rounded-full transition-all duration-300"
              style={{ left: `${currentRSI}%`, transform: 'translateX(-50%)' }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Oversold (30)</span>
            <span>Overbought (70)</span>
          </div>
        </div>

        {/* MACD */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">MACD (12, 26, 9)</span>
              <Badge className={`${macdSignal.bg} ${macdSignal.color} text-xs`}>
                {macdSignal.label}
              </Badge>
            </div>
            <span className={`text-sm font-mono ${currentMACD >= 0 ? "text-green-400" : "text-red-400"}`}>
              {currentMACD >= 0 ? "+" : ""}{currentMACD.toFixed(2)}
            </span>
          </div>
          
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={macdData}>
                <YAxis hide />
                <ReferenceLine y={0} stroke="#374151" />
                <Bar dataKey="histogram">
                  {macdData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={(entry.histogram || 0) >= 0 ? "#22c55e" : "#ef4444"} 
                    />
                  ))}
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  dot={false}
                  strokeWidth={1}
                />
                <Line 
                  type="monotone" 
                  dataKey="signal" 
                  stroke="#f59e0b" 
                  dot={false}
                  strokeWidth={1}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span className="text-gray-400">MACD</span>
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-yellow-500"></div>
              <span className="text-gray-400">Signal</span>
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gradient-to-t from-red-500 to-green-500 rounded-sm"></div>
              <span className="text-gray-400">Histogram</span>
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="pt-2 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Overall Signal</span>
            <div className="flex items-center gap-2">
              {currentMACD > 0 && currentRSI < 70 ? (
                <Badge className="bg-green-500/20 text-green-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Bullish
                </Badge>
              ) : currentMACD < 0 && currentRSI > 30 ? (
                <Badge className="bg-red-500/20 text-red-400">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  Bearish
                </Badge>
              ) : (
                <Badge className="bg-gray-500/20 text-gray-400">
                  Neutral
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TechnicalIndicators;
