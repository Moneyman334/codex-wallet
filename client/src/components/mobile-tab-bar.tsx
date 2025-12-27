import { useLocation, Link } from "wouter";
import { Home, Wallet, CreditCard, Image, Settings, PieChart, History } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { triggerHaptic } from "@/hooks/use-haptics";

interface TabItem {
  path: string;
  label: string;
  icon: typeof Home;
}

const fullTabs: TabItem[] = [
  { path: "/", label: "Home", icon: Home },
  { path: "/wallet-nexus", label: "Wallet", icon: Wallet },
  { path: "/codex-pay", label: "Pay", icon: CreditCard },
  { path: "/nft-marketplace", label: "NFTs", icon: Image },
  { path: "/settings", label: "Settings", icon: Settings },
];

const iosLiteTabs: TabItem[] = [
  { path: "/", label: "Home", icon: Home },
  { path: "/wallet", label: "Wallet", icon: Wallet },
  { path: "/portfolio", label: "Portfolio", icon: PieChart },
  { path: "/transactions", label: "Activity", icon: History },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function MobileTabBar() {
  const [location] = useLocation();
  
  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === 'ios';
  
  if (!isNative) {
    return null;
  }

  const tabs = isIOS ? iosLiteTabs : fullTabs;

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const handleTabPress = () => {
    triggerHaptic('light');
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50"
      style={{ 
        paddingBottom: isIOS ? 'env(safe-area-inset-bottom, 20px)' : '8px',
      }}
      data-testid="mobile-tab-bar"
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link 
              key={path} 
              href={path}
              onClick={handleTabPress}
              data-testid={`tab-${label.toLowerCase()}`}
            >
              <div className={`
                flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-xl
                transition-all duration-200 ease-out
                ${active 
                  ? 'text-primary scale-105' 
                  : 'text-muted-foreground active:scale-95'
                }
              `}>
                <div className={`
                  p-1.5 rounded-xl transition-all duration-200
                  ${active 
                    ? 'bg-primary/15 shadow-lg shadow-primary/20' 
                    : ''
                  }
                `}>
                  <Icon 
                    className={`h-6 w-6 transition-all duration-200 ${
                      active ? 'stroke-[2.5px]' : 'stroke-[1.5px]'
                    }`} 
                  />
                </div>
                <span className={`
                  text-[10px] mt-1 font-medium tracking-tight
                  ${active ? 'text-primary' : ''}
                `}>
                  {label}
                </span>
                {active && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileTabBarSpacer() {
  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === 'ios';
  
  if (!isNative) return null;
  
  return (
    <div 
      className="w-full"
      style={{ 
        height: isIOS ? 'calc(64px + env(safe-area-inset-bottom, 20px))' : '72px' 
      }}
    />
  );
}
