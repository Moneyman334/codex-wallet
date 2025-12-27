import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Infinity, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWeb3 } from "@/hooks/use-web3";
const memoryScrollPath = "";
const leviathanPath = "";

const RELIC_NFTS = [
  {
    id: "1",
    name: "The Leviathan Rises",
    description: "The dragon that is never forgotten. An ancient guardian rising from the depths, surrounded by eternal symbols of power and wisdom.",
    image: leviathanPath,
    rarity: "legendary",
    price: "0.5",
    maxSupply: 1,
    minted: 0,
    attributes: [
      { trait_type: "Element", value: "Water & Fire" },
      { trait_type: "Guardian Type", value: "Leviathan" },
      { trait_type: "Power Level", value: "Mythic" },
      { trait_type: "Era", value: "Primordial" },
      { trait_type: "Symbols", value: "108 Ancient Glyphs" }
    ]
  },
  {
    id: "2",
    name: "The Memory of the Many",
    description: "When he remembered this life, he remembered them all. The eternal scroll containing the wisdom of countless generations.",
    image: memoryScrollPath,
    rarity: "epic",
    price: "0.3",
    maxSupply: 11,
    minted: 0,
    attributes: [
      { trait_type: "Element", value: "Wisdom" },
      { trait_type: "Guardian Type", value: "Ancient Sage" },
      { trait_type: "Power Level", value: "Transcendent" },
      { trait_type: "Era", value: "Eternal" },
      { trait_type: "Symbols", value: "Infinity Mark" }
    ]
  }
];

const RARITY_COLORS = {
  legendary: "from-yellow-400 via-orange-500 to-red-500",
  epic: "from-purple-400 via-pink-500 to-purple-600",
  rare: "from-blue-400 via-cyan-500 to-blue-600",
  uncommon: "from-green-400 via-emerald-500 to-green-600",
  common: "from-gray-400 via-slate-500 to-gray-600"
};

const RARITY_GLOW = {
  legendary: "shadow-[0_0_30px_rgba(251,191,36,0.5)]",
  epic: "shadow-[0_0_25px_rgba(192,132,252,0.5)]",
  rare: "shadow-[0_0_20px_rgba(96,165,250,0.5)]",
  uncommon: "shadow-[0_0_15px_rgba(52,211,153,0.5)]",
  common: "shadow-[0_0_10px_rgba(148,163,184,0.3)]"
};

