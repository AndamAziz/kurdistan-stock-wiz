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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 transition-all duration-200 active:scale-95",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-xl p-1.5 transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive && "scale-110"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                isActive && "font-semibold"
              )}>
                {item.name}
              </span>
            </NavLink>
          );
        })}
        
        {/* More Menu Button */}
        <button
          onClick={handleMenuClick}
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full py-2 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95"
        >
          <div className="flex items-center justify-center rounded-xl p-1.5">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">زیاتر</span>
        </button>
      </div>
    </nav>
  );
}
