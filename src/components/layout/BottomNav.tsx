import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptics";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useMandwbTab } from "@/hooks/useMandwbTab";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  AlertTriangle,
  Menu,
  Settings,
  Store,
  ChevronUp,
  Trash2,
  Clock,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  expiredCount?: number;
  expiringCount?: number;
  onExpiredChange?: (value: number) => void;
  onExpiringChange?: (value: number) => void;
  onSubmitVisit?: () => void;
  isSubmitting?: boolean;
}

export function BottomNav({ 
  onMenuClick, 
  mandwbActiveTab, 
  onMandwbTabChange,
  expiredCount = 0,
  expiringCount = 0,
  onExpiredChange,
  onExpiringChange,
  onSubmitVisit,
  isSubmitting = false,
}: BottomNavProps) {
  const location = useLocation();
  const { isMandwb, currentUserRoles, isLoadingCurrentUserRoles } = useUserRoles();
  const { isVisitMode, visitMarket, endVisit } = useMandwbTab();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
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

  // Mandwb visit mode - show dropdown menu for expired/expiring quantities
  if (isOnlyMandwb && location.pathname === '/mandwb' && isVisitMode && visitMarket) {
    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-primary/20 safe-area-bottom shadow-[0_-8px_30px_-5px_hsl(var(--primary)/0.15)]">
        <div className="flex items-center justify-between h-[76px] px-3 gap-2">
          {/* Cancel Visit Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              hapticFeedback.medium();
              endVisit();
            }}
            className="h-12 px-3"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Dropdown Menu for Quantities */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 h-12 justify-between"
              >
                <span className="text-sm truncate">{visitMarket.name}</span>
                <div className="flex items-center gap-2">
                  {(expiredCount > 0 || expiringCount > 0) && (
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                      {expiredCount + expiringCount}
                    </span>
                  )}
                  <ChevronUp className={cn(
                    "h-4 w-4 transition-transform",
                    isDropdownOpen && "rotate-180"
                  )} />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side="top" 
              align="center" 
              className="w-[calc(100vw-100px)] p-3 space-y-3 bg-background"
            >
              <div className="text-center text-sm font-medium text-muted-foreground mb-2">
                ژمارەی بەسەرچوو و نزیک بەسەرچوون
              </div>
              
              {/* Expired Input */}
              <div className="flex items-center gap-3 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-destructive/20">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-destructive font-medium">بەسەرچوو</label>
                  <Input
                    type="number"
                    min="0"
                    value={expiredCount || ""}
                    onChange={(e) => onExpiredChange?.(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 mt-1"
                  />
                </div>
              </div>

              {/* Expiring Input */}
              <div className="flex items-center gap-3 p-2 rounded-lg bg-warning/5 border border-warning/20">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-warning/20">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-warning font-medium">نزیک بەسەرچوون</label>
                  <Input
                    type="number"
                    min="0"
                    value={expiringCount || ""}
                    onChange={(e) => onExpiringChange?.(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 mt-1"
                  />
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                ئەگەر هەردووکیان 0 بن = ماڕکێت سەلامەتە
              </p>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Submit Button */}
          <Button
            onClick={() => {
              hapticFeedback.success();
              onSubmitVisit?.();
            }}
            disabled={isSubmitting}
            className="h-12 px-4"
          >
            {isSubmitting ? "..." : "ناردن"}
          </Button>
        </div>
      </nav>
    );
  }

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
