import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  Mail, 
  Phone, 
  Globe, 
  DollarSign, 
  Briefcase, 
  Calendar,
  ExternalLink,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BetaSignup {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  monthlyVolume: string;
  businessType: string;
  useCase: string;
  createdAt: string;
}

export default function ChaosPayAdminPage() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ signups: BetaSignup[]; total: number }>({
    queryKey: ["/api/codex-pay/beta-signups"],
  });

  const copyToClipboard = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const signups = data?.signups || [];
  const total = data?.total || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text mb-2">
              CODEX Pay Beta Applications
            </h1>
            <p className="text-gray-400">
              Founding partner applications for the first 10 merchants
            </p>
          </div>
          <Card className="bg-purple-500/10 border-purple-500/20 backdrop-blur-xl p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{total}</div>
              <div className="text-sm text-gray-400">Total Applications</div>
            </div>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.min(total, 10)}/10</div>
                <div className="text-sm text-gray-400">Spots Filled</div>
              </div>
            </div>
          </Card>

          <Card className="bg-black/40 border-green-500/20 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">Beta</div>
                <div className="text-sm text-gray-400">Promotional Credits*</div>
              </div>
            </div>
          </Card>

          <Card className="bg-black/40 border-blue-500/20 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <CheckCircle2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">Competitive</div>
                <div className="text-sm text-gray-400">Fee Rate*</div>
              </div>
            </div>
          </Card>

          <Card className="bg-black/40 border-orange-500/20 backdrop-blur-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Calendar className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">24h</div>
                <div className="text-sm text-gray-400">Response Time</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Applications Table */}
        {signups.length === 0 ? (
          <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl p-12 text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No Applications Yet
            </h3>
            <p className="text-gray-500">
              Waiting for the first founding merchants to apply...
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {signups.map((signup, index) => (
              <Card
                key={signup.id}
                className="bg-black/40 border-purple-500/20 backdrop-blur-xl p-6 hover:border-purple-400/40 transition-all"
                data-testid={`signup-card-${signup.id}`}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {signup.businessName}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            {signup.businessType}
                          </Badge>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            {signup.monthlyVolume}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Applied</div>
                      <div className="text-white font-medium">
                        {format(new Date(signup.createdAt), "MMM dd, yyyy")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(signup.createdAt), "hh:mm a")}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-purple-500/10">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Contact Name</div>
                        <div className="text-white font-medium">{signup.contactName}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`mailto:${signup.email}`}
                            className="text-purple-400 hover:text-purple-300 font-medium"
                          >
                            {signup.email}
                          </a>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(signup.email, signup.id, "Email")}
                            data-testid={`button-copy-email-${signup.id}`}
                          >
                            {copiedId === signup.id ? (
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {signup.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-500">Phone</div>
                          <a
                            href={`tel:${signup.phone}`}
                            className="text-white hover:text-purple-300 font-medium"
                          >
                            {signup.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {signup.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-500">Website</div>
                          <a
                            href={signup.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                          >
                            {signup.website.replace(/^https?:\/\//, "")}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Use Case */}
                  <div className="pt-4 border-t border-purple-500/10">
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">Use Case</div>
                        <p className="text-white leading-relaxed">{signup.useCase}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-purple-500/10 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => window.open(`mailto:${signup.email}?subject=CODEX Pay Beta - Welcome Call`, "_blank")}
                      data-testid={`button-email-${signup.id}`}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send Welcome Email
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-500/30"
                      onClick={() => copyToClipboard(signup.id, `id-${signup.id}`, "Application ID")}
                      data-testid={`button-copy-id-${signup.id}`}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy ID
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* CODEX Philosophy Footer */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-xl p-8 text-center">
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text mb-2">
            "Never knowing the outcome, only believe in yourself"
          </p>
          <p className="text-gray-400">
            Building the future together - one founding partner at a time
          </p>
        </Card>
      </div>
    </div>
  );
}
