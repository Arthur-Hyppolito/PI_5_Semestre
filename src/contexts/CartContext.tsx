import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef, // ✅ ADICIONADO: useRef estava faltando
} from "react";
import { useToast } from "@/hooks/use-toast";
import { auth, supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ToastAction } from "@/components/ui/toast";
import { useOperationGuard } from "@/hooks/useOperationGuard";

interface Produto {
  id: string;
  nome: string;
  descricao: string | null; // ✅ CORRIGIDO: nullable (banco: TEXT NULL)
  preco_unitario: number;
  quantidade_estoque: number;
  categoria_id: string | null;
  imagem_url: string | null;
  status: boolean;
  // ✅ REMOVIDO: 'quantidade' (não existe no banco)
  // ✅ REMOVIDO: 'categoria' (não existe no banco)
}

interface CartItem {
  produto: Produto;
  quantidade: number;
  addedAt: number; // Timestamp de quando foi adicionado
}

// Interface para dados do banco (Supabase)
interface CarrinhoItemDB {
  id: string;
  quantidade: number;
  preco_unitario: number;
  created_at: string;
  produtos: {
    id: string;
    nome: string;
    descricao: string;
    preco_unitario: number;
    quantidade_estoque: number;
    categoria_id: string | null;
    imagem_url: string | null;
    status: boolean;
  };
}

interface CartState {
  items: CartItem[];
  total: number; // Valor total do carrinho
  itemCount: number; // Quantidade total de itens
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Produto }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantidade: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] }
  | { type: "SET_ITEMS"; payload: CartItem[] }; // Novo action para setar itens

interface CartContextType {
  state: CartState;
  addItem: (produto: Produto) => Promise<void>;
  removeItem: (produtoId: string) => Promise<void>;
  updateQuantity: (produtoId: string, quantidade: number) => Promise<void>;
  clearCart: (skipConfirmation?: boolean) => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isInCart: (produtoId: string) => boolean;
  getItemQuantity: (produtoId: string) => number;
  validateStock: () => Promise<{ valid: boolean; errors: string[] }>;
  isLoading: boolean;
  isSyncing: boolean; // Novo estado para controlar sincronização
  syncCarrinho: () => Promise<void>; // Função para sincronizar carrinho manualmente
  lastSyncTimestamp: number; // Timestamp da última sincronização
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Limite padrão global (pode ser sobrescrito por produto)
const DEFAULT_MAX_QUANTITY_PER_ITEM = 50;

// Helper para calcular propriedades derivadas
const calculateCartState = (items: CartItem[]): CartState => {
  const total = items.reduce(
    (sum, item) => sum + item.produto.preco_unitario * item.quantidade,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantidade, 0);

  return { items, total, itemCount };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      // ============================================================================
      // VALIDAÇÃO: Verificar se payload é válido (Erro #22.2)
      // ============================================================================
      if (!action.payload || !action.payload.id) {
        console.error("ADD_ITEM: payload inválido", action.payload);
        return state; // Retorna estado atual sem modificar
      }

      // Validar campos obrigatórios do produto
      if (!action.payload.nome || !action.payload.preco_unitario) {
        console.error(
          "ADD_ITEM: produto com campos obrigatórios faltando",
          action.payload
        );
        return state;
      }

      const existingItemIndex = state.items.findIndex(
        (item) => item.produto.id === action.payload.id
      );

      if (existingItemIndex > -1) {
        const newItems = [...state.items];
        const currentQuantity = newItems[existingItemIndex].quantidade;

        // ============================================================================
        // VALIDAÇÃO: Limite máximo (Erro #22.1 - melhorado)
        // ============================================================================
        // Nota: O aviso ao usuário é feito na função addItem, não no reducer
        // O reducer apenas garante que o estado não seja corrompido
        if (currentQuantity >= DEFAULT_MAX_QUANTITY_PER_ITEM) {
          console.warn(
            `Limite máximo atingido para produto ${action.payload.nome} (${currentQuantity}/${DEFAULT_MAX_QUANTITY_PER_ITEM})`
          );
          return state; // Retorna estado atual sem modificar
        }

        // Incrementar quantidade e atualizar timestamp
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantidade: currentQuantity + 1,
          addedAt: Date.now(), // Atualizar timestamp ao incrementar
        };

        return calculateCartState(newItems);
      }

