import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { TrendingDown, DollarSign, Calculator } from "lucide-react";

export function SavingsCalculator() {
  const [monthlyVolume, setMonthlyVolume] = useState(50000);
  const [inputValue, setInputValue] = useState("50000"); // Raw input buffer for typing
  
  // Clamp volume to valid range (1k-1M) to prevent NaN/negative calculations
  const clampedVolume = Math.min(Math.max(monthlyVolume || 1000, 1000), 1000000);
  
  // Hypothetical fee comparison for illustration only
  // Traditional payment processor fees (industry standard reference)
  const traditionalFees = clampedVolume * 0.029 + (clampedVolume / 100) * 0.30;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <Card className="w-full bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-purple-900/20 border-purple-500/30 backdrop-blur-sm" data-testid="savings-calculator">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-purple-500/20 border border-purple-500/30">
            <Calculator className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white dark:text-white">
              Calculate Your Savings
            </CardTitle>
            <CardDescription className="text-gray-300 dark:text-gray-300">
              Estimated savings comparison (illustrative purposes only)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly Volume Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="volume-input" className="text-white dark:text-white font-medium">
              Monthly Payment Volume
            </Label>
            <span className="text-2xl font-bold text-purple-400" data-testid="volume-display">
              {formatCurrency(monthlyVolume)}
            </span>
          </div>
          
          <Slider
            id="volume-slider"
            data-testid="volume-slider"
            min={1000}
            max={1000000}
            step={1000}
            value={[monthlyVolume]}
            onValueChange={(value) => {
              setMonthlyVolume(value[0]);
              setInputValue(String(value[0])); // Sync input field with slider
            }}
            className="w-full"
          />
          
          <Input
            id="volume-input"
            data-testid="volume-input"
            type="text"
            value={inputValue}
            onChange={(e) => {
              // Store raw input without validation (allows typing)
              setInputValue(e.target.value);
            }}
            onBlur={(e) => {
              // Sanitize input: remove commas, whitespace, dollar signs before parsing
              const sanitized = e.target.value.replace(/[$,\s]/g, '');
              const num = Number(sanitized);
              
              // Validate and clamp only when user finishes typing
              if (isNaN(num) || num < 1000) {
                setMonthlyVolume(1000);
                setInputValue("1000");
              } else if (num > 1000000) {
                setMonthlyVolume(1000000);
                setInputValue("1000000");
              } else {
                setMonthlyVolume(num);
                setInputValue(String(num));
              }
            }}
            className="bg-black/30 border-purple-500/30 text-white dark:text-white"
            placeholder="Enter amount (1,000 - 1,000,000)"
          />
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {/* Traditional Payment Processor */}
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-red-300">Traditional Processors</h3>
            </div>
            <p className="text-sm text-gray-400 mb-1">Typical: 2.9% + per-transaction fees</p>
            <p className="text-3xl font-bold text-red-400" data-testid="stripe-fees">
              ~{formatCurrency(traditionalFees)}
              <span className="text-sm font-normal text-gray-400">/month*</span>
            </p>
          </div>

          {/* Crypto Payments */}
          <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-green-300">Crypto Payments</h3>
            </div>
            <p className="text-sm text-gray-400 mb-1">Generally lower fees*</p>
            <p className="text-3xl font-bold text-green-400" data-testid="codex-fees">
              Lower*
              <span className="text-sm font-normal text-gray-400"> (varies)</span>
            </p>
          </div>
        </div>

        {/* Why Crypto Payments */}
        <div className="p-6 rounded-lg bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-2 border-purple-500/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-purple-500/30">
              <TrendingDown className="w-6 h-6 text-purple-300" />
            </div>
            <h3 className="text-xl font-bold text-white dark:text-white">Why Crypto Payments?</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-300 mb-1">Lower Fees</p>
              <p className="text-lg font-bold text-purple-300" data-testid="monthly-savings">
                Potentially significant*
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-300 mb-1">Direct Settlement</p>
              <p className="text-lg font-bold text-purple-300" data-testid="annual-savings">
                To your wallet*
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-300 mb-1">Global Reach</p>
              <p className="text-lg font-bold text-purple-300" data-testid="savings-percentage">
                Expanding coverage*
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-purple-500/30">
            <p className="text-sm text-gray-300">
              💡 <span className="font-semibold text-white dark:text-white">Contact us to learn about our current beta program pricing and benefits.</span>
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center pt-2 space-y-4">
          <p className="text-sm text-gray-400">
            Ready to explore crypto payment processing?
          </p>
          <a
            href="#beta-application-form"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('beta-application-form')?.scrollIntoView({ behavior: 'smooth' });
              // Track click event
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'click', {
                  event_category: 'savings_calculator',
                  event_label: 'apply_now_cta',
                  value: Math.round(clampedVolume)
                });
              }
            }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-purple-500/50"
            data-testid="button-apply-now-calculator"
          >
            <DollarSign className="w-5 h-5" />
            Apply for Beta Access
            <TrendingDown className="w-5 h-5" />
          </a>
          <p className="text-xs text-gray-500">
            *All figures are illustrative estimates only. Actual fees vary by provider and transaction type. Contact us for current pricing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
