import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Backoffice from "./pages/Backoffice";
import GerenciarProdutos from "./pages/GerenciarProdutos";
import GerenciarEstoque from "./pages/GerenciarEstoque";
import GerenciarFornecedores from "./pages/GerenciarFornecedores";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";
import PerfilCliente from "./pages/PerfilCliente";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import NotFound from "./pages/NotFound";
import GerenciarCarrinhos from "./pages/GerenciarCarrinhos";
import GerenciarAuditoria from "./pages/GerenciarAuditoria";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          basename="/projeto/wave-surf"
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/backoffice"
              element={
                <AdminRoute>
                  <Backoffice />
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/produtos"
              element={
                <AdminRoute>
                  <GerenciarProdutos />
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/estoque"
              element={
                <AdminRoute>
                  <GerenciarEstoque />
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/fornecedores"
              element={
                <AdminRoute>
                  <GerenciarFornecedores />
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/usuarios"
              element={
                <AdminRoute>
                  <GerenciarUsuarios />
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/carrinhos"
              element={
                <AdminRoute>
                  <GerenciarCarrinhos />
                </AdminRoute>
              }
            />
            <Route
              path="/backoffice/auditoria"
              element={
                <AdminRoute>
                  <GerenciarAuditoria />
                </AdminRoute>
              }
            />
            <Route path="/perfil" element={<PerfilCliente />} />
            <Route path="/carrinho" element={<CartPage />} />
            <Route path="/pedidos" element={<OrdersPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
