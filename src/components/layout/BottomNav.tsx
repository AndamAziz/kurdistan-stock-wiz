import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptics";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  AlertTriangle,
  Menu,
} from "lucide-react";

const navItems = [
  { name: 'داشبۆرد', href: '/', icon: LayoutDashboard },
  { name: 'مادەکان', href: '/items', icon: Package },
  { name: 'داخڵکردن', href: '/stock-in', icon: ArrowDownToLine },
  { name: 'بەسەرچوون', href: '/expiry', icon: AlertTriangle },
];

interface BottomNavProps {
  onMenuClick: () => void;
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const location = useLocation();

  const handleNavClick = () => {
    hapticFeedback.light();
  };

  const handleMenuClick = () => {
    hapticFeedback.medium();
    onMenuClick();
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t-2 border-primary/20 safe-area-bottom shadow-[0_-8px_30px_-5px_hsl(var(--primary)/0.15)]">
      <div className="flex items-center justify-around h-[76px] px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.href}
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