import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Items from "./pages/Items";
import StockIn from "./pages/StockIn";
import StockOut from "./pages/StockOut";
import Expiry from "./pages/Expiry";
import Categories from "./pages/Categories";
import Brands from "./pages/Brands";
import ImportExport from "./pages/ImportExport";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
            <Route path="/stock-in" element={<ProtectedRoute><StockIn /></ProtectedRoute>} />
            <Route path="/stock-out" element={<ProtectedRoute><StockOut /></ProtectedRoute>} />
            <Route path="/expiry" element={<ProtectedRoute><Expiry /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
            <Route path="/brands" element={<ProtectedRoute><Brands /></ProtectedRoute>} />
            <Route path="/import-export" element={<ProtectedRoute><ImportExport /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
