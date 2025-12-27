import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Trophy, 
  Users, 
  Clock, 
  Flame,
  Star,
  Zap,
  Target,
  DollarSign,
  Calendar,
  Award,
  Crown,
  Medal,
  TrendingUp,
  Activity
} from "lucide-react";

interface Competition {
  id: string;
  name: string;
  description: string;
  type: string;
  entryFee: string;
  prizePool: string;
  prizeDistribution?: Record<string, string>;
  maxParticipants?: string;
  currentParticipants?: number;
  startTime: string;
  endTime: string;
  status: string;
  sponsorName?: string;
  sponsorLogo?: string;
}

interface CompetitionEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: string;
  pnl: string;
  tradesCount: string;
}

export default function TradingCompetitionsPage() {
  const { toast } = useToast();
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null);

  const { data: competitions, isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
    refetchInterval: 30000,
  });

  const { data: leaderboard } = useQuery<CompetitionEntry[]>({
    queryKey: ["/api/competitions", selectedCompetition, "leaderboard"],
    enabled: !!selectedCompetition,
    refetchInterval: 10000,
  });

  const joinMutation = useMutation({
    mutationFn: async (competitionId: string) => {
      return apiRequest('POST', `/api/competitions/${competitionId}/join`);
    },
    onSuccess: () => {
      toast({
        title: "Joined Competition!",
        description: "You're now competing. Good luck!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Join",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'ended': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pnl': return <TrendingUp className="w-5 h-5" />;
      case 'volume': return <Activity className="w-5 h-5" />;
      case 'winrate': return <Target className="w-5 h-5" />;
      case 'streak': return <Flame className="w-5 h-5" />;
      default: return <Trophy className="w-5 h-5" />;
    }
  };

  const mockCompetitions: Competition[] = [
    {
      id: "1",
      name: "New Year Trading Battle",
      description: "Start 2025 with a bang! Compete for the highest P&L over 7 days.",
      type: "pnl",
      entryFee: "0",
      prizePool: "10000",
      currentParticipants: 847,
      maxParticipants: "1000",
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 8).toISOString(),
      status: "upcoming",
      sponsorName: "CODEX",
    },
    {
      id: "2",
      name: "Weekly Volume Kings",
      description: "Trade the most volume to claim the crown. Weekly recurring competition.",
      type: "volume",
      entryFee: "0",
      prizePool: "5000",
      currentParticipants: 432,
      startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 5).toISOString(),
      status: "active",
    },
    {
      id: "3",
      name: "Precision Trader Challenge",
      description: "Maintain the highest win rate over 50+ trades to win.",
      type: "winrate",
      entryFee: "100",
      prizePool: "25000",
      currentParticipants: 156,
      maxParticipants: "200",
      startTime: new Date(Date.now() - 86400000).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 13).toISOString(),
      status: "active",
      sponsorName: "DeFi Labs",
    },
    {
      id: "4",
      name: "Hot Streak Masters",
      description: "Build the longest winning streak. Every trade counts!",
      type: "streak",
      entryFee: "50",
      prizePool: "15000",
      currentParticipants: 289,
      startTime: new Date(Date.now() + 86400000 * 3).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 10).toISOString(),
      status: "upcoming",
    },
  ];

  const mockLeaderboard: CompetitionEntry[] = [
    { rank: 1, userId: "1", displayName: "TradeMaster", score: "45670", pnl: "+$45,670", tradesCount: "89" },
    { rank: 2, userId: "2", displayName: "CryptoNinja", score: "38420", pnl: "+$38,420", tradesCount: "76" },
    { rank: 3, userId: "3", displayName: "WhaleCatcher", score: "29850", pnl: "+$29,850", tradesCount: "54" },
    { rank: 4, userId: "4", displayName: "DeFiKing", score: "23100", pnl: "+$23,100", tradesCount: "67" },
    { rank: 5, userId: "5", displayName: "TokenHunter", score: "18900", pnl: "+$18,900", tradesCount: "45" },
  ];

  const displayCompetitions = competitions?.length ? competitions : mockCompetitions;
  const displayLeaderboard = leaderboard || mockLeaderboard;
  const activeCompetitions = displayCompetitions.filter(c => c.status === 'active');
  const upcomingCompetitions = displayCompetitions.filter(c => c.status === 'upcoming');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-orange-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-orange-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
              TRADING COMPETITIONS
            </h1>
            <Trophy className="w-12 h-12 text-orange-400" />
          </div>
          <p className="text-gray-400 text-lg">Compete against the best traders and win massive prizes</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="bg-black/40 border-orange-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Competitions</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-active">{activeCompetitions.length}</p>
                </div>
                <Flame className="w-10 h-10 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-blue-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Upcoming</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-upcoming">{upcomingCompetitions.length}</p>
                </div>
                <Calendar className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Prize Pool</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-prizes">
                    ${displayCompetitions.reduce((sum, c) => sum + parseInt(c.prizePool || "0"), 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Competitors</p>
                  <p className="text-3xl font-bold text-white" data-testid="stat-competitors">
                    {displayCompetitions.reduce((sum, c) => sum + (c.currentParticipants || 0), 0).toLocaleString()}
                  </p>
                </div>
                <Users className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-black/40 border border-gray-700">
            <TabsTrigger value="active" data-testid="tab-active">
              <Flame className="w-4 h-4 mr-2" />
              Active
            </TabsTrigger>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              <Clock className="w-4 h-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="ended" data-testid="tab-ended">
              <Trophy className="w-4 h-4 mr-2" />
              Ended
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2" data-testid="active-competitions">
              {activeCompetitions.map((competition) => (
                <Card key={competition.id} className="bg-black/40 border-orange-500/30 overflow-hidden" data-testid={`competition-${competition.id}`}>
                  <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500"></div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-500/20 rounded-xl">
                          {getTypeIcon(competition.type)}
                        </div>
                        <div>
                          <CardTitle className="text-white">{competition.name}</CardTitle>
                          <CardDescription className="text-gray-400">{competition.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(competition.status)}>
                        <Activity className="w-3 h-3 mr-1" />
                        LIVE
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-900/50 rounded-lg">
                        <p className="text-xs text-gray-400">Prize Pool</p>
                        <p className="text-xl font-bold text-green-400">${parseInt(competition.prizePool).toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-gray-900/50 rounded-lg">
                        <p className="text-xs text-gray-400">Entry Fee</p>
                        <p className="text-xl font-bold text-white">
                          {competition.entryFee === "0" ? "FREE" : `$${competition.entryFee}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {competition.currentParticipants} participants
                      </span>
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Ends {formatDistanceToNow(new Date(competition.endTime), { addSuffix: true })}
                      </span>
                    </div>
                    {competition.maxParticipants && (
                      <Progress 
                        value={(competition.currentParticipants! / parseInt(competition.maxParticipants)) * 100} 
                        className="h-2"
                      />
                    )}
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500"
                      onClick={() => joinMutation.mutate(competition.id)}
                      disabled={joinMutation.isPending}
                      data-testid={`button-join-${competition.id}`}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Join Now
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-gray-600"
                      onClick={() => setSelectedCompetition(competition.id)}
                      data-testid={`button-view-${competition.id}`}
                    >
                      Leaderboard
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2" data-testid="upcoming-competitions">
              {upcomingCompetitions.map((competition) => (
                <Card key={competition.id} className="bg-black/40 border-blue-500/30 overflow-hidden" data-testid={`competition-${competition.id}`}>
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                          {getTypeIcon(competition.type)}
                        </div>
                        <div>
                          <CardTitle className="text-white">{competition.name}</CardTitle>
                          <CardDescription className="text-gray-400">{competition.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(competition.status)}>
                        <Clock className="w-3 h-3 mr-1" />
                        UPCOMING
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-900/50 rounded-lg">
                        <p className="text-xs text-gray-400">Prize Pool</p>
                        <p className="text-xl font-bold text-green-400">${parseInt(competition.prizePool).toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-gray-900/50 rounded-lg">
                        <p className="text-xs text-gray-400">Starts</p>
                        <p className="text-lg font-bold text-white">
                          {format(new Date(competition.startTime), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      onClick={() => joinMutation.mutate(competition.id)}
                      disabled={joinMutation.isPending}
                      data-testid={`button-register-${competition.id}`}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Register Early
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ended">
            <Card className="bg-black/40 border-gray-700">
              <CardContent className="py-12 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">No Ended Competitions</h3>
                <p className="text-gray-400">Past competition results will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Selected Competition Leaderboard */}
        {selectedCompetition && (
          <Card className="bg-black/40 border-gray-700 mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Competition Leaderboard
                </CardTitle>
                <Button variant="ghost" onClick={() => setSelectedCompetition(null)}>Close</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3" data-testid="competition-leaderboard">
                {displayLeaderboard.map((entry, idx) => (
                  <div 
                    key={entry.userId}
                    className="flex items-center gap-4 p-4 bg-gray-900/40 rounded-lg"
                    data-testid={`leaderboard-entry-${idx}`}
                  >
                    <div className="w-10 text-center">
                      {entry.rank === 1 ? <Crown className="w-6 h-6 text-yellow-400 mx-auto" /> :
                       entry.rank === 2 ? <Medal className="w-6 h-6 text-gray-300 mx-auto" /> :
                       entry.rank === 3 ? <Medal className="w-6 h-6 text-amber-600 mx-auto" /> :
                       <span className="text-lg font-bold text-gray-400">#{entry.rank}</span>}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={entry.avatarUrl} />
                      <AvatarFallback>{entry.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{entry.displayName}</p>
                      <p className="text-sm text-gray-400">{entry.tradesCount} trades</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-400">{entry.pnl}</p>
                      <p className="text-sm text-gray-400">Score: {parseInt(entry.score).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
