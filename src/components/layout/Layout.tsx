import { ReactNode, useState, useRef, useCallback, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    
    // Swipe left to open sidebar (RTL layout)
    if (swipeDistance > minSwipeDistance && touchStartX.current < 100) {
      setSidebarOpen(true);
    }
    // Swipe right to close sidebar
    if (swipeDistance < -minSwipeDistance && sidebarOpen) {
      setSidebarOpen(false);
    }
    
    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [sidebarOpen]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
      {/* Main content area - responsive margins with bottom padding for nav */}
      <main className="min-h-screen pt-16 pb-24 lg:pt-0 lg:pb-0 lg:mr-72 xl:mr-80 2xl:mr-96">
        <div className="p-4 sm:p-6 lg:p-10 xl:p-12 max-w-[1800px]">
          {children}
        </div>
      </main>
      {/* Bottom Navigation for Mobile */}
      <BottomNav onMenuClick={() => setSidebarOpen(true)} />
    </div>
  );
}
