import React from 'react';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import surfboardsImage from '@/assets/surfboards.jpg';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { state, removeItem, updateQuantity, clearCart, isLoading } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(id);
      return;
    }

    // Validar estoque antes de atualizar
    const item = state.items.find(i => i.produto.id === id);
    if (!item) return;

    // Verificar se nova quantidade excede estoque disponível
    if (newQuantity > item.produto.quantidade_estoque) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${item.produto.quantidade_estoque} unidades disponíveis.`,
        variant: "destructive",
      });
      return;
    }

    await updateQuantity(id, newQuantity);
  };

  const handleCheckout = () => {
    // Fechar drawer e navegar para página de checkout
    onClose();
    navigate('/carrinho');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-ocean-deep">Carrinho de Compras</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {state.items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Seu carrinho está vazio
                </h3>
                <p className="text-gray-500">
                  Adicione alguns produtos para começar suas compras!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.items.map((item) => (
                  <Card key={item.produto.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Product Image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.produto.imagem_url || surfboardsImage}
                            alt={item.produto.nome}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = surfboardsImage;
                            }}
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-ocean-deep truncate">
                            {item.produto.nome}
                          </h4>
                          <p className="text-xs text-gray-500 mb-2">
                            {item.produto.categoria}
                          </p>
                          
                          {/* Price and Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-ocean-medium">
                              R$ {(item.produto.preco_unitario * item.quantidade).toFixed(2)}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleQuantityChange(item.produto.id, item.quantidade - 1)}
                                disabled={isLoading}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              
                              <span className="text-sm font-medium w-8 text-center">
                                {item.quantidade}
                              </span>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleQuantityChange(item.produto.id, item.quantidade + 1)}
                                disabled={item.quantidade >= item.produto.quantidade_estoque || isLoading}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                onClick={() => removeItem(item.produto.id)}
                                disabled={isLoading}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Unit Price */}
                          <p className="text-xs text-gray-400 mt-1">
                            R$ {item.produto.preco_unitario.toFixed(2)} cada
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {state.items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-ocean-medium">
                  R$ {state.total.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full bg-ocean-medium hover:bg-ocean-deep"
                  onClick={handleCheckout}
                >
                  Finalizar Compra
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={clearCart}
                >
                  Limpar Carrinho
                </Button>
              </div>
              
              {/* Item Count */}
              <p className="text-center text-sm text-gray-500">
                {state.itemCount} {state.itemCount === 1 ? 'item' : 'itens'} no carrinho
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
