import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, ShoppingCart, Package, Waves, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

const Sidebar = () => {
  const location = useLocation();
  const { state } = useCart();

  const navigationItems = [
    {
      name: 'Voltar à Loja',
      href: '/',
      icon: Home,
      description: 'Página inicial'
    },
    {
      name: 'Perfil',
      href: '/perfil',
      icon: User,
      description: 'Gerenciar informações pessoais'
    },
    {
      name: 'Carrinho',
      href: '/carrinho',
      icon: ShoppingCart,
      description: 'Itens selecionados',
      badge: state.itemCount > 0 ? state.itemCount : undefined
    },
    {
      name: 'Pedidos',
      href: '/pedidos',
      icon: Package,
      description: 'Histórico de compras'
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <Link to="/" className="flex items-center space-x-2">
          <Waves className="h-8 w-8 text-ocean-medium" />
          <span className="text-xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
            WaveSurf
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} to={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start h-auto p-4 ${
                    isActive 
                      ? 'bg-ocean-medium text-white hover:bg-ocean-deep' 
                      : 'hover:bg-ocean-light/10'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">{item.name}</div>
                        <div className={`text-xs ${
                          isActive ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                        isActive 
                          ? 'bg-white text-ocean-medium' 
                          : 'bg-ocean-medium text-white'
                      }`}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
};

export default Sidebar;
