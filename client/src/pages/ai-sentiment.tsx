import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Twitter,
  Newspaper,
  BarChart3,
  Zap,
  AlertTriangle,
  Target,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface SentimentData {
  symbol: string;
  sentimentScore: string;
  sentimentLabel: string;
  twitterSentiment?: string;
  newsSentiment?: string;
  onchainSentiment?: string;
  fearGreedIndex?: string;
  topKeywords?: string[];
  newsHeadlines?: { title: string; sentiment: string; source: string }[];
  socialMentions?: string;
  priceAtSnapshot?: string;
  volumeChange24h?: string;
  prediction?: string;
  confidence?: string;
}

export default function AISentimentPage() {
  const [selectedAsset, setSelectedAsset] = useState("BTC");

  const { data: sentiment, isLoading, refetch } = useQuery<SentimentData>({
    queryKey: ["/api/ai/sentiment", selectedAsset],
    refetchInterval: 60000,
  });

  const { data: marketOverview } = useQuery<any>({
    queryKey: ["/api/ai/market-overview"],
    refetchInterval: 60000,
  });

  const getSentimentColor = (label: string) => {
    const l = label?.toLowerCase();
    if (l === 'extreme_greed' || l === 'greed') return 'text-green-400';
    if (l === 'extreme_fear' || l === 'fear') return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentGradient = (score: number) => {
    if (score >= 70) return 'from-green-500 to-emerald-400';
    if (score >= 55) return 'from-green-400 to-lime-400';
    if (score >= 45) return 'from-yellow-400 to-amber-400';
    if (score >= 30) return 'from-orange-400 to-red-400';
    return 'from-red-500 to-rose-600';
  };

  const getPredictionIcon = (prediction: string) => {
    if (prediction === 'bullish') return <TrendingUp className="w-8 h-8 text-green-400" />;
    if (prediction === 'bearish') return <TrendingDown className="w-8 h-8 text-red-400" />;
    return <Activity className="w-8 h-8 text-yellow-400" />;
  };

  const mockSentiment: SentimentData = {
    symbol: "BTC",
    sentimentScore: "68",
    sentimentLabel: "greed",
    twitterSentiment: "72",
    newsSentiment: "65",
    onchainSentiment: "71",
    fearGreedIndex: "68",
    topKeywords: ["ETF", "halving", "bullrun", "institutional", "adoption", "ATH"],
    newsHeadlines: [
      { title: "Bitcoin ETF sees record inflows for third consecutive week", sentiment: "positive", source: "Bloomberg" },
      { title: "Major bank announces Bitcoin custody services", sentiment: "positive", source: "Reuters" },
      { title: "Analysts predict new ATH before Q2 2025", sentiment: "positive", source: "CoinDesk" },
      { title: "Regulatory clarity expected in coming months", sentiment: "neutral", source: "The Block" },
    ],
    socialMentions: "2,450,000",
    priceAtSnapshot: "97,450",
    volumeChange24h: "+24.5",
    prediction: "bullish",
    confidence: "78",
  };

  const displayData = sentiment || mockSentiment;
  const score = parseInt(displayData.sentimentScore);

  const assets = ["BTC", "ETH", "SOL", "XRP", "ADA", "OVERALL"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">AI Market Sentiment</h1>
              <p className="text-gray-400">Real-time analysis powered by advanced AI</p>
            </div>
            <Badge className="ml-auto bg-purple-500/20 text-purple-400 border-purple-500/50">
              <Sparkles className="w-3 h-3 mr-1" />
              AI POWERED
            </Badge>
          </div>
        </div>

        {/* Asset Selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {assets.map(asset => (
            <Button
              key={asset}
              variant={selectedAsset === asset ? "default" : "outline"}
              onClick={() => setSelectedAsset(asset)}
              className={selectedAsset === asset ? "bg-purple-600" : "border-gray-600 text-gray-300"}
              data-testid={`asset-${asset.toLowerCase()}`}
            >
              {asset}
            </Button>
          ))}
          <Button 
            variant="ghost" 
            onClick={() => refetch()}
            className="ml-auto text-purple-400"
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Analysis
          </Button>
        </div>

        {/* Main Sentiment Gauge */}
        <Card className="bg-gradient-to-br from-gray-900/80 to-purple-900/40 border-purple-500/30 mb-8">
          <CardContent className="pt-8">
            <div className="grid gap-8 md:grid-cols-3">
              {/* Sentiment Gauge */}
              <div className="text-center">
                <div className="relative w-48 h-48 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" fill="none" stroke="#1f2937" strokeWidth="12" />
                    <circle 
                      cx="96" cy="96" r="88" 
                      fill="none" 
                      stroke="url(#gradient)" 
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${score * 5.5} 550`}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="50%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-bold ${getSentimentColor(displayData.sentimentLabel)}`}>
                      {displayData.sentimentScore}
                    </span>
                    <span className="text-sm text-gray-400 uppercase">{displayData.sentimentLabel?.replace('_', ' ')}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white">{displayData.symbol} Sentiment</h3>
              </div>

              {/* Sentiment Breakdown */}
              <div className="space-y-4">
                <h4 className="font-semibold text-white mb-4">Sentiment Sources</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 text-gray-400">
                        <Twitter className="w-4 h-4 text-blue-400" />
                        Social Media
                      </span>
                      <span className="text-white">{displayData.twitterSentiment}%</span>
                    </div>
                    <Progress value={parseInt(displayData.twitterSentiment || "0")} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 text-gray-400">
                        <Newspaper className="w-4 h-4 text-purple-400" />
                        News Sentiment
                      </span>
                      <span className="text-white">{displayData.newsSentiment}%</span>
                    </div>
                    <Progress value={parseInt(displayData.newsSentiment || "0")} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 text-gray-400">
                        <BarChart3 className="w-4 h-4 text-green-400" />
                        On-Chain Activity
                      </span>
                      <span className="text-white">{displayData.onchainSentiment}%</span>
                    </div>
                    <Progress value={parseInt(displayData.onchainSentiment || "0")} className="h-2" />
                  </div>
                </div>
              </div>

              {/* AI Prediction */}
              <div className="text-center">
                <h4 className="font-semibold text-white mb-4">AI Prediction</h4>
                <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${getSentimentGradient(parseInt(displayData.confidence || "50"))} flex items-center justify-center mb-4`}>
                  {getPredictionIcon(displayData.prediction || 'neutral')}
                </div>
                <p className={`text-2xl font-bold capitalize ${displayData.prediction === 'bullish' ? 'text-green-400' : displayData.prediction === 'bearish' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {displayData.prediction}
                </p>
                <p className="text-sm text-gray-400">{displayData.confidence}% confidence</p>
                <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Price at Analysis</span>
                    <span className="text-white font-semibold">${parseInt(displayData.priceAtSnapshot || "0").toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-400">24h Volume Change</span>
                    <span className={`font-semibold ${parseFloat(displayData.volumeChange24h || "0") >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {displayData.volumeChange24h}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Trending Keywords */}
          <Card className="bg-black/40 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Trending Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2" data-testid="keywords-container">
                {displayData.topKeywords?.map((keyword, idx) => (
                  <Badge 
                    key={idx} 
                    className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-sm py-1 px-3"
                    data-testid={`keyword-${idx}`}
                  >
                    #{keyword}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">24h Social Mentions</span>
                  <span className="text-xl font-bold text-white">{displayData.socialMentions}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* News Headlines */}
          <Card className="bg-black/40 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-blue-400" />
                Top Headlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3" data-testid="headlines-container">
                {displayData.newsHeadlines?.map((headline, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50"
                    data-testid={`headline-${idx}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-2 ${headline.sentiment === 'positive' ? 'bg-green-400' : headline.sentiment === 'negative' ? 'bg-red-400' : 'bg-yellow-400'}`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{headline.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{headline.source}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fear & Greed Index */}
        <Card className="bg-black/40 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              Crypto Fear & Greed Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-8 rounded-full overflow-hidden bg-gradient-to-r from-red-500 via-yellow-500 to-green-500">
              <div 
                className="absolute top-0 h-full w-1 bg-white shadow-lg"
                style={{ left: `${parseInt(displayData.fearGreedIndex || "50")}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-sm font-bold">
                  {displayData.fearGreedIndex}
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Extreme Fear</span>
              <span>Fear</span>
              <span>Neutral</span>
              <span>Greed</span>
              <span>Extreme Greed</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
