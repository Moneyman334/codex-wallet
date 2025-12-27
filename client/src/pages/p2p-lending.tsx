import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWeb3 } from "@/hooks/use-web3";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Banknote, PiggyBank, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";

interface LoanRequest {
  id: string;
  borrower: string;
  amount: string;
  collateral: string;
  collateralToken: string;
  interestRate: string;
  duration: number;
  purpose: string;
  status: 'open' | 'funded' | 'active' | 'repaid' | 'defaulted';
  fundedAmount: string;
  repaidAmount: string;
  dueDate?: string;
  createdAt: string;
}

interface LendingPosition {
  id: string;
  lender: string;
  loanId: string;
  amount: string;
  interestEarned: string;
  status: 'active' | 'completed' | 'defaulted';
  startDate: string;
  endDate?: string;
}

export default function P2PLendingPage() {
  const { account } = useWeb3();
  const { toast } = useToast();
  const [selectedLoan, setSelectedLoan] = useState<LoanRequest | null>(null);
  const [lendAmount, setLendAmount] = useState("");
  const [newLoanOpen, setNewLoanOpen] = useState(false);
  
  // Loan request form
  const [loanAmount, setLoanAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [collateralToken, setCollateralToken] = useState("ETH");
  const [interestRate, setInterestRate] = useState("10");
  const [duration, setDuration] = useState("30");
  const [purpose, setPurpose] = useState("");

  const { data: loanRequests } = useQuery<LoanRequest[]>({
    queryKey: ['/api/lending/requests'],
  });

  const { data: myLoans } = useQuery<LoanRequest[]>({
    queryKey: ['/api/lending/my-loans', account],
    enabled: !!account,
  });

  const { data: myLendings } = useQuery<LendingPosition[]>({
    queryKey: ['/api/lending/my-positions', account],
    enabled: !!account,
  });

  const createLoanMutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Connect wallet to request loan");
      return apiRequest('POST', '/api/lending/requests', {
        borrower: account,
        amount: loanAmount,
        collateral: collateralAmount,
        collateralToken,
        interestRate,
        duration: parseInt(duration),
        purpose,
      });
    },
    onSuccess: () => {
      toast({
        title: "Loan Request Created!",
        description: "Your loan request is now open for lenders",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/lending/requests'] });
      setNewLoanOpen(false);
      setLoanAmount("");
      setCollateralAmount("");
      setPurpose("");
    },
    onError: (error: Error) => {
      toast({
        title: "Loan Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const lendMutation = useMutation({
    mutationFn: async ({ loanId, amount }: { loanId: string; amount: string }) => {
      if (!account) throw new Error("Connect wallet to lend");
      return apiRequest('POST', '/api/lending/lend', {
        loanId,
        lender: account,
        amount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Lending Successful!",
        description: "Your funds have been lent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/lending/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lending/my-positions', account] });
      setSelectedLoan(null);
      setLendAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Lending Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const repayMutation = useMutation({
    mutationFn: async (loanId: string) => {
      return apiRequest('POST', '/api/lending/repay', {
        loanId,
        borrower: account,
      });
    },
    onSuccess: () => {
      toast({
        title: "Loan Repaid!",
        description: "Your loan has been successfully repaid",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/lending/my-loans', account] });
    },
    onError: (error: Error) => {
      toast({
        title: "Repayment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'funded': return 'bg-green-500';
      case 'active': return 'bg-yellow-500';
      case 'repaid': return 'bg-purple-500';
      case 'defaulted': return 'bg-red-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateTotalInterest = (amount: string, rate: string, days: number) => {
    const principal = parseFloat(amount);
    const rateDecimal = parseFloat(rate) / 100;
    const interest = principal * rateDecimal * (days / 365);
    return interest.toFixed(4);
  };

  const totalBorrowed = myLoans?.reduce((sum, loan) => sum + parseFloat(loan.amount), 0) || 0;
  const totalLent = myLendings?.reduce((sum, pos) => sum + parseFloat(pos.amount), 0) || 0;
  const totalInterestEarned = myLendings?.reduce((sum, pos) => sum + parseFloat(pos.interestEarned), 0) || 0;

  const openLoans = loanRequests?.filter(l => l.status === 'open') || [];
  const activeLoans = myLoans?.filter(l => l.status === 'active') || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">P2P Lending</h1>
        <p className="text-muted-foreground">Decentralized peer-to-peer lending platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Borrowed</p>
                <p className="text-3xl font-bold" data-testid="text-total-borrowed">
                  ${totalBorrowed.toFixed(2)}
                </p>
              </div>
              <Banknote className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Lent</p>
                <p className="text-3xl font-bold" data-testid="text-total-lent">
                  ${totalLent.toFixed(2)}
                </p>
              </div>
              <PiggyBank className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Interest Earned</p>
                <p className="text-3xl font-bold text-green-600">
                  ${totalInterestEarned.toFixed(2)}
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
                <p className="text-sm text-muted-foreground">Active Loans</p>
                <p className="text-3xl font-bold">{activeLoans.length}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!account ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">P2P Lending Platform</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to borrow or lend crypto
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-4 mb-6">
            <Dialog open={newLoanOpen} onOpenChange={setNewLoanOpen}>
              <DialogTrigger asChild>
                <Button size="lg" data-testid="button-request-loan">
                  <Banknote className="h-4 w-4 mr-2" />
                  Request Loan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Loan Request</DialogTitle>
                  <DialogDescription>
                    Request a loan from the lending pool
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="loan-amount">Loan Amount</Label>
                      <Input
                        id="loan-amount"
                        type="number"
                        placeholder="1000"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        data-testid="input-loan-amount"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="collateral-amount">Collateral Amount</Label>
                      <Input
                        id="collateral-amount"
                        type="number"
                        placeholder="1.5"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                        data-testid="input-collateral-amount"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="collateral-token">Collateral Token</Label>
                      <Select value={collateralToken} onValueChange={setCollateralToken}>
                        <SelectTrigger id="collateral-token">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ETH">ETH</SelectItem>
                          <SelectItem value="WBTC">WBTC</SelectItem>
                          <SelectItem value="USDC">USDC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                      <Input
                        id="interest-rate"
                        type="number"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        data-testid="input-interest-rate"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (days)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        data-testid="input-duration"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Loan Purpose</Label>
                    <Input
                      id="purpose"
                      placeholder="e.g., Business expansion, Trading capital..."
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      data-testid="input-purpose"
                    />
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total to Repay:</p>
                        <p className="text-xl font-bold">
                          ${loanAmount && interestRate && duration
                            ? (parseFloat(loanAmount) + parseFloat(calculateTotalInterest(loanAmount, interestRate, parseInt(duration)))).toFixed(2)
                            : '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Collateral Ratio:</p>
                        <p className="text-xl font-bold">
                          {loanAmount && collateralAmount
                            ? ((parseFloat(collateralAmount) / parseFloat(loanAmount)) * 100).toFixed(0)
                            : '0'}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => createLoanMutation.mutate()}
                    disabled={!loanAmount || !collateralAmount || createLoanMutation.isPending}
                    data-testid="button-submit-loan-request"
                  >
                    {createLoanMutation.isPending ? 'Creating...' : 'Create Loan Request'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="available" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="available">Available Loans ({openLoans.length})</TabsTrigger>
              <TabsTrigger value="my-loans">My Loans ({myLoans?.length || 0})</TabsTrigger>
              <TabsTrigger value="my-lendings">My Lendings ({myLendings?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-4">
              {openLoans.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-xl font-semibold mb-2">No Available Loans</h3>
                    <p className="text-muted-foreground">Check back later for lending opportunities</p>
                  </CardContent>
                </Card>
              ) : (
                openLoans.map(loan => {
                  const fundingProgress = (parseFloat(loan.fundedAmount) / parseFloat(loan.amount)) * 100;
                  const totalInterest = calculateTotalInterest(loan.amount, loan.interestRate, loan.duration);

                  return (
                    <Card key={loan.id} data-testid={`loan-${loan.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">${loan.amount} Loan Request</CardTitle>
                            <CardDescription>{loan.purpose}</CardDescription>
                          </div>
                          <Badge className={getStatusColor(loan.status)}>
                            {loan.status}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Interest Rate</p>
                            <p className="text-lg font-bold text-green-600">{loan.interestRate}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="text-lg font-bold">{loan.duration} days</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Collateral</p>
                            <p className="text-lg font-bold">{loan.collateral} {loan.collateralToken}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Est. Interest</p>
                            <p className="text-lg font-bold">${totalInterest}</p>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Funding Progress</span>
                            <span>{fundingProgress.toFixed(0)}%</span>
                          </div>
                          <Progress value={fundingProgress} />
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full" onClick={() => setSelectedLoan(loan)} data-testid={`button-lend-${loan.id}`}>
                              <PiggyBank className="h-4 w-4 mr-2" />
                              Lend Now
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Lend to This Loan</DialogTitle>
                              <DialogDescription>
                                Enter the amount you want to lend
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="lend-amount">Amount to Lend</Label>
                                <Input
                                  id="lend-amount"
                                  type="number"
                                  placeholder="100"
                                  value={lendAmount}
                                  onChange={(e) => setLendAmount(e.target.value)}
                                  data-testid="input-lend-amount"
                                />
                                <p className="text-sm text-muted-foreground">
                                  Remaining: ${(parseFloat(loan.amount) - parseFloat(loan.fundedAmount)).toFixed(2)}
                                </p>
                              </div>

                              {lendAmount && (
                                <div className="p-4 bg-muted rounded-lg">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm">Your Lending Amount:</span>
                                      <span className="font-semibold">${lendAmount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm">Expected Interest:</span>
                                      <span className="font-semibold text-green-600">
                                        ${calculateTotalInterest(lendAmount, loan.interestRate, loan.duration)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm">Total Return:</span>
                                      <span className="font-bold text-lg">
                                        ${(parseFloat(lendAmount) + parseFloat(calculateTotalInterest(lendAmount, loan.interestRate, loan.duration))).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <Button
                                className="w-full"
                                onClick={() => lendMutation.mutate({ loanId: loan.id, amount: lendAmount })}
                                disabled={!lendAmount || parseFloat(lendAmount) === 0 || lendMutation.isPending}
                                data-testid="button-confirm-lend"
                              >
                                {lendMutation.isPending ? 'Processing...' : 'Confirm Lending'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="my-loans" className="space-y-4">
              {!myLoans || myLoans.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Banknote className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-xl font-semibold mb-2">No Loan Requests</h3>
                    <p className="text-muted-foreground mb-6">You haven't requested any loans yet</p>
                    <Button onClick={() => setNewLoanOpen(true)}>Request a Loan</Button>
                  </CardContent>
                </Card>
              ) : (
                myLoans.map(loan => (
                  <Card key={loan.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">${loan.amount} Loan</h3>
                          <p className="text-sm text-muted-foreground">{loan.purpose}</p>
                        </div>
                        <Badge className={getStatusColor(loan.status)}>
                          {loan.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Interest Rate</p>
                          <p className="font-semibold">{loan.interestRate}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="font-semibold">{loan.duration} days</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Repaid</p>
                          <p className="font-semibold">${loan.repaidAmount}</p>
                        </div>
                        {loan.dueDate && (
                          <div>
                            <p className="text-sm text-muted-foreground">Due Date</p>
                            <p className="font-semibold">{format(new Date(loan.dueDate), 'MMM d, yyyy')}</p>
                          </div>
                        )}
                      </div>

                      {loan.status === 'active' && (
                        <Button
                          onClick={() => repayMutation.mutate(loan.id)}
                          disabled={repayMutation.isPending}
                          data-testid={`button-repay-${loan.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Repay Loan
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="my-lendings" className="space-y-4">
              {!myLendings || myLendings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <PiggyBank className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">You haven't lent to any loans yet</p>
                  </CardContent>
                </Card>
              ) : (
                myLendings.map(position => (
                  <Card key={position.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">${position.amount} Lent</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(position.startDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(position.status)}>
                            {position.status}
                          </Badge>
                          <p className="text-lg font-bold text-green-600 mt-2">
                            +${position.interestEarned}
                          </p>
                          <p className="text-xs text-muted-foreground">Interest Earned</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
