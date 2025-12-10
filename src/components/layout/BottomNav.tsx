import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptics";
import { useUserRoles } from "@/hooks/useUserRoles";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  AlertTriangle,
  Menu,
  Settings,
  Store,
} from "lucide-react";

const regularNavItems = [
  { name: 'داشبۆرد', href: '/', icon: LayoutDashboard },
  { name: 'مادەکان', href: '/items', icon: Package },
  { name: 'داخڵکردن', href: '/stock-in', icon: ArrowDownToLine },
  { name: 'بەسەرچوون', href: '/expiry', icon: AlertTriangle },
];

interface BottomNavProps {
  onMenuClick: () => void;
  mandwbActiveTab?: string;
  onMandwbTabChange?: (tab: string) => void;
}

export function BottomNav({ onMenuClick, mandwbActiveTab, onMandwbTabChange }: BottomNavProps) {
  const location = useLocation();
  const { isMandwb, currentUserRoles, isLoadingCurrentUserRoles } = useUserRoles();
  
  // Check if user is mandwb only
  const isOnlyMandwb = !isLoadingCurrentUserRoles && isMandwb && 
    !currentUserRoles.includes('admin') && 
    !currentUserRoles.includes('storekeeper');

  const handleNavClick = () => {
    hapticFeedback.light();
  };

  const handleMenuClick = () => {
    hapticFeedback.medium();
    onMenuClick();
  };

  const handleMandwbNavClick = (tab: string) => {
    hapticFeedback.light();
    onMandwbTabChange?.(tab);
  };

  // Mandwb-specific navigation when on /mandwb page
  if (isOnlyMandwb && location.pathname === '/mandwb') {
    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-primary/20 safe-area-bottom shadow-[0_-8px_30px_-5px_hsl(var(--primary)/0.15)]">
        <div className="flex items-center justify-around h-[76px] px-2">
          {/* Dashboard Tab */}
          <button
            onClick={() => handleMandwbNavClick('dashboard')}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 transition-all duration-200 active:scale-90"
          >
            <div className={cn(
              "relative flex items-center justify-center rounded-xl p-2.5 transition-all duration-300",
              mandwbActiveTab === 'dashboard'
                ? "bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/40 scale-110" 
                : "bg-muted/40 hover:bg-muted"
            )}>
              <LayoutDashboard className={cn(
                "h-5 w-5 transition-all duration-200",
                mandwbActiveTab === 'dashboard'
                  ? "text-primary-foreground" 
                  : "text-muted-foreground"
              )} strokeWidth={mandwbActiveTab === 'dashboard' ? 2.5 : 2} />
              
              {mandwbActiveTab === 'dashboard' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className={cn(
              "text-[10px] transition-all duration-200",
              mandwbActiveTab === 'dashboard'
                ? "font-bold text-primary" 
                : "font-medium text-muted-foreground"
            )}>
              داشبۆرد
            </span>
          </button>

          {/* Markets Tab */}
          <button
            onClick={() => handleMandwbNavClick('markets')}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 transition-all duration-200 active:scale-90"
          >
            <div className={cn(
              "relative flex items-center justify-center rounded-xl p-2.5 transition-all duration-300",
              mandwbActiveTab === 'markets'
                ? "bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/40 scale-110" 
                : "bg-muted/40 hover:bg-muted"
            )}>
              <Store className={cn(
                "h-5 w-5 transition-all duration-200",
                mandwbActiveTab === 'markets'
                  ? "text-primary-foreground" 
                  : "text-muted-foreground"
              )} strokeWidth={mandwbActiveTab === 'markets' ? 2.5 : 2} />
              
              {mandwbActiveTab === 'markets' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className={cn(
              "text-[10px] transition-all duration-200",
              mandwbActiveTab === 'markets'
                ? "font-bold text-primary" 
                : "font-medium text-muted-foreground"
            )}>
              ماڕکێتەکان
            </span>
          </button>

          {/* Settings Link */}
          <NavLink
            to="/settings"
            onClick={handleNavClick}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 transition-all duration-200 active:scale-90"
          >
            <div className="relative flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 bg-muted/40 hover:bg-muted">
              <Settings className="h-5 w-5 transition-all duration-200 text-muted-foreground" strokeWidth={2} />
            </div>
            <span className="text-[10px] transition-all duration-200 font-medium text-muted-foreground">
              ڕێکخستن
            </span>
          </NavLink>
        </div>
      </nav>
    );
  }

  // Mandwb navigation when on settings page
  if (isOnlyMandwb && location.pathname === '/settings') {
    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-primary/20 safe-area-bottom shadow-[0_-8px_30px_-5px_hsl(var(--primary)/0.15)]">
        <div className="flex items-center justify-around h-[76px] px-2">
          <NavLink
            to="/mandwb"
            onClick={handleNavClick}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 transition-all duration-200 active:scale-90"
          >
            <div className="relative flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 bg-muted/40 hover:bg-muted">
              <LayoutDashboard className="h-5 w-5 transition-all duration-200 text-muted-foreground" strokeWidth={2} />
            </div>
            <span className="text-[10px] transition-all duration-200 font-medium text-muted-foreground">
              داشبۆرد
            </span>
          </NavLink>

          <NavLink
            to="/mandwb"
            onClick={() => {
              handleNavClick();
              onMandwbTabChange?.('markets');
            }}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 transition-all duration-200 active:scale-90"
          >
            <div className="relative flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 bg-muted/40 hover:bg-muted">
              <Store className="h-5 w-5 transition-all duration-200 text-muted-foreground" strokeWidth={2} />
            </div>
            <span className="text-[10px] transition-all duration-200 font-medium text-muted-foreground">
              ماڕکێتەکان
            </span>
          </NavLink>

          <button
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 transition-all duration-200"
          >
            <div className="relative flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/40 scale-110">
              <Settings className="h-5 w-5 transition-all duration-200 text-primary-foreground" strokeWidth={2.5} />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            </div>
            <span className="text-[10px] transition-all duration-200 font-bold text-primary">
              ڕێکخستن
            </span>
          </button>
        </div>
      </nav>
    );
  }

  // Regular navigation for other users
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-primary/20 safe-area-bottom shadow-[0_-8px_30px_-5px_hsl(var(--primary)/0.15)]">
      <div className="flex items-center justify-around h-[76px] px-2">
        {regularNavItems.map((item, index) => {
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={`${item.href}-${index}`}
              to={item.href}
              onClick={handleNavClick}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 transition-all duration-200 active:scale-90"
            >
              <div className={cn(
                "relative flex items-center justify-center rounded-xl p-2.5 transition-all duration-300",
                isActive 
                  ? "bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/40 scale-110" 
                  : "bg-muted/40 hover:bg-muted"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive 
                    ? "text-primary-foreground" 
                    : "text-muted-foreground"
                )} strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                )}
              </div>
              <span className={cn(
                "text-[10px] transition-all duration-200",
                isActive 
                  ? "font-bold text-primary" 
                  : "font-medium text-muted-foreground"
              )}>
                {item.name}
              </span>
            </NavLink>
          );
        })}
        
        {/* More Menu Button */}
        <button
          onClick={handleMenuClick}
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 transition-all duration-200 active:scale-90"
        >
          <div className="flex items-center justify-center rounded-xl p-2.5 bg-muted/40 hover:bg-muted transition-all duration-300">
            <Menu className="h-5 w-5 text-muted-foreground" strokeWidth={2} />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">زیاتر</span>
        </button>
      </div>
    </nav>
  );
}
