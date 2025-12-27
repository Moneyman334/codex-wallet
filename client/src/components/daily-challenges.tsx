import { useState, useEffect } from "react";
import { Target, Gift, Clock, CheckCircle2, Lock, Zap, TrendingUp, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: typeof Target;
  reward: { xp: number; tokens?: number };
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  difficulty: "easy" | "medium" | "hard";
}

const DIFFICULTY_COLORS = {
  easy: "text-green-400 bg-green-500/10 border-green-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  hard: "text-red-400 bg-red-500/10 border-red-500/20",
};

export function DailyChallenges() {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState("");
  
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: "1",
      title: "First Trade of the Day",
      description: "Execute any trade to start your day",
      icon: Zap,
      reward: { xp: 50, tokens: 5 },
      progress: 1,
      target: 1,
      completed: true,
      claimed: false,
      difficulty: "easy",
    },
    {
      id: "2",
      title: "Volume Hunter",
      description: "Trade $1,000 in total volume today",
      icon: TrendingUp,
      reward: { xp: 150, tokens: 15 },
      progress: 650,
      target: 1000,
      completed: false,
      claimed: false,
      difficulty: "medium",
    },
    {
      id: "3",
      title: "Social Trader",
      description: "Check 3 whale movements",
      icon: Users,
      reward: { xp: 75 },
      progress: 2,
      target: 3,
      completed: false,
      claimed: false,
      difficulty: "easy",
    },
    {
      id: "4",
      title: "Diamond Hands",
      description: "Hold a position for 4 hours",
      icon: Wallet,
      reward: { xp: 200, tokens: 25 },
      progress: 2,
      target: 4,
      completed: false,
      claimed: false,
      difficulty: "hard",
    },
  ]);

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = (challengeId: string) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId ? { ...c, claimed: true } : c
      )
    );
    const challenge = challenges.find((c) => c.id === challengeId);
    if (challenge) {
      toast({
        title: "Reward Claimed!",
        description: `+${challenge.reward.xp} XP${challenge.reward.tokens ? ` & ${challenge.reward.tokens} CDX` : ""}`,
      });
    }
  };

  const completedCount = challenges.filter((c) => c.completed).length;
  const totalXP = challenges
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.reward.xp, 0);

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/10 border-purple-500/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-purple-400" />
            Daily Challenges
          </CardTitle>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            {timeLeft}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="text-gray-400">
            {completedCount}/{challenges.length} Complete
          </span>
          <span className="text-purple-400">
            +{totalXP} XP Earned
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {challenges.map((challenge) => {
          const Icon = challenge.icon;
          const progressPercent = Math.min((challenge.progress / challenge.target) * 100, 100);
          
          return (
            <div
              key={challenge.id}
              className={`p-3 rounded-lg border transition-all ${
                challenge.claimed
                  ? "bg-gray-800/50 border-gray-700/50 opacity-60"
                  : challenge.completed
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-gray-800/30 border-gray-700/50 hover:border-purple-500/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    challenge.completed
                      ? "bg-green-500/20 text-green-400"
                      : "bg-purple-500/20 text-purple-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">
                      {challenge.title}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${
                        DIFFICULTY_COLORS[challenge.difficulty]
                      }`}
                    >
                      {challenge.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {challenge.description}
                  </p>
                  
                  {!challenge.completed && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400">
                          {challenge.progress}/{challenge.target}
                        </span>
                        <span className="text-purple-400">
                          {progressPercent.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-1.5" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 text-xs">
                    <Gift className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400">{challenge.reward.xp} XP</span>
                    {challenge.reward.tokens && (
                      <span className="text-purple-400">+{challenge.reward.tokens}</span>
                    )}
                  </div>
                  
                  {challenge.claimed ? (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Claimed
                    </span>
                  ) : challenge.completed ? (
                    <Button
                      size="sm"
                      onClick={() => handleClaim(challenge.id)}
                      className="h-6 text-xs bg-green-600 hover:bg-green-700"
                      data-testid={`claim-challenge-${challenge.id}`}
                    >
                      Claim
                    </Button>
                  ) : (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default DailyChallenges;