      // Adicionar novo item
      const newItems = [
        ...state.items,
        {
          produto: action.payload,
          quantidade: 1,
          addedAt: Date.now(),
        },
      ];
      return calculateCartState(newItems);
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter(
        (item) => item.produto.id !== action.payload
      );
      return calculateCartState(newItems);
    }

    case "UPDATE_QUANTITY": {
      // ✅ VALIDAÇÃO: Confirmar que ID corresponde
      const newItems = state.items.map((item) => {
        if (item.produto.id === action.payload.id) {
          console.log(
            `🔄 [REDUCER] Atualizando ${item.produto.nome}: ${item.quantidade} → ${action.payload.quantidade}`
          );

          return {
            ...item,
            quantidade: action.payload.quantidade,
            addedAt: Date.now(),
          };
        }
        return item;
      });

      return calculateCartState(newItems);
    }

    case "CLEAR_CART":
      return calculateCartState([]);

    case "LOAD_CART":
      return calculateCartState(action.payload);

    case "SET_ITEMS":
      return {
        ...state,
        items: action.payload,
      };

    default:
      return state;
  }
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, calculateCartState([]));
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // ✅ CORRIGIDO: setIsUserLoaded → setIsInitialLoading
  const [addingProducts, setAddingProducts] = useState<Set<string>>(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false); // ✅ MANTIDO: Declaração correta

  // ✅ NOVO: Estado para controlar sincronização
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(
    Date.now()
  );
  const realtimeChannel = useRef<RealtimeChannel | null>(null);

  // ✅ ADICIONADO: Estados faltantes
  const [isTokenExpiringSoon, setIsTokenExpiringSoon] = useState(false);
  const [hasPendingOperations, setHasPendingOperations] = useState(false);

  const cartKey = `cart_${currentUserId || "guest"}`;

  // ============================================================================
  // HELPER: Verificar e renovar sessão (Erro #10.1)
  // ============================================================================
  // Previne falhas por token expirado durante operações críticas
  const ensureValidSession = async (): Promise<boolean> => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Erro ao verificar sessão:", error);
        return false;
      }

      if (!session) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente para continuar.",
          variant: "destructive",
        });
        return false;
      }

      // Verificar se o token está próximo de expirar (menos de 5 minutos)
      const expiresAt = session.expires_at || 0;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;

      if (timeUntilExpiry < 300) {
        // Menos de 5 minutos
        console.log("Token próximo de expirar, renovando...");
        const {
          data: { session: newSession },
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (refreshError || !newSession) {
          console.error("Erro ao renovar sessão:", refreshError);
          toast({
            title: "Sessão expirada",
            description: "Por favor, faça login novamente.",
            variant: "destructive",
          });
          return false;
        }

        console.log("Sessão renovada com sucesso");
      }

      return true;
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      return false;
    }
  };

  // Carregar usuário apenas uma vez ao montar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { user } = await auth.getCurrentUser();
        setCurrentUserId(user?.id || null);
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        setCurrentUserId(null);
      } finally {
        setIsUserLoaded(true);
      }
    };

    loadUser();
  }, []); // Executa apenas uma vez ao montar

  // Carregar carrinho do banco de dados ou localStorage
  useEffect(() => {
    if (!isUserLoaded) return; // Aguarda usuário ser carregado

    const loadCart = async () => {
      setIsUserLoaded(true);

      try {
        if (currentUserId) {
          // Usuário logado: carregar do banco
          const { data, error } = await supabase
            .from("carrinho_itens")
            .select(
              `
              id,
              quantidade,
              preco_unitario,
              created_at,
              produto_id,
              produtos!inner (
                id,
                nome,
                descricao,
                preco_unitario,
                quantidade_estoque,
                categoria_id,
                imagem_url,
                status
              )
            `
            )
            .eq("user_id", currentUserId);

          if (error) {
            console.error("Erro ao carregar do banco:", error);

            // Fallback: tentar carregar do localStorage
            const savedCart = localStorage.getItem(cartKey);
            if (savedCart) {
              try {
                const items = JSON.parse(savedCart);
                dispatch({ type: "LOAD_CART", payload: items });
                toast({
                  title: "Carrinho carregado do cache",
                  description:
                    "Seus itens foram recuperados do armazenamento local.",
                });
              } catch (parseError) {
                console.error("Erro ao parsear localStorage:", parseError);
                toast({
                  title: "Erro ao carregar carrinho",
                  description: "Não foi possível recuperar seus itens.",
                  variant: "destructive",
                });
              }
            } else {
              toast({
                title: "Erro ao carregar carrinho",
                description:
                  "Não foi possível carregar seus itens do servidor.",
                variant: "destructive",
              });
            }
            return;
          }

          if (data && data.length > 0) {
            // Validar e mapear dados com segurança
            const cartItems: CartItem[] = (data as unknown as CarrinhoItemDB[])
              .filter((item) => {
                if (!item.produtos) {
                  console.warn("Item sem produto associado:", item.id);
                  return false;
                }
                if (!item.produtos.id || !item.produtos.nome) {
                  console.warn("Produto com dados incompletos:", item.produtos);
                  return false;
                }
                // Validar se produto está ativo
                if (item.produtos.status === false) {
                  console.warn(
                    "Produto inativo no carrinho:",
                    item.produtos.nome
                  );
                  return false;
                }
                return true;
              })
              .map((item: any) => ({
                produto: {
                  id: item.produtos.id,
                  nome: item.produtos.nome,
                  descricao: item.produtos.descricao || "",
                  preco_unitario:
                    item.produtos.preco_unitario || item.preco_unitario || 0,
                  quantidade: item.produtos.quantidade_estoque || 0,
                  quantidade_estoque: item.produtos.quantidade_estoque || 0,
                  categoria: item.produtos.categoria_id || "",
                  categoria_id: item.produtos.categoria_id || null,
                  imagem_url: item.produtos.imagem_url || null,
                  status: item.produtos.status !== false,
                },
                quantidade: item.quantidade,
                addedAt: item.created_at
                  ? new Date(item.created_at).getTime()
                  : Date.now(),
              }));

            dispatch({ type: "LOAD_CART", payload: cartItems });

            // Salvar no localStorage como backup
            localStorage.setItem(cartKey, JSON.stringify(cartItems));
          } else {
            // Carrinho vazio no banco, limpar localStorage
            localStorage.removeItem(cartKey);
          }
        } else {
          // Guest: carregar do localStorage
          const savedCart = localStorage.getItem(cartKey);
          if (savedCart) {
            try {
              const items = JSON.parse(savedCart);

              // Validar estrutura dos itens
              const validItems = items.filter((item: any) => {
                return (
                  item.produto &&
                  item.produto.id &&
                  item.produto.nome &&
                  item.quantidade > 0
                );
              });

              if (validItems.length !== items.length) {
                console.warn(
                  `${
                    items.length - validItems.length
                  } itens inválidos removidos do localStorage`
                );
              }

              dispatch({ type: "LOAD_CART", payload: validItems });
            } catch (parseError) {
              console.error("Erro ao parsear localStorage:", parseError);
              localStorage.removeItem(cartKey);
              toast({
                title: "Erro ao carregar carrinho",
                description: "O carrinho foi corrompido e foi limpo.",
                variant: "destructive",
              });
            }
          }
        }
      } catch (error: any) {
        console.error("Erro ao carregar carrinho:", error);

        // Tentar fallback para localStorage
        const savedCart = localStorage.getItem(cartKey);
        if (savedCart) {
          try {
            const items = JSON.parse(savedCart);
            dispatch({ type: "LOAD_CART", payload: items });
            toast({
              title: "Carrinho carregado do cache",
              description:
                "Seus itens foram recuperados do armazenamento local.",
            });
          } catch (parseError) {
            console.error("Erro ao parsear localStorage:", parseError);
          }
        } else {
          toast({
            title: "Erro ao carregar carrinho",
            description:
              "Não foi possível carregar seus itens. Tente novamente.",
            variant: "destructive",
          });
        }
      } finally {
        setIsUserLoaded(false);
      }
    };

    loadCart();
  }, [currentUserId, isUserLoaded, cartKey, toast]); // Dependências completas

  // Salvar no localStorage sempre que o carrinho mudar
  useEffect(() => {
    // Usar requestIdleCallback para não bloquear a thread principal
    const saveToLocalStorage = () => {
      try {
        if (state.items.length > 0) {
          // Validar dados antes de serializar
          const itemsToSave = state.items.map((item) => ({
            produto: {
              id: item.produto.id,
              nome: item.produto.nome,
              descricao: item.produto.descricao,
              preco_unitario: item.produto.preco_unitario,
              quantidade: item.produto.quantidade,
              quantidade_estoque: item.produto.quantidade_estoque,
              categoria: item.produto.categoria,
              categoria_id: item.produto.categoria_id,
              imagem_url: item.produto.imagem_url,
              status: item.produto.status,
            },
            quantidade: item.quantidade,
            addedAt: item.addedAt,
          }));

          const serialized = JSON.stringify(itemsToSave);
          localStorage.setItem(cartKey, serialized);
        } else {
          localStorage.removeItem(cartKey);
        }
      } catch (error: any) {
        // Tratamento de erros específicos
        if (error.name === "QuotaExceededError") {
          console.error("localStorage cheio. Limpando dados antigos...");

          // Tentar limpar dados antigos e salvar novamente
          try {
            // Limpar outros carrinhos antigos (de outros usuários/guest)
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith("cart_") && key !== cartKey) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach((key) => localStorage.removeItem(key));

            // Tentar salvar novamente
            if (state.items.length > 0) {
              localStorage.setItem(cartKey, JSON.stringify(state.items));
            }

            toast({
              title: "Espaço de armazenamento otimizado",
              description: "Dados antigos foram removidos para liberar espaço.",
            });
          } catch (retryError) {
            console.error(
              "Erro ao salvar no localStorage após limpeza:",
              retryError
            );
            toast({
              title: "Aviso",
              description:
                "Não foi possível salvar o carrinho localmente. Seus dados estão seguros no servidor.",
            });
          }
        } else if (error.message?.includes("circular")) {
          console.error("Erro de referência circular ao serializar:", error);
          toast({
            title: "Erro ao salvar carrinho",
            description: "Erro de dados. Por favor, recarregue a página.",
            variant: "destructive",
          });
        } else {
          console.error("Erro ao salvar no localStorage:", error);
        }
      }
    };

    // Usar requestIdleCallback se disponível, senão setTimeout
    if ("requestIdleCallback" in window) {
      const idleCallbackId = requestIdleCallback(saveToLocalStorage, {
        timeout: 2000,
      });
      return () => cancelIdleCallback(idleCallbackId);
    } else {
      const timeoutId = setTimeout(saveToLocalStorage, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [state.items, cartKey, toast]);

  const addItem = async (produto: Produto) => {
    if (addingProducts.has(produto.id)) {
      return;
    }

    setAddingProducts((prev) => new Set(prev).add(produto.id));

    try {
      const existingItem = state.items.find(
        (item) => item.produto.id === produto.id
      );
      const quantidadeNoCarrinho = existingItem?.quantidade || 0;
      const newQuantity = quantidadeNoCarrinho + 1;

      const { data: validacao, error: rpcError } = await supabase.rpc(
        "validar_e_reservar_estoque",
        {
          p_produto_id: produto.id,
          p_quantidade: newQuantity,
        }
      );

      if (rpcError) {
        console.error("Erro ao validar estoque:", rpcError);
        toast({
          title: "Erro ao verificar estoque",
          description: "Não foi possível verificar disponibilidade do produto.",
          variant: "destructive",
        });
        return;
      }

      const resultado = Array.isArray(validacao) ? validacao[0] : validacao;

      if (!resultado || !resultado.disponivel) {
        const estoqueAtual = resultado?.estoque_atual || 0;
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${estoqueAtual} unidade(s) disponível(is) em estoque`,
          variant: "destructive",
        });
        return;
      }

      const produtoComEstoqueAtual = {
        ...produto,
        quantidade_estoque: resultado.estoque_atual,
        status: true,
      };

      // ✅ CORREÇÃO: Banco PRIMEIRO, dispatch DEPOIS
      if (currentUserId) {
        const { data: itemSalvo, error: dbError } = await supabase
          .from("carrinho_itens")
          .upsert(
            {
              user_id: currentUserId,
              produto_id: produto.id,
              quantidade: newQuantity,
            },
            {
              onConflict: "user_id,produto_id",
            }
          )
          .select(
            `
            *,
            produtos!inner (
              preco_unitario,
              nome,
              imagem_url
            )
          `
          )
          .single();

        if (dbError) {
          console.error("Erro ao adicionar produto:", dbError);
          toast({
            title: "Erro ao adicionar produto",
            description:
              dbError.message || "Não foi possível adicionar o produto.",
            variant: "destructive",
          });
          return;
        }

        // ✅ CORREÇÃO: Dispatch APENAS se banco confirmou sucesso
        dispatch({
          type: "ADD_ITEM",
          payload: {
            ...produtoComEstoqueAtual,
            preco_unitario: itemSalvo.produtos.preco_unitario,
            nome: itemSalvo.produtos.nome,
            imagem_url: itemSalvo.produtos.imagem_url,
          },
        });

        toast({
          title: "Produto adicionado!",
          description: `${produto.nome} foi adicionado ao carrinho.`,
        });
      } else {
        // Usuário não logado: apenas localStorage
        dispatch({
          type: "ADD_ITEM",
          payload: produtoComEstoqueAtual,
        });

        toast({
          title: "Produto adicionado!",
          description: `${produto.nome} foi adicionado ao carrinho.`,
        });
      }
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao adicionar o produto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setAddingProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(produto.id);
        return newSet;
      });
    }
  };

  // ✅ CORREÇÃO ERRO 1: Atualizar updateQuantity também
  const updateQuantity = async (produtoId: string, quantidade: number) => {
    console.log(`📦 [UPDATE QTY] Produto: ${produtoId}, Qtd: ${quantidade}`);

    const operationId = startOperation(`updateQuantity:${produtoId}`);

    try {
      // Validação básica
      if (quantidade <= 0) {
        toast({
          title: "Quantidade inválida",
          description: "A quantidade deve ser maior que zero.",
          variant: "destructive",
        });
        return;
      }

      // ✅ 1. Garantir sessão válida
      if (currentUserId) {
        const isSessionValid = await ensureValidSession();

        if (!isSessionValid) {
          toast({
            title: "Sessão expirada",
            description: "Faça login novamente para atualizar o carrinho.",
            variant: "destructive",
          });
          return;
        }
      }

      // ✅ 2. Buscar produto e validar estoque disponível
      const { data: produto, error: produtoError } = await supabase
        .from("produtos")
        .select("id, nome, quantidade_estoque, status")
        .eq("id", produtoId)
        .single();

      if (produtoError || !produto) {
        console.error("Erro ao buscar produto:", produtoError);
        toast({
          title: "Erro ao validar estoque",
          description: "Não foi possível verificar disponibilidade do produto.",
          variant: "destructive",
        });
        return;
      }

      // Validar se produto está ativo
      if (!produto.status || produto.status === false) {
        toast({
          title: "Produto indisponível",
          description: "Este produto não está mais disponível.",
          variant: "destructive",
        });
        return;
      }

      // ✅ 3. Calcular total já em OUTROS carrinhos
      const { data: outrosCarrinhos, error: outrosError } = await supabase
        .from("carrinho_itens")
        .select("quantidade")
        .eq("produto_id", produtoId)
        .neq("user_id", currentUserId || "");

      if (outrosError) {
        console.error("Erro ao buscar outros carrinhos:", outrosError);
        // Continua mesmo com erro (pior caso: valida apenas contra estoque total)
      }

      const totalEmOutrosCarrinhos =
        outrosCarrinhos?.reduce((sum, item) => sum + item.quantidade, 0) || 0;

      const estoqueDisponivel =
        produto.quantidade_estoque - totalEmOutrosCarrinhos;

      // ✅ 4. Validar se quantidade solicitada está disponível
      if (quantidade > estoqueDisponivel) {
        toast({
          title: "Estoque insuficiente",
          description: `Apenas ${estoqueDisponivel} unidades disponíveis.`,
          variant: "destructive",
        });
        return;
      }

      // ✅ 5. Validar limite máximo por item (50 unidades)
      if (quantidade > 50) {
        toast({
          title: "Limite excedido",
          description: "Máximo de 50 unidades por item.",
          variant: "destructive",
        });
        return;
      }

      // ✅ 6. Atualizar no banco PRIMEIRO
      const { error: updateError } = await supabase
        .from("carrinho_itens")
        .update({
          quantidade: quantidade,
          updated_at: new Date().toISOString(),
          // ✅ NÃO enviar preço (trigger mantém atualizado)
        })
        .eq("user_id", currentUserId)
        .eq("produto_id", produtoId);

      if (updateError) {
        console.error("Erro ao atualizar quantidade:", updateError);

        // Mensagens específicas
        if (updateError.message?.includes("Estoque insuficiente")) {
          toast({
            title: "Estoque insuficiente",
            description:
              "Outro usuário adicionou este produto enquanto você atualizava.",
            variant: "destructive",
          });
        } else if (updateError.message?.includes("Quantidade máxima")) {
          toast({
            title: "Limite excedido",
            description: "Máximo de 50 unidades por item.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao atualizar",
            description: "Não foi possível atualizar a quantidade.",
            variant: "destructive",
          });
        }
        return;
      }

      // ✅ 7. Atualizar estado local APENAS após sucesso
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { id: produtoId, quantidade },
      });

      // ✅ 8. Atualizar localStorage
      try {
        const updatedCart = state.items.map((item) =>
          item.produto.id === produtoId ? { ...item, quantidade } : item
        );
        localStorage.setItem("wave-surf-cart", JSON.stringify(updatedCart));
      } catch (storageError) {
        console.warn(
          "Erro ao salvar localStorage (não crítico):",
          storageError
        );
      }

      toast({
        title: "Quantidade atualizada",
        description: `Quantidade alterada para ${quantidade} unidade(s).`,
      });
    } catch (error) {
      console.error(`❌ [UPDATE QTY] Erro:`, error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a quantidade.",
        variant: "destructive",
      });
    } finally {
      endOperation(operationId);
    }
  };

  const removeItem = async (produtoId: string) => {
    try {
      // ✅ CORREÇÃO: Banco PRIMEIRO
      if (currentUserId) {
        const { error: dbError } = await supabase
          .from("carrinho_itens")
          .delete()
          .eq("user_id", currentUserId)
          .eq("produto_id", produtoId);

        if (dbError) {
          console.error("Erro ao remover item:", dbError);
          toast({
            title: "Erro ao remover",
            description: "Não foi possível remover o produto do carrinho.",
            variant: "destructive",
          });
          return; // ✅ PARA AQUI se banco falhar
        }

        // ✅ Dispatch APENAS se banco confirmou
        dispatch({
          type: "REMOVE_ITEM",
          payload: produtoId,
        });

        toast({
          title: "Produto removido",
          description: "Produto removido do carrinho com sucesso.",
        });
      } else {
        // localStorage
        dispatch({
          type: "REMOVE_ITEM",
          payload: produtoId,
        });

        toast({
          title: "Produto removido",
          description: "Produto removido do carrinho com sucesso.",
        });
      }
    } catch (error) {
      console.error("Erro ao remover item:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o produto.",
        variant: "destructive",
      });
    }
  };

  const clearCart = async (skipConfirmation = false) => {
    if (state.items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Não há itens para remover.",
      });
      return;
    }

    if (!skipConfirmation) {
      setShowClearConfirm(true);
      return;
    }

    try {
      // ✅ CORREÇÃO: Banco PRIMEIRO
      if (currentUserId) {
        const { error: dbError } = await supabase
          .from("carrinho_itens")
          .delete()
          .eq("user_id", currentUserId);

        if (dbError) {
          console.error("Erro ao limpar carrinho:", dbError);
          toast({
            title: "Erro ao limpar carrinho",
            description: "Não foi possível limpar o carrinho.",
            variant: "destructive",
          });
          return; // ✅ PARA AQUI se banco falhar
        }

        // ✅ Dispatch APENAS se banco confirmou
        dispatch({ type: "CLEAR_CART" });

        toast({
          title: "Carrinho limpo",
          description: "Todos os produtos foram removidos do carrinho.",
        });
      } else {
        // localStorage
        dispatch({ type: "CLEAR_CART" });

        toast({
          title: "Carrinho limpo",
          description: "Todos os produtos foram removidos do carrinho.",
        });
      }
    } catch (error) {
      console.error("Erro ao limpar carrinho:", error);
      toast({
        title: "Erro ao limpar carrinho",
        description: "Não foi possível limpar o carrinho.",
        variant: "destructive",
      });
    }
  };

  // Memoizar funções auxiliares para evitar re-renders desnecessários
  const getTotalItems = useCallback(() => {
    return state.items.reduce((total, item) => total + item.quantidade, 0);
  }, [state.items]);

  const getTotalPrice = useCallback(() => {
    return state.items.reduce((total, item) => {
      // Usar preco_unitario (sempre definido) ao invés de fallback com ||
      const preco = item.produto.preco_unitario;
      return total + preco * item.quantidade;
    }, 0);
  }, [state.items]);

  const isInCart = useCallback(
    (produtoId: string) => {
      // ✅ VALIDAÇÃO: Verificação completa incluindo array vazio
      if (
        !produtoId ||
        !state?.items ||
        !Array.isArray(state.items) ||
        state.items.length === 0
      ) {
        return false;
      }

      return state.items.some((item) => {
        // ✅ VALIDAÇÃO: Defensiva completa
        if (!item) {
          return false;
        }

        // ✅ CORREÇÃO: Verificar se tem produto completo OU produto_id direto
        const itemProdutoId = item?.produto?.id || item?.produto_id;

        if (!itemProdutoId) {
          return false;
        }

        return itemProdutoId === produtoId;
      });
    },
    [state?.items]
  );

  const getItemQuantity = useCallback(
    (produtoId: string) => {
      const item = state.items.find((item) => item.produto.id === produtoId);
      return item ? item.quantidade : 0;
    },
    [state.items]
  );

  const validateStock = useCallback(async (): Promise<{
    valid: boolean;
    errors: string[];
  }> => {
    const errors: string[] = [];

    try {
      // Buscar estoque atualizado de todos os produtos no carrinho
      const produtoIds = state.items.map((item) => item.produto.id);

      if (produtoIds.length === 0) {
        return { valid: true, errors: [] };
      }

      const { data: produtos, error } = await supabase
        .from("produtos")
        .select("id, nome, quantidade_estoque, status")
        .in("id", produtoIds);

      if (error) {
        console.error("Erro ao validar estoque:", error);
        errors.push("Não foi possível validar o estoque. Tente novamente.");
        return { valid: false, errors };
      }

      // Validar cada item do carrinho
      for (const item of state.items) {
        const produto = produtos?.find((p) => p.id === item.produto.id);

        if (!produto) {
          errors.push(
            `Produto "${item.produto.nome}" não está mais disponível.`
          );
          continue;
        }

        if (!produto.status) {
          errors.push(`Produto "${item.produto.nome}" está inativo.`);
          continue;
        }

        if (item.quantidade > produto.quantidade_estoque) {
          errors.push(
            `Produto "${item.produto.nome}": quantidade solicitada (${item.quantidade}) ` +
              `excede o estoque disponível (${produto.quantidade_estoque}).`
          );
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error: any) {
      console.error("Erro ao validar estoque:", error);
      errors.push("Erro ao validar estoque. Tente novamente.");
      return { valid: false, errors };
    }
  }, [state.items]);

  // ✅ CORREÇÃO ERRO #9: Função para fazer merge inteligente de carrinhos
  const mergeCarrinhos = useCallback(
    (
      carrinhoLocal: CarrinhoItem[],
      carrinhoBanco: CarrinhoItem[]
    ): CarrinhoItem[] => {
      const merged = new Map<string, CarrinhoItem>();

      // Adicionar itens do banco
      carrinhoBanco.forEach((item) => {
        merged.set(item.produto_id, item);
      });

      // Fazer merge com itens locais
      carrinhoLocal.forEach((itemLocal) => {
        const itemBanco = merged.get(itemLocal.produto_id);

        if (itemBanco) {
          // Item existe em ambos: usar maior quantidade
          merged.set(itemLocal.produto_id, {
            ...itemBanco,
            quantidade: Math.max(itemLocal.quantidade, itemBanco.quantidade),
            updated_at: new Date(
              Math.max(
                new Date(itemLocal.updated_at || 0).getTime(),
                new Date(itemBanco.updated_at || 0).getTime()
              )
            ).toISOString(),
          });
        } else {
          // Item existe apenas localmente
          merged.set(itemLocal.produto_id, itemLocal);
        }
      });

      return Array.from(merged.values());
    },
    []
  );

  // ✅ CORREÇÃO ERRO #9: Sincronizar carrinho quando detectar conflito
  const syncCarrinho = useCallback(async () => {
    if (!currentUserId || isSyncing) return;

    setIsSyncing(true);

    try {
      // 1. Buscar carrinho atual do banco
      const { data: carrinhoBanco, error } = await supabase
        .from("carrinho_itens")
        .select("*, produtos(*)")
        .eq("user_id", currentUserId);

      if (error) {
        console.error("Erro ao sincronizar carrinho:", error);
        return;
      }

      // 2. Comparar com estado local
      const carrinhoLocal = state.items;

      // 3. Fazer merge inteligente
      const carrinhoMerged = mergeCarrinhos(carrinhoLocal, carrinhoBanco || []);

      // 4. Se houve mudanças, atualizar banco e estado
      if (JSON.stringify(carrinhoMerged) !== JSON.stringify(carrinhoLocal)) {
        // Atualizar banco com merge
        const promises = carrinhoMerged.map((item) =>
          supabase.from("carrinho_itens").upsert(
            {
              user_id: currentUserId,
              produto_id: item.produto_id,
              quantidade: item.quantidade,
              preco_unitario: item.preco_unitario,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id,produto_id",
            }
          )
        );

        await Promise.all(promises);

        // Atualizar estado local
        dispatch({ type: "SET_ITEMS", payload: carrinhoMerged });

        // Notificar usuário
        toast({
          title: "Carrinho sincronizado",
          description:
            "Detectamos alterações em outro dispositivo e sincronizamos seu carrinho.",
        });
      }

      setLastSyncTimestamp(Date.now());
    } catch (error) {
      console.error("Erro na sincronização:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUserId, isSyncing, state.items, mergeCarrinhos]);

  // ✅ CORREÇÃO ERRO #9: Configurar Realtime para sincronização automática
  useEffect(() => {
    if (!currentUserId) {
      // Limpar canal se usuário deslogou
      if (realtimeChannel.current) {
        realtimeChannel.current.unsubscribe();
        realtimeChannel.current = null;
      }
      return;
    }

    // Criar canal de realtime
    const channel = supabase
      .channel(`carrinho:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "carrinho_itens",
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log("Mudança detectada no carrinho:", payload);

          // Sincronizar após mudança em outro dispositivo
          syncCarrinho();
        }
      )
      .subscribe((status) => {
        console.log("Status do canal realtime:", status);
      });

    realtimeChannel.current = channel;

    // Cleanup
    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId, syncCarrinho]);

  // ✅ CORREÇÃO ERRO #9: Sincronização periódica - DESABILITADA TEMPORARIAMENTE
  useEffect(() => {
    if (!currentUserId) return;

    // ⚠️ DESABILITADO PARA TESTE
    console.log(
      "⏸️ [syncCarrinho] Sincronização periódica DESABILITADA para debug"
    );
    return;

    // const interval = setInterval(() => {
    //   syncCarrinho();
    // }, 5000);
    // return () => clearInterval(interval);
  }, [currentUserId, syncCarrinho]);

  // ✅ ADICIONADO: Funções de operação (guards)
  const startOperation = useCallback((operationId: string) => {
    console.log(`🔵 [OPERATION START] ${operationId}`);
    setHasPendingOperations(true);
    return operationId;
  }, []);

  const endOperation = useCallback((operationId: string) => {
    console.log(`🟢 [OPERATION END] ${operationId}`);
    setHasPendingOperations(false);
  }, []);

  // ✅ ADICIONADO: Monitorar expiração do token
  useEffect(() => {
    if (!currentUserId) return;

    const checkTokenExpiration = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const expiresAt = session.expires_at || 0;
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = expiresAt - now;

          // Token expira em menos de 5 minutos
          setIsTokenExpiringSoon(timeUntilExpiry < 300);

          console.log(
            `⏰ [TOKEN] Expira em ${Math.floor(timeUntilExpiry / 60)} minutos`
          );
        }
      } catch (error) {
        console.error("❌ [TOKEN] Erro ao verificar expiração:", error);
      }
    };

    // Verificar a cada 1 minuto
    const interval = setInterval(checkTokenExpiration, 60000);
    checkTokenExpiration(); // Verificar imediatamente

    return () => clearInterval(interval);
    checkTokenExpiration(); // Verificar imediatamente

    return () => clearInterval(interval);
  }, [currentUserId]);

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        isInCart,
        getItemQuantity,
        validateStock,
        isLoading: isLoading || isInitialLoading,
        isSyncing,
        syncCarrinho,
        lastSyncTimestamp,
      }}
    >
      {children}

      {/* Dialog de confirmação para limpar carrinho */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar carrinho?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover todos os {state.items.length}{" "}
              {state.items.length === 1 ? "item" : "itens"} do carrinho? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowClearConfirm(false);
                clearCart(true);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Limpar Carrinho
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
