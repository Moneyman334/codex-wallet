import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Vote, ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle, TrendingUp, Users, Wallet, Crown } from "lucide-react";
import { format } from "date-fns";

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'failed' | 'executed' | 'cancelled';
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  quorum: string;
  startTime: string;
  endTime: string;
  executionTime?: string;
  createdAt: string;
}

interface VotingPower {
  wallet: string;
  power: string;
  hasVoted: boolean;
  voteChoice?: 'for' | 'against' | 'abstain';
}

export default function DAOGovernancePage() {
  const { account } = useWeb3();
  const { toast } = useToast();
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [newProposalOpen, setNewProposalOpen] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");

  const { data: proposals } = useQuery<Proposal[]>({
    queryKey: ['/api/dao/proposals'],
  });

  const { data: votingPower } = useQuery<VotingPower>({
    queryKey: ['/api/dao/voting-power', account],
    enabled: !!account,
  });

  const { data: treasuryBalance } = useQuery<{ balance: string; usd: string }>({
    queryKey: ['/api/dao/treasury'],
  });

  const createProposalMutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Connect wallet to create proposal");
      return apiRequest('POST', '/api/dao/proposals', {
        title: proposalTitle,
        description: proposalDescription,
        proposer: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "Proposal Created!",
        description: "Your proposal is now open for voting",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dao/proposals'] });
      setNewProposalOpen(false);
      setProposalTitle("");
      setProposalDescription("");
    },
    onError: (error: Error) => {
      toast({
        title: "Proposal Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ proposalId, choice }: { proposalId: string; choice: 'for' | 'against' | 'abstain' }) => {
      if (!account) throw new Error("Connect wallet to vote");
      return apiRequest('POST', '/api/dao/vote', {
        proposalId,
        wallet: account,
        choice,
      });
    },
    onSuccess: () => {
      toast({
        title: "Vote Recorded!",
        description: "Your vote has been successfully cast",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dao/proposals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dao/voting-power', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Voting Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const executeProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      return apiRequest('POST', '/api/dao/execute', {
        proposalId,
        executor: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "Proposal Executed!",
        description: "The proposal has been successfully executed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dao/proposals'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'passed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'executed': return 'bg-purple-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4" />;
      case 'passed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'executed': return <Crown className="h-4 w-4" />;
      default: return null;
    }
  };

  const calculateVotePercentage = (votes: string, total: string) => {
    const votesNum = parseFloat(votes);
    const totalNum = parseFloat(total);
    return totalNum > 0 ? (votesNum / totalNum) * 100 : 0;
  };

  const activeProposals = proposals?.filter(p => p.status === 'active') || [];
  const passedProposals = proposals?.filter(p => p.status === 'passed' || p.status === 'executed') || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">DAO Governance</h1>
        <p className="text-muted-foreground">Decentralized decision making for the empire</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Treasury Balance</p>
                <p className="text-3xl font-bold" data-testid="text-treasury-balance">
                  ${treasuryBalance?.usd || '0'}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Proposals</p>
                <p className="text-3xl font-bold">{activeProposals.length}</p>
              </div>
              <Vote className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Voting Power</p>
                <p className="text-3xl font-bold" data-testid="text-voting-power">
                  {votingPower?.power || '0'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Proposals</p>
                <p className="text-3xl font-bold">{proposals?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!account ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Vote className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">DAO Governance</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to participate in governance
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6">
            <Dialog open={newProposalOpen} onOpenChange={setNewProposalOpen}>
              <DialogTrigger asChild>
                <Button size="lg" data-testid="button-create-proposal">
                  <Vote className="h-4 w-4 mr-2" />
                  Create New Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Governance Proposal</DialogTitle>
                  <DialogDescription>
                    Submit a proposal for the DAO to vote on
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Proposal Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Allocate 100 ETH for Marketing"
                      value={proposalTitle}
                      onChange={(e) => setProposalTitle(e.target.value)}
                      data-testid="input-proposal-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide detailed information about your proposal..."
                      value={proposalDescription}
                      onChange={(e) => setProposalDescription(e.target.value)}
                      rows={8}
                      data-testid="textarea-proposal-description"
                    />
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Your Voting Power: <span className="font-bold">{votingPower?.power || '0'}</span></p>
                    <p className="text-xs text-muted-foreground">
                      Proposals require {votingPower?.power ? '100' : '0'} minimum voting power to create
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => createProposalMutation.mutate()}
                    disabled={!proposalTitle || !proposalDescription || createProposalMutation.isPending}
                    data-testid="button-submit-proposal"
                  >
                    {createProposalMutation.isPending ? 'Creating...' : 'Submit Proposal'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active ({activeProposals.length})</TabsTrigger>
              <TabsTrigger value="passed">Passed ({passedProposals.length})</TabsTrigger>
              <TabsTrigger value="all">All Proposals ({proposals?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeProposals.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Vote className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-xl font-semibold mb-2">No Active Proposals</h3>
                    <p className="text-muted-foreground mb-6">Be the first to create a proposal</p>
                    <Button onClick={() => setNewProposalOpen(true)}>Create Proposal</Button>
                  </CardContent>
                </Card>
              ) : (
                activeProposals.map(proposal => {
                  const totalVotes = parseFloat(proposal.votesFor) + parseFloat(proposal.votesAgainst) + parseFloat(proposal.votesAbstain);
                  const forPercentage = calculateVotePercentage(proposal.votesFor, String(totalVotes));
                  const againstPercentage = calculateVotePercentage(proposal.votesAgainst, String(totalVotes));
                  const quorumProgress = calculateVotePercentage(String(totalVotes), proposal.quorum);
                  const timeLeft = new Date(proposal.endTime).getTime() - new Date().getTime();
                  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));

                  return (
                    <Card key={proposal.id} data-testid={`proposal-${proposal.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{proposal.title}</CardTitle>
                            <CardDescription className="line-clamp-2">{proposal.description}</CardDescription>
                          </div>
                          <Badge className={getStatusColor(proposal.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(proposal.status)}
                              {proposal.status}
                            </span>
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Proposed by: {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span>
                          <span>•</span>
                          <span>{hoursLeft}h remaining</span>
                        </div>

                        {/* Vote Progress */}
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <ThumbsUp className="h-4 w-4 text-green-500" />
                              For: {forPercentage.toFixed(1)}%
                            </span>
                            <span className="font-semibold">{proposal.votesFor} votes</span>
                          </div>
                          <Progress value={forPercentage} className="h-2" />

                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <ThumbsDown className="h-4 w-4 text-red-500" />
                              Against: {againstPercentage.toFixed(1)}%
                            </span>
                            <span className="font-semibold">{proposal.votesAgainst} votes</span>
                          </div>
                          <Progress value={againstPercentage} className="h-2" />

                          <div className="pt-2 border-t">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Quorum Progress</span>
                              <span className="font-semibold">{quorumProgress.toFixed(1)}%</span>
                            </div>
                            <Progress value={quorumProgress} className="h-2" />
                          </div>
                        </div>

                        {/* Voting Buttons */}
                        {votingPower && !votingPower.hasVoted && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => voteMutation.mutate({ proposalId: proposal.id, choice: 'for' })}
                              disabled={voteMutation.isPending}
                              data-testid={`button-vote-for-${proposal.id}`}
                            >
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Vote For
                            </Button>
                            <Button
                              className="flex-1 bg-red-600 hover:bg-red-700"
                              onClick={() => voteMutation.mutate({ proposalId: proposal.id, choice: 'against' })}
                              disabled={voteMutation.isPending}
                              data-testid={`button-vote-against-${proposal.id}`}
                            >
                              <ThumbsDown className="h-4 w-4 mr-2" />
                              Vote Against
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => voteMutation.mutate({ proposalId: proposal.id, choice: 'abstain' })}
                              disabled={voteMutation.isPending}
                            >
                              Abstain
                            </Button>
                          </div>
                        )}

                        {votingPower?.hasVoted && (
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <p className="text-sm font-semibold">You voted: {votingPower.voteChoice?.toUpperCase()}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="passed" className="space-y-4">
              {passedProposals.map(proposal => (
                <Card key={proposal.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{proposal.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{proposal.description}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(proposal.status)}>
                        {proposal.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Final Results</p>
                        <p className="font-semibold text-green-600">For: {proposal.votesFor} votes</p>
                        <p className="font-semibold text-red-600">Against: {proposal.votesAgainst} votes</p>
                      </div>
                      {proposal.status === 'passed' && (
                        <Button
                          onClick={() => executeProposalMutation.mutate(proposal.id)}
                          disabled={executeProposalMutation.isPending}
                          data-testid={`button-execute-${proposal.id}`}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Execute
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {proposals?.map(proposal => (
                <Card key={proposal.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{proposal.title}</h3>
                          <Badge className={getStatusColor(proposal.status)}>
                            {proposal.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {proposal.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{format(new Date(proposal.createdAt), 'MMM d, yyyy')}</span>
                          <span>•</span>
                          <span>For: {proposal.votesFor}</span>
                          <span>•</span>
                          <span>Against: {proposal.votesAgainst}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
