import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, BookOpen, ExternalLink, Lightbulb } from "lucide-react";

interface GlossaryTerm {
  term: string;
  shortDef: string;
  fullDef: string;
  example?: string;
  learnMoreUrl?: string;
}

const GLOSSARY: Record<string, GlossaryTerm> = {
  "gas": {
    term: "Gas Fee",
    shortDef: "Network transaction fee",
    fullDef: "Gas is the fee paid to blockchain validators for processing your transaction. It's measured in 'gwei' (small units of ETH). Higher gas = faster processing.",
    example: "A simple ETH transfer costs ~21,000 gas units. During busy times, gas prices spike.",
    learnMoreUrl: "https://ethereum.org/en/developers/docs/gas/"
  },
  "apy": {
    term: "APY",
    shortDef: "Annual Percentage Yield",
    fullDef: "APY shows your yearly earnings including compound interest. A 10% APY on $1,000 means $1,100 after one year if rates stay constant.",
    example: "Unlike APR, APY includes the effect of your earnings earning more earnings.",
  },
  "slippage": {
    term: "Slippage",
    shortDef: "Price difference during trade",
    fullDef: "Slippage is the difference between the expected price and the actual execution price. It happens because prices can move in the milliseconds between placing and executing your order.",
    example: "Setting 0.5% slippage tolerance means you accept up to 0.5% worse price than quoted.",
  },
  "defi": {
    term: "DeFi",
    shortDef: "Decentralized Finance",
    fullDef: "DeFi refers to financial services built on blockchain without traditional intermediaries like banks. It includes lending, borrowing, trading, and earning yield.",
    example: "Instead of a bank paying 0.5% on savings, DeFi protocols can offer higher yields through decentralized lending.",
  },
  "wallet": {
    term: "Crypto Wallet",
    shortDef: "Stores your crypto keys",
    fullDef: "A wallet doesn't actually store cryptocurrency - it stores the private keys that prove you own crypto on the blockchain. 'Not your keys, not your coins.'",
    example: "A browser-based hot wallet (online) vs a cold wallet (offline hardware) for security.",
  },
  "staking": {
    term: "Staking",
    shortDef: "Lock crypto to earn rewards",
    fullDef: "Staking means locking your cryptocurrency to help secure a blockchain network. In return, you earn rewards. It's like earning interest for holding.",
    example: "Staking 1 ETH might earn you 3-5% annually, paid in more ETH.",
  },
  "nft": {
    term: "NFT",
    shortDef: "Unique digital ownership",
    fullDef: "Non-Fungible Token - a unique digital certificate of ownership stored on a blockchain. Each NFT is different, unlike regular cryptocurrencies where each coin is identical.",
    example: "While all Bitcoin are equal, each NFT (like digital art) is unique and can't be exchanged 1:1.",
  },
  "dex": {
    term: "DEX",
    shortDef: "Decentralized Exchange",
    fullDef: "A DEX lets you trade crypto directly from your wallet without a middleman company. Trades happen via smart contracts on the blockchain.",
    example: "Popular DEXs include Uniswap and SushiSwap. You keep custody of your funds until the trade executes.",
  },
  "tvl": {
    term: "TVL",
    shortDef: "Total Value Locked",
    fullDef: "TVL measures how much cryptocurrency is deposited in a DeFi protocol. Higher TVL often indicates more trust and liquidity.",
    example: "A staking pool with $100M TVL is generally considered safer than one with $100K.",
  },
  "bridging": {
    term: "Bridge",
    shortDef: "Move crypto between chains",
    fullDef: "Bridging transfers your assets from one blockchain to another. Since different blockchains don't natively communicate, bridges act as connectors.",
    example: "Moving ETH from Ethereum mainnet to Polygon to save on gas fees requires a bridge.",
  },
  "seed": {
    term: "Seed Phrase",
    shortDef: "Wallet recovery words",
    fullDef: "A 12 or 24 word phrase that can recover your entire wallet. NEVER share it with anyone. Anyone with your seed phrase controls all your crypto.",
    example: "Write it on paper, store it safely. Never save it digitally or share it online.",
  },
  "smart_contract": {
    term: "Smart Contract",
    shortDef: "Self-executing code",
    fullDef: "Programs stored on a blockchain that automatically execute when conditions are met. They enable trustless transactions without intermediaries.",
    example: "A smart contract can automatically send you staking rewards every day without human involvement.",
  }
};

interface EducationTooltipProps {
  term: keyof typeof GLOSSARY;
  children: React.ReactNode;
  showIcon?: boolean;
}

export function EducationTooltip({ term, children, showIcon = true }: EducationTooltipProps) {
  const glossaryEntry = GLOSSARY[term];
  
  if (!glossaryEntry) return <>{children}</>;

  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-muted-foreground/50" data-testid={`tooltip-${term}`}>
          {children}
          {showIcon && <HelpCircle className="h-3 w-3 text-muted-foreground" />}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-purple-400" />
            <h4 className="font-semibold text-sm">{glossaryEntry.term}</h4>
            <Badge variant="outline" className="text-xs">Learn</Badge>
          </div>
          <p className="text-sm text-foreground">{glossaryEntry.fullDef}</p>
          {glossaryEntry.example && (
            <div className="p-2 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Lightbulb className="h-3 w-3 mt-0.5 shrink-0 text-yellow-400" />
                <span><strong>Example:</strong> {glossaryEntry.example}</span>
              </p>
            </div>
          )}
          {glossaryEntry.learnMoreUrl && (
            <a 
              href={glossaryEntry.learnMoreUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Learn more <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function QuickGlossary() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredTerms = Object.entries(GLOSSARY).filter(([key, value]) =>
    value.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    value.shortDef.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4" data-testid="quick-glossary">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-purple-400" />
        <h3 className="font-semibold">Crypto Glossary</h3>
        <Badge variant="outline" className="text-xs">{Object.keys(GLOSSARY).length} terms</Badge>
      </div>
      
      <input
        type="text"
        placeholder="Search terms..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm"
        data-testid="glossary-search"
      />

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTerms.map(([key, entry]) => (
          <div 
            key={key} 
            className="p-3 bg-card/50 rounded-lg border border-border/50 hover:border-purple-500/30 transition-colors"
            data-testid={`glossary-item-${key}`}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{entry.term}</h4>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{entry.shortDef}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BeginnerTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20" data-testid="beginner-tip">
      <Lightbulb className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
      <p className="text-xs text-blue-300">{children}</p>
    </div>
  );
}

export { GLOSSARY };
