import React from 'react';
import { Package, Calendar, CreditCard, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Sidebar from '@/components/Sidebar';

const OrdersPage = () => {
  // Mock orders data - will be replaced with real data from backend
  const orders = [
    {
      id: '001',
      date: '2024-01-15',
      status: 'Entregue',
      total: 1299.99,
      items: [
        { name: 'Prancha Shortboard Pro 6.2', quantity: 1, price: 1299.99 }
      ]
    },
    {
      id: '002',
      date: '2024-01-10',
      status: 'Em trânsito',
      total: 689.98,
      items: [
        { name: 'Wetsuit Premium 4/3mm', quantity: 1, price: 599.99 },
        { name: 'Leash Surf Premium 6ft', quantity: 1, price: 89.99 }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entregue':
        return 'bg-green-100 text-green-800';
      case 'Em trânsito':
        return 'bg-blue-100 text-blue-800';
      case 'Processando':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Entregue':
        return <Package className="h-4 w-4" />;
      case 'Em trânsito':
        return <Truck className="h-4 w-4" />;
      case 'Processando':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
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
            <h1 className="text-3xl font-bold text-ocean-deep">Meus Pedidos</h1>
            <p className="text-gray-600 mt-2">
              Acompanhe o status dos seus pedidos e histórico de compras
            </p>
          </div>

          {orders.length === 0 ? (
            /* Empty Orders */
            <div className="text-center py-16">
              <div className="text-8xl mb-6">📦</div>
              <h2 className="text-2xl font-semibold text-gray-600 mb-4">
                Nenhum pedido encontrado
              </h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Você ainda não fez nenhum pedido. Que tal explorar nossos produtos 
                e fazer sua primeira compra?
              </p>
            </div>
          ) : (
            /* Orders List */
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(order.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getStatusColor(order.status)} flex items-center space-x-1`}>
                          {getStatusIcon(order.status)}
                          <span>{order.status}</span>
                        </Badge>
                        <div className="text-lg font-semibold text-ocean-medium mt-2">
                          R$ {order.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">Itens do pedido:</h4>
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-gray-500 ml-2">x{item.quantity}</span>
                          </div>
                          <span className="font-medium">R$ {item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Order Actions */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="flex space-x-3">
                        <button className="text-ocean-medium hover:text-ocean-deep text-sm font-medium">
                          Ver detalhes
                        </button>
                        {order.status === 'Entregue' && (
                          <button className="text-ocean-medium hover:text-ocean-deep text-sm font-medium">
                            Comprar novamente
                          </button>
                        )}
                        {order.status !== 'Entregue' && order.status !== 'Cancelado' && (
                          <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                            Cancelar pedido
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
