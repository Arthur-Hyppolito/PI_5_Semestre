import React from 'react';
import { Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import surfboardsImage from '@/assets/surfboards.jpg';

const CartPage = () => {
  const { state, removeItem, updateQuantity, clearCart } = useCart();

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleCheckout = () => {
    // TODO: Implementar lógica de checkout
    alert('Funcionalidade de checkout será implementada em breve!');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Continuar Comprando</span>
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-ocean-deep">Carrinho de Compras</h1>
            <p className="text-gray-600 mt-2">
              {state.itemCount} {state.itemCount === 1 ? 'item' : 'itens'} no seu carrinho
            </p>
          </div>

          {state.items.length === 0 ? (
            /* Empty Cart */
            <div className="text-center py-16">
              <div className="text-8xl mb-6">🛒</div>
              <h2 className="text-2xl font-semibold text-gray-600 mb-4">
                Seu carrinho está vazio
              </h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Parece que você ainda não adicionou nenhum produto ao seu carrinho. 
                Explore nossa coleção e encontre os melhores equipamentos de surf!
              </p>
              <Link to="/#produtos">
                <Button className="bg-ocean-medium hover:bg-ocean-deep">
                  Explorar Produtos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {state.items.map((item) => (
                  <Card key={item.produto.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
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
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-lg text-ocean-deep">
                                {item.produto.nome}
                              </h3>
                              <p className="text-sm text-gray-500 mb-1">
                                {item.produto.categoria}
                              </p>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {item.produto.descricao}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeItem(item.produto.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Price and Quantity */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center border rounded-lg">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-r-none"
                                  onClick={() => handleQuantityChange(item.produto.id, item.quantidade - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="px-3 py-1 text-sm font-medium min-w-[3rem] text-center">
                                  {item.quantidade}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-l-none"
                                  onClick={() => handleQuantityChange(item.produto.id, item.quantidade + 1)}
                                  disabled={item.quantidade >= item.produto.quantidade}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="text-xs text-gray-500">
                                {item.produto.quantidade} disponíveis
                              </span>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-bold text-ocean-medium">
                                R$ {(item.produto.preco * item.quantidade).toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">
                                R$ {item.produto.preco.toFixed(2)} cada
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-8">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-6">Resumo do Pedido</h3>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between">
                        <span>Subtotal ({state.itemCount} {state.itemCount === 1 ? 'item' : 'itens'})</span>
                        <span>R$ {state.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frete</span>
                        <span className="text-green-600">Grátis</span>
                      </div>
                      <hr />
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span className="text-ocean-medium">R$ {state.total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
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

                    {/* Security Info */}
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Compra 100% segura</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Seus dados estão protegidos
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartPage;
