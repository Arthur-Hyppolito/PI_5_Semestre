import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';

const CartIcon = () => {
  const { state } = useCart();

  return (
    <Link to="/carrinho">
      <Button
        variant="ghost"
        size="sm"
        className="relative hover:bg-ocean-light/20 transition-colors"
      >
        <ShoppingCart className="h-5 w-5 text-ocean-deep" />
        {state.itemCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-ocean-medium hover:bg-ocean-deep"
          >
            {state.itemCount > 99 ? '99+' : state.itemCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
};

export default CartIcon;
