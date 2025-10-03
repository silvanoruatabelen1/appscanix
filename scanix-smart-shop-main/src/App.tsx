import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import ScanPage from "./pages/ScanPage";
import CartPage from "./pages/CartPage";
import TicketPage from "./pages/TicketPage";
import ProductsPage from "./pages/ProductsPage";
import DepositsPage from "./pages/DepositsPage";
import TransfersPage from "./pages/TransfersPage";
import TransferDetailPage from "./pages/TransferDetailPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import DevSitemap from "./pages/DevSitemap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAuthenticated, user, updateUser } = useAuthStore();
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Verificar si el usuario necesita cambiar contraseña
  useEffect(() => {
    if (isAuthenticated && user?.requiresPasswordChange) {
      setShowChangePassword(true);
    }
  }, [isAuthenticated, user]);

  const handlePasswordChanged = (success: boolean) => {
    if (success && user) {
      // Actualizar el usuario para marcar que ya no requiere cambio de contraseña
      updateUser({ ...user, requiresPasswordChange: false });
    }
    setShowChangePassword(false);
  };

  // Redirección por defecto según el rol del usuario
  const getDefaultRoute = () => {
    if (!user) return '/scan';
    
    switch (user.role) {
      case 'admin':
        return '/products'; // Admin va a productos por defecto
      case 'operador':
        return '/deposits'; // Operador va a depósitos por defecto
      case 'cajero':
        return '/scan'; // Cajero va a escaneo por defecto
      default:
        return '/scan';
    }
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <>
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to={getDefaultRoute()} replace />} />
        
        {/* Rutas para Cajeros */}
        <Route 
          path="scan" 
          element={
            <ProtectedRoute requiredRoles={['cajero', 'admin']}>
              <ScanPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="cart" 
          element={
            <ProtectedRoute requiredRoles={['cajero', 'admin']}>
              <CartPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="ticket/:id" 
          element={
            <ProtectedRoute requiredRoles={['cajero', 'admin', 'operador']}>
              <TicketPage />
            </ProtectedRoute>
          } 
        />

        {/* Rutas para Operadores y Admins */}
        <Route 
          path="products" 
          element={
            <ProtectedRoute requiredRoles={['operador', 'admin']}>
              <ProductsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="deposits" 
          element={
            <ProtectedRoute requiredRoles={['operador', 'admin']}>
              <DepositsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="transfers" 
          element={
            <ProtectedRoute requiredRoles={['operador', 'admin']}>
              <TransfersPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="transfers/:id" 
          element={
            <ProtectedRoute requiredRoles={['operador', 'admin']}>
              <TransferDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="reports" 
          element={
            <ProtectedRoute requiredRoles={['operador', 'admin']}>
              <ReportsPage />
            </ProtectedRoute>
          } 
        />

        {/* Rutas solo para Admins */}
        <Route 
          path="users" 
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          } 
        />

        {/* Rutas de desarrollo */}
        {import.meta.env.DEV && (
          <Route 
            path="dev/sitemap" 
            element={
              <ProtectedRoute requiredRoles={['admin']}>
                <DevSitemap />
              </ProtectedRoute>
            } 
          />
        )}
        
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    
    {/* Modal de cambio de contraseña obligatorio */}
    {user && (
      <ChangePasswordModal
        open={showChangePassword}
        onClose={handlePasswordChanged}
        isFirstLogin={user.requiresPasswordChange}
        username={user.username}
      />
    )}
  </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;