import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, DollarSign, Target, Users, BarChart3, Calendar, Activity, Zap, Eye } from "lucide-react";
import type { MarketingCampaign } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function MarketingOverview() {
  const [userId] = useState("default-user");
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  const { data: campaigns = [], isLoading } = useQuery<MarketingCampaign[]>({
    queryKey: ['/api/marketing/campaigns', userId],
  });

  const activeCampaigns = useMemo(() => 
    campaigns.filter(c => c.status === 'active'), [campaigns]
  );

  const totalMetrics = useMemo(() => {
    const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budget || 0), 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + Number(c.spent || 0), 0);
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    return {
      totalBudget,
      totalSpent,
      budgetUtilization,
      activeCampaigns: activeCampaigns.length,
      totalCampaigns: campaigns.length,
      remaining: totalBudget - totalSpent
    };
  }, [campaigns, activeCampaigns]);

  const campaignsByType = useMemo(() => {
    const typeStats: Record<string, { count: number; budget: number; spent: number }> = {};
    
    campaigns.forEach(c => {
      if (!typeStats[c.type]) {
        typeStats[c.type] = { count: 0, budget: 0, spent: 0 };
      }
      typeStats[c.type].count++;
      typeStats[c.type].budget += Number(c.budget || 0);
      typeStats[c.type].spent += Number(c.spent || 0);
    });
    
    return Object.entries(typeStats).map(([type, stats]) => ({
      type,
      ...stats,
      roi: stats.spent > 0 ? ((stats.budget - stats.spent) / stats.spent * 100) : 0
    })).sort((a, b) => b.spent - a.spent);
  }, [campaigns]);

  const topPerformers = useMemo(() => {
    return [...campaigns]
      .sort((a, b) => {
        const aSpent = Number(a.spent || 0);
        const bSpent = Number(b.spent || 0);
        const aBudget = Number(a.budget || 0);
        const bBudget = Number(b.budget || 0);
        const aUtilization = aBudget > 0 ? (aSpent / aBudget) : 0;
        const bUtilization = bBudget > 0 ? (bSpent / bBudget) : 0;
        return bUtilization - aUtilization;
      })
      .slice(0, 5);
  }, [campaigns]);

  const campaignsByStatus = useMemo(() => {
    const statusCounts = {
      active: campaigns.filter(c => c.status === 'active').length,
      paused: campaigns.filter(c => c.status === 'paused').length,
      completed: campaigns.filter(c => c.status === 'completed').length,
      draft: campaigns.filter(c => c.status === 'draft').length
    };
    return statusCounts;
  }, [campaigns]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-background to-blue-900/20 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-muted-foreground">Loading marketing overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-background to-blue-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
              📈 Marketing Intelligence
            </h1>
            <Link href="/marketing">
              <Button variant="outline" className="border-purple-500/50" data-testid="button-manage-campaigns">
                Manage Campaigns
              </Button>
            </Link>
          </div>
          <p className="text-lg text-muted-foreground">
            Real-time performance analytics and strategic insights for CODEX dominance
          </p>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-950/50 to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-300">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-100" data-testid="text-total-budget">
                ${totalMetrics.totalBudget.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {totalMetrics.totalCampaigns} campaigns
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-950/50 to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-300">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-100" data-testid="text-total-spent">
                ${totalMetrics.totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalMetrics.budgetUtilization.toFixed(1)}% budget utilization
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-gradient-to-br from-green-950/50 to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-300">Remaining Budget</CardTitle>
              <Target className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-100" data-testid="text-remaining-budget">
                ${totalMetrics.remaining.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available for allocation
              </p>
            </CardContent>
          </Card>

          <Card className="border-pink-500/20 bg-gradient-to-br from-pink-950/50 to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-pink-300">Active Campaigns</CardTitle>
              <Zap className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-100" data-testid="text-active-campaigns">
                {totalMetrics.activeCampaigns}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently running
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Utilization Overview */}
        <Card className="border-purple-500/20 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              Budget Utilization Overview
            </CardTitle>
            <CardDescription>Track spending across all campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Overall Budget Progress</span>
                  <span className="text-sm font-bold" data-testid="text-budget-progress-percentage">
                    {totalMetrics.budgetUtilization.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={totalMetrics.budgetUtilization} 
                  className="h-3"
                  data-testid="progress-budget-utilization"
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>Spent: ${totalMetrics.totalSpent.toLocaleString()}</span>
                  <span>Budget: ${totalMetrics.totalBudget.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-950/30 to-transparent rounded-lg border border-blue-500/20">
                  <div>
                    <p className="text-sm text-muted-foreground">Average per Campaign</p>
                    <p className="text-2xl font-bold text-blue-400">
                      ${totalMetrics.totalCampaigns > 0 
                        ? (totalMetrics.totalSpent / totalMetrics.totalCampaigns).toFixed(0).toLocaleString()
                        : '0'}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-400/50" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-950/30 to-transparent rounded-lg border border-purple-500/20">
                  <div>
                    <p className="text-sm text-muted-foreground">Efficiency Rate</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {totalMetrics.budgetUtilization > 0 ? totalMetrics.budgetUtilization.toFixed(0) : '0'}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-400/50" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
            <TabsTrigger value="channels" data-testid="tab-channels">By Channel</TabsTrigger>
            <TabsTrigger value="status" data-testid="tab-status">Status Breakdown</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Top Performing Campaigns
                </CardTitle>
                <CardDescription>Campaigns with highest budget utilization</CardDescription>
              </CardHeader>
              <CardContent>
                {topPerformers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No campaigns yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topPerformers.map((campaign, index) => {
                      const budget = Number(campaign.budget || 0);
                      const spent = Number(campaign.spent || 0);
                      const utilization = budget > 0 ? (spent / budget * 100) : 0;
                      
                      return (
                        <div 
                          key={campaign.id} 
                          className="p-4 rounded-lg border border-purple-500/20 bg-gradient-to-r from-purple-950/20 to-transparent"
                          data-testid={`card-top-performer-${index}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-purple-400">#{index + 1}</span>
                                <h3 className="font-semibold text-lg" data-testid={`text-performer-name-${index}`}>
                                  {campaign.name}
                                </h3>
                                <Badge variant="outline" className="border-blue-500/50 text-blue-300">
                                  {campaign.type}
                                </Badge>
                              </div>
                              {campaign.description && (
                                <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                              )}
                            </div>
                            <Badge 
                              variant={campaign.status === 'active' ? 'default' : 'secondary'}
                              className={
                                campaign.status === 'active'
                                  ? 'bg-green-600/20 text-green-400 border-green-500/50'
                                  : 'bg-gray-600/20 text-gray-400 border-gray-500/50'
                              }
                            >
                              {campaign.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Budget</p>
                              <p className="text-lg font-bold text-purple-300">
                                ${budget.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Spent</p>
                              <p className="text-lg font-bold text-blue-300">
                                ${spent.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Utilization</p>
                              <p className="text-lg font-bold text-green-300" data-testid={`text-performer-utilization-${index}`}>
                                {utilization.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          <Progress value={utilization} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Channel Analysis Tab */}
          <TabsContent value="channels" className="space-y-6">
            <Card className="border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Campaign Type Analysis
                </CardTitle>
                <CardDescription>Performance breakdown by campaign type</CardDescription>
              </CardHeader>
              <CardContent>
                {campaignsByType.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No campaign data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaignsByType.map((typeData, index) => {
                      const utilization = typeData.budget > 0 ? (typeData.spent / typeData.budget * 100) : 0;
                      
                      return (
                        <div 
                          key={typeData.type} 
                          className="p-4 rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-950/20 to-transparent"
                          data-testid={`card-channel-${index}`}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg capitalize" data-testid={`text-channel-type-${index}`}>
                                {typeData.type}
                              </h3>
                              <Badge variant="outline" className="border-purple-500/50">
                                {typeData.count} {typeData.count === 1 ? 'campaign' : 'campaigns'}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Total Budget</p>
                              <p className="text-lg font-bold text-purple-300">
                                ${typeData.budget.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Spent</p>
                              <p className="text-lg font-bold text-blue-300">
                                ${typeData.spent.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Avg per Campaign</p>
                              <p className="text-lg font-bold text-cyan-300">
                                ${(typeData.spent / typeData.count).toFixed(0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Utilization</p>
                              <p className="text-lg font-bold text-green-300" data-testid={`text-channel-utilization-${index}`}>
                                {utilization.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          <Progress value={utilization} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-green-500/20 bg-gradient-to-br from-green-950/30 to-background">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-green-300 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Active
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-100" data-testid="text-status-active">
                    {campaignsByStatus.active}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Currently running</p>
                </CardContent>
              </Card>

              <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-950/30 to-background">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-yellow-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Paused
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-yellow-100" data-testid="text-status-paused">
                    {campaignsByStatus.paused}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Temporarily stopped</p>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-gradient-to-br from-blue-950/30 to-background">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-blue-300 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-100" data-testid="text-status-completed">
                    {campaignsByStatus.completed}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Finished campaigns</p>
                </CardContent>
              </Card>

              <Card className="border-gray-500/20 bg-gradient-to-br from-gray-950/30 to-background">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Draft
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-gray-100" data-testid="text-status-draft">
                    {campaignsByStatus.draft}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Not yet launched</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-purple-500/20">
              <CardHeader>
                <CardTitle>Campaign Lifecycle Distribution</CardTitle>
                <CardDescription>Overview of campaign status across your portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(campaignsByStatus).map(([status, count]) => {
                    const percentage = totalMetrics.totalCampaigns > 0 
                      ? (count / totalMetrics.totalCampaigns * 100) 
                      : 0;
                    
                    const colors = {
                      active: 'bg-green-500',
                      paused: 'bg-yellow-500',
                      completed: 'bg-blue-500',
                      draft: 'bg-gray-500'
                    };

                    return (
                      <div key={status}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{status}</span>
                          <span className="text-sm font-bold">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${colors[status as keyof typeof colors]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