export default function MemoryOfTheManyPage() {
  const { toast } = useToast();
  const { account, isConnected } = useWeb3();
  const [selectedRelic, setSelectedRelic] = useState<typeof RELIC_NFTS[0] | null>(null);

  const mintMutation = useMutation({
    mutationFn: async (relicId: string) => {
      if (!isConnected || !account) {
        throw new Error("Please connect your wallet to mint");
      }

      const relic = RELIC_NFTS.find(r => r.id === relicId);
      if (!relic) throw new Error("Relic not found");
      
      return apiRequest("/api/nft/mint-memory-relic", {
        method: "POST",
        body: JSON.stringify({
          relicId,
          walletAddress: account
        })
      });
    },
    onSuccess: (data, relicId) => {
      const relic = RELIC_NFTS.find(r => r.id === relicId);
      toast({
        title: "🎉 Relic Minted!",
        description: `${relic?.name} has been added to your collection.`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/nft/my-relics"] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Minting Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const { data: myRelics } = useQuery({
    queryKey: ["/api/nft/my-relics"]
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-yellow-500/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1MSwgMTkxLCAzNiwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-sm">
              <Infinity className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-300 font-medium">Genesis Collection</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent animate-pulse">
              The Memory of the Many
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Ancient relic symbols preserved as digital artifacts.<br/>
              <span className="text-yellow-400 italic">When he remembered this life, he remembered them all.</span>
            </p>

            <div className="flex items-center justify-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">108</div>
                <div className="text-sm text-gray-400">Ancient Symbols</div>
              </div>
              <div className="h-12 w-px bg-yellow-500/30"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">12</div>
                <div className="text-sm text-gray-400">Total Supply</div>
              </div>
              <div className="h-12 w-px bg-yellow-500/30"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">7.5%</div>
                <div className="text-sm text-gray-400">Royalties</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="collection" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-slate-800/50 border border-yellow-500/20">
            <TabsTrigger value="collection" data-testid="tab-collection">Sacred Collection</TabsTrigger>
            <TabsTrigger value="my-relics" data-testid="tab-my-relics">My Relics</TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {RELIC_NFTS.map((relic) => (
                <Card 
                  key={relic.id}
                  className={`group relative overflow-hidden border-2 transition-all duration-500 hover:scale-[1.02] cursor-pointer ${
                    relic.rarity === 'legendary' 
                      ? 'border-yellow-500/50 bg-gradient-to-br from-slate-900/90 via-yellow-900/20 to-slate-900/90' 
                      : 'border-purple-500/50 bg-gradient-to-br from-slate-900/90 via-purple-900/20 to-slate-900/90'
                  } ${RARITY_GLOW[relic.rarity as keyof typeof RARITY_GLOW]}`}
                  onClick={() => setSelectedRelic(relic)}
                  data-testid={`relic-card-${relic.id}`}
                >
                  {/* Rarity Badge */}
                  <div className="absolute top-4 right-4 z-20">
                    <Badge className={`bg-gradient-to-r ${RARITY_COLORS[relic.rarity as keyof typeof RARITY_COLORS]} text-white border-0 shadow-lg uppercase tracking-wider`}>
                      {relic.rarity}
                    </Badge>
                  </div>

                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <img 
                      src={relic.image} 
                      alt={relic.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${
                      relic.rarity === 'legendary' 
                        ? 'from-yellow-900/50 via-transparent to-transparent' 
                        : 'from-purple-900/50 via-transparent to-transparent'
                    } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        {relic.name}
                        {relic.rarity === 'legendary' && <Flame className="w-6 h-6 text-yellow-400 animate-pulse" />}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">{relic.description}</p>
                    </div>

                    {/* Attributes */}
                    <div className="grid grid-cols-2 gap-2">
                      {relic.attributes.slice(0, 4).map((attr, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded-lg p-2 border border-slate-700">
                          <div className="text-xs text-gray-400">{attr.trait_type}</div>
                          <div className="text-sm text-white font-medium truncate">{attr.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Supply & Price */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                      <div>
                        <div className="text-sm text-gray-400">Supply</div>
                        <div className="text-lg font-bold text-white">{relic.minted} / {relic.maxSupply}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Price</div>
                        <div className="text-lg font-bold text-yellow-400">{relic.price} ETH</div>
                      </div>
                    </div>

                    {/* Mint Button */}
                    <Button 
                      className={`w-full bg-gradient-to-r ${RARITY_COLORS[relic.rarity as keyof typeof RARITY_COLORS]} hover:opacity-90 text-white font-bold py-6 text-lg shadow-lg`}
                      onClick={(e) => {
                        e.stopPropagation();
                        mintMutation.mutate(relic.id);
                      }}
                      disabled={!isConnected || mintMutation.isPending || relic.minted >= relic.maxSupply}
                      data-testid={`mint-button-${relic.id}`}
                    >
                      {!isConnected ? (
                        "Connect Wallet"
                      ) : mintMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 animate-spin" />
                          Minting...
                        </span>
                      ) : relic.minted >= relic.maxSupply ? (
                        "Sold Out"
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Mint Relic
                        </span>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-relics" className="space-y-8">
            {myRelics && myRelics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {myRelics.map((relic: any) => (
                  <Card key={relic.id} className="bg-slate-900/50 border-yellow-500/30 overflow-hidden">
                    <img src={relic.imageUrl} alt={relic.name} className="w-full aspect-square object-cover" />
                    <div className="p-4">
                      <h4 className="text-lg font-bold text-white">{relic.name}</h4>
                      <Badge className="mt-2 bg-yellow-500/20 text-yellow-400">
                        #{relic.tokenId}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Infinity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-400 mb-2">No Relics Yet</h3>
                <p className="text-gray-500">Mint your first sacred relic to begin your collection</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Selected Relic Modal */}
      {selectedRelic && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRelic(null)}
        >
          <Card className="max-w-4xl w-full bg-slate-900 border-yellow-500/50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="grid md:grid-cols-2 gap-6 p-6">
              <div>
                <img src={selectedRelic.image} alt={selectedRelic.name} className="w-full rounded-lg" />
              </div>
              <div className="space-y-4">
                <div>
                  <Badge className={`bg-gradient-to-r ${RARITY_COLORS[selectedRelic.rarity as keyof typeof RARITY_COLORS]} text-white mb-2`}>
                    {selectedRelic.rarity}
                  </Badge>
                  <h2 className="text-3xl font-bold text-white">{selectedRelic.name}</h2>
                  <p className="text-gray-300 mt-2">{selectedRelic.description}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">Attributes</h3>
                  {selectedRelic.attributes.map((attr, idx) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-slate-700">
                      <span className="text-gray-400">{attr.trait_type}</span>
                      <span className="text-white font-medium">{attr.value}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className={`w-full bg-gradient-to-r ${RARITY_COLORS[selectedRelic.rarity as keyof typeof RARITY_COLORS]} text-white py-6 text-lg`}
                  onClick={() => {
                    mintMutation.mutate(selectedRelic.id);
                    setSelectedRelic(null);
                  }}
                  data-testid="modal-mint-button"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Mint for {selectedRelic.price} ETH
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
