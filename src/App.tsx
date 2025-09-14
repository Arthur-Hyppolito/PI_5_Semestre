import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Backoffice from "./pages/Backoffice";
import GerenciarProdutos from "./pages/GerenciarProdutos";
import GerenciarEstoque from './pages/GerenciarEstoque'
import PerfilCliente from './pages/PerfilCliente';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/backoffice" element={<Backoffice />} />
            <Route path="/backoffice/produtos" element={<GerenciarProdutos />} />
            <Route path="/backoffice/estoque" element={<GerenciarEstoque />} />
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
