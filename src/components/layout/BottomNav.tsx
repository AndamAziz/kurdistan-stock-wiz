import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptics";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Menu,
} from "lucide-react";

const navItems = [
  { name: 'داشبۆرد', href: '/', icon: LayoutDashboard },
  { name: 'مادەکان', href: '/items', icon: Package },
  { name: 'داخڵکردن', href: '/stock-in', icon: ArrowDownToLine },
  { name: 'دەرکردن', href: '/stock-out', icon: ArrowUpFromLine },
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border/50 safe-area-bottom shadow-[0_-4px_20px_-5px_hsl(0_0%_0%/0.1)]">
      <div className="flex items-center justify-around h-[72px] px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 flex-1 h-full py-2 transition-all duration-200 active:scale-95"
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-2xl p-2.5 transition-all duration-300",
                isActive 
                  ? "bg-primary shadow-md shadow-primary/30" 
                  : "bg-transparent hover:bg-muted/50"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive 
                    ? "text-primary-foreground" 
                    : "text-muted-foreground"
                )} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[11px] transition-all duration-200",
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
          className="flex flex-col items-center justify-center gap-1.5 flex-1 h-full py-2 transition-all duration-200 active:scale-95"
        >
          <div className="flex items-center justify-center rounded-2xl p-2.5 hover:bg-muted/50 transition-all duration-300">
            <Menu className="h-5 w-5 text-muted-foreground" strokeWidth={2} />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">زیاتر</span>
        </button>
      </div>
    </nav>
  );
}