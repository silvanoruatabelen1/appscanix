import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import ScanPage from "./pages/ScanPage";
import CartPage from "./pages/CartPage";
import TicketPage from "./pages/TicketPage";
import ProductsPage from "./pages/ProductsPage";
import DepositsPage from "./pages/DepositsPage";
import TransfersPage from "./pages/TransfersPage";
import TransferDetailPage from "./pages/TransferDetailPage";
import ReportsPage from "./pages/ReportsPage";
import DevSitemap from "./pages/DevSitemap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/scan" replace />} />
            <Route path="scan" element={<ScanPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="ticket/:id" element={<TicketPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="deposits" element={<DepositsPage />} />
            <Route path="transfers" element={<TransfersPage />} />
            <Route path="transfers/:id" element={<TransferDetailPage />} />
            <Route path="reports" element={<ReportsPage />} />
            {import.meta.env.DEV && (
              <Route path="dev/sitemap" element={<DevSitemap />} />
            )}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
