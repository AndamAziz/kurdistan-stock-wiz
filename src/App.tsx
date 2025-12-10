import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NotificationChecker } from "@/components/NotificationChecker";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Items from "./pages/Items";
import StockIn from "./pages/StockIn";
import StockAdjust from "./pages/StockAdjust";
import Expiry from "./pages/Expiry";
import Categories from "./pages/Categories";
import Brands from "./pages/Brands";
import ImportExport from "./pages/ImportExport";
import Settings from "./pages/Settings";
import UserRoles from "./pages/UserRoles";
import Markets from "./pages/Markets";
import IncompleteMarkets from "./pages/IncompleteMarkets";
import DeliveryPersons from "./pages/DeliveryPersons";
import MandwbDashboard from "./pages/MandwbDashboard";
import VisitReports from "./pages/VisitReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NotificationChecker />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/items" element={<ProtectedRoute><Items /></ProtectedRoute>} />
              <Route path="/stock-in" element={<ProtectedRoute><StockIn /></ProtectedRoute>} />
              <Route path="/stock-adjust" element={<ProtectedRoute><StockAdjust /></ProtectedRoute>} />
              <Route path="/expiry" element={<ProtectedRoute><Expiry /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
              <Route path="/brands" element={<ProtectedRoute><Brands /></ProtectedRoute>} />
              <Route path="/import-export" element={<ProtectedRoute><ImportExport /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/user-roles" element={<ProtectedRoute><UserRoles /></ProtectedRoute>} />
              <Route path="/markets" element={<ProtectedRoute><Markets /></ProtectedRoute>} />
              <Route path="/incomplete-markets" element={<ProtectedRoute><IncompleteMarkets /></ProtectedRoute>} />
              <Route path="/delivery-persons" element={<ProtectedRoute><DeliveryPersons /></ProtectedRoute>} />
              <Route path="/mandwb" element={<ProtectedRoute><MandwbDashboard /></ProtectedRoute>} />
              <Route path="/visit-reports" element={<ProtectedRoute><VisitReports /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
