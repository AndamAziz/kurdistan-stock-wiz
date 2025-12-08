import { ReactNode, useState, useRef, useCallback, useEffect } from "react";
import { Sidebar } from "./Sidebar";

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
      {/* Main content area - responsive margins */}
      <main className="min-h-screen pt-14 lg:pt-0 lg:mr-60 xl:mr-64">
        <div className="p-3 sm:p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
