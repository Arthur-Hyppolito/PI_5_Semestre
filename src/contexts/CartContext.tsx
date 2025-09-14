import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  quantidade: number;
  categoria: string;
  imagem_url?: string;
}

interface CartItem {
  produto: Produto;
  quantidade: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Produto }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantidade: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

interface CartContextType {
  state: CartState;
  addItem: (produto: Produto) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantidade: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  getItemQuantity: (id: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.produto.id === action.payload.id);
      
      if (existingItem) {
        // Se o item já existe, aumenta a quantidade
        const updatedItems = state.items.map(item =>
          item.produto.id === action.payload.id
            ? { ...item, quantidade: Math.min(item.quantidade + 1, action.payload.quantidade) }
            : item
        );
        return calculateTotals({ ...state, items: updatedItems });
      } else {
        // Se é um novo item, adiciona ao carrinho
        const newItem: CartItem = {
          produto: action.payload,
          quantidade: 1
        };
        return calculateTotals({ ...state, items: [...state.items, newItem] });
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.produto.id !== action.payload);
      return calculateTotals({ ...state, items: updatedItems });
    }
    
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantidade <= 0) {
        // Se quantidade é 0 ou negativa, remove o item
        const updatedItems = state.items.filter(item => item.produto.id !== action.payload.id);
        return calculateTotals({ ...state, items: updatedItems });
      }
      
      const updatedItems = state.items.map(item =>
        item.produto.id === action.payload.id
          ? { ...item, quantidade: Math.min(action.payload.quantidade, item.produto.quantidade) }
          : item
      );
      return calculateTotals({ ...state, items: updatedItems });
    }
    
    case 'CLEAR_CART': {
      return { items: [], total: 0, itemCount: 0 };
    }
    
    case 'LOAD_CART': {
      return calculateTotals({ ...state, items: action.payload });
    }
    
    default:
      return state;
  }
};

const calculateTotals = (state: CartState): CartState => {
  const total = state.items.reduce((sum, item) => sum + (item.produto.preco * item.quantidade), 0);
  const itemCount = state.items.reduce((count, item) => count + item.quantidade, 0);
  return { ...state, total, itemCount };
};

const CART_STORAGE_KEY = 'wavecraft-cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0, itemCount: 0 });
  const { toast } = useToast();

  // Carregar carrinho do localStorage na inicialização
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho do localStorage:', error);
    }
  }, []);

  // Salvar carrinho no localStorage sempre que o estado mudar
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch (error) {
      console.error('Erro ao salvar carrinho no localStorage:', error);
    }
  }, [state.items]);

  const addItem = (produto: Produto) => {
    if (produto.quantidade <= 0) {
      toast({
        title: "Produto esgotado",
        description: "Este produto não está disponível no momento.",
        variant: "destructive",
      });
      return;
    }

    const existingItem = state.items.find(item => item.produto.id === produto.id);
    const currentQuantityInCart = existingItem ? existingItem.quantidade : 0;
    
    if (currentQuantityInCart >= produto.quantidade) {
      toast({
        title: "Limite de estoque atingido",
        description: `Você já tem a quantidade máxima disponível (${produto.quantidade}) deste produto no carrinho.`,
        variant: "destructive",
      });
      return;
    }

    dispatch({ type: 'ADD_ITEM', payload: produto });
    
    toast({
      title: "Produto adicionado!",
      description: `${produto.nome} foi adicionado ao carrinho.`,
    });
  };

  const removeItem = (id: string) => {
    const item = state.items.find(item => item.produto.id === id);
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    
    if (item) {
      toast({
        title: "Produto removido",
        description: `${item.produto.nome} foi removido do carrinho.`,
      });
    }
  };

  const updateQuantity = (id: string, quantidade: number) => {
    const item = state.items.find(item => item.produto.id === id);
    
    if (!item) return;
    
    if (quantidade > item.produto.quantidade) {
      toast({
        title: "Quantidade indisponível",
        description: `Apenas ${item.produto.quantidade} unidades disponíveis em estoque.`,
        variant: "destructive",
      });
      return;
    }
    
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantidade } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos do carrinho.",
    });
  };

  const isInCart = (id: string): boolean => {
    return state.items.some(item => item.produto.id === id);
  };

  const getItemQuantity = (id: string): number => {
    const item = state.items.find(item => item.produto.id === id);
    return item ? item.quantidade : 0;
  };

  return (
    <CartContext.Provider value={{
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isInCart,
      getItemQuantity
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
