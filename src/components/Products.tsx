import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, auth } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import surfboardsImage from "@/assets/surfboards.jpg";
import ProductDetail from "./ProductDetail";
import { useCart } from "@/contexts/CartContext";

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco_unitario: number; // Campo real do banco - sempre obrigatório
  quantidade: number;
  quantidade_estoque: number; // Campo do banco - sempre obrigatório
  categoria: string;
  categoria_id: string | null; // Campo do banco
  imagem_url: string | null;
  status: boolean; // Campo do banco - sempre obrigatório
}

const Products = () => {
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    addItem,
    isInCart,
    getItemQuantity,
    isLoading: cartLoading,
  } = useCart();

  useEffect(() => {
    loadProducts();
    checkAuthStatus();

    // Configurar realtime subscription para atualizações automáticas
    const channel = supabase
      .channel("produtos-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Escuta INSERT, UPDATE, DELETE
          schema: "public",
          table: "produtos",
        },
        (payload) => {
          console.log("Produto alterado:", payload);
          setIsUpdating(true);

          // Mostrar notificação de atualização
          toast({
            title: "Produtos atualizados!",
            description: "Os produtos foram atualizados automaticamente.",
          });

          // Recarregar produtos quando houver mudanças
          loadProducts();
        }
      )
      .subscribe();

    // Escutar mudanças na tabela de movimentações de estoque
    const movimentacoesChannel = supabase
      .channel("movimentacoes-estoque-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "movimentacoes_estoque",
        },
        (payload) => {
          console.log("Movimentação de estoque registrada:", payload);
          setIsUpdating(true);

          // Mostrar notificação de atualização de estoque
          toast({
            title: "Estoque atualizado!",
            description: "Uma movimentação de estoque foi registrada.",
          });

          // Recarregar produtos para refletir mudanças no estoque
          loadProducts();
        }
      )
      .subscribe();

    // Escutar eventos customizados do sistema
    const handleProdutoAtualizado = (event: CustomEvent) => {
      console.log("Produto atualizado via evento:", event.detail);
      setIsUpdating(true);
      loadProducts();
    };

    const handleEstoqueAtualizado = (event: CustomEvent) => {
      console.log("Estoque atualizado via evento:", event.detail);
      setIsUpdating(true);
      toast({
        title: "Estoque atualizado!",
        description: `Produto ${event.detail.produtoNome} teve seu estoque alterado.`,
      });
      loadProducts();
    };

    window.addEventListener(
      "produtoAtualizado",
      handleProdutoAtualizado as EventListener
    );
    window.addEventListener(
      "estoqueAtualizado",
      handleEstoqueAtualizado as EventListener
    );

    // Polling como fallback (a cada 30 segundos)
    const pollingInterval = setInterval(() => {
      loadProducts();
    }, 30000);

    // Cleanup subscription, polling e event listeners
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(movimentacoesChannel);
      clearInterval(pollingInterval);
      window.removeEventListener(
        "produtoAtualizado",
        handleProdutoAtualizado as EventListener
      );
      window.removeEventListener(
        "estoqueAtualizado",
        handleEstoqueAtualizado as EventListener
      );
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { user } = await auth.getCurrentUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("status", true) // Apenas produtos ativos
        .gt("quantidade_estoque", 0) // Apenas produtos em estoque
        .order("created_at", { ascending: false })
        .limit(6);

      console.log("Produtos carregados do banco:", data);

      if (error) {
        console.error("Erro ao carregar produtos:", error);
        // Fallback para produtos mock se a tabela não existir
        setProducts([
          {
            id: "1",
            nome: "Prancha Shortboard Pro 6.2",
            descricao:
              "Prancha profissional para surfistas experientes com tecnologia avançada",
            preco_unitario: 1299.99,
            quantidade: 15,
            quantidade_estoque: 15,
            categoria: "Pranchas",
            categoria_id: null,
            imagem_url:
              "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&h=300&fit=crop",
            status: true,
          },
          {
            id: "2",
            nome: "Longboard Classic 9.6",
            descricao: "Longboard clássico perfeito para iniciantes e cruising",
            preco_unitario: 899.99,
            quantidade: 8,
            quantidade_estoque: 8,
            categoria: "Pranchas",
            categoria_id: null,
            imagem_url:
              "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=500&h=300&fit=crop",
            status: true,
          },
          {
            id: "3",
            nome: "Wetsuit Premium 4/3mm",
            descricao: "Wetsuit de alta qualidade para águas frias",
            preco_unitario: 599.99,
            quantidade: 12,
            quantidade_estoque: 12,
            categoria: "Wetsuits",
            categoria_id: null,
            imagem_url:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop",
            status: true,
          },
          {
            id: "4",
            nome: "Leash Surf Premium 6ft",
            descricao: "Leash resistente para pranchas de surf",
            preco_unitario: 89.99,
            quantidade: 25,
            quantidade_estoque: 25,
            categoria: "Acessórios",
            categoria_id: null,
            imagem_url:
              "https://images.unsplash.com/photo-1502933691298-84fc14542831?w=500&h=300&fit=crop",
            status: true,
          },
          {
            id: "5",
            nome: "Kit Quilhas FCS II",
            descricao: "Set completo de quilhas FCS II para máxima performance",
            preco_unitario: 159.99,
            quantidade: 18,
            quantidade_estoque: 18,
            categoria: "Acessórios",
            categoria_id: null,
            imagem_url:
              "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=500&h=300&fit=crop",
            status: true,
          },
          {
            id: "6",
            nome: "Cera Surf Tropical Premium",
            descricao:
              "Cera especial para águas tropicais com aderência perfeita",
            preco_unitario: 24.99,
            quantidade: 50,
            quantidade_estoque: 50,
            categoria: "Acessórios",
            categoria_id: null,
            imagem_url:
              "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop",
            status: true,
          },
        ]);
      } else {
        // Mapear campos do banco para interface do frontend
        const produtosMapeados = (data || []).map((p) => ({
          id: p.id,
          nome: p.nome,
          descricao: p.descricao || "",
          preco_unitario: p.preco_unitario || 0,
          quantidade: p.quantidade_estoque || 0,
          quantidade_estoque: p.quantidade_estoque || 0,
          categoria: p.categoria_id || "",
          categoria_id: p.categoria_id || null,
          imagem_url: p.imagem_url || null,
          status: p.status !== false,
        }));

        console.log("Produtos mapeados:", produtosMapeados);
        setProducts(produtosMapeados);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setProducts([]);
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  };

  const handleManualRefresh = () => {
    setIsUpdating(true);
    loadProducts();
  };

  const handleViewMore = async (product: Produto) => {
    // Verificar se o usuário está autenticado
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description:
          "Você precisa fazer login para ver os detalhes do produto.",
        variant: "destructive",
      });
      // Redirecionar para página de login
      navigate("/login");
      return;
    }

    // Se autenticado, abrir modal de detalhes
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = (product: Produto) => {
    addItem(product);
  };

  return (
    <section id="produtos" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-ocean bg-clip-text text-transparent">
            Nossos Produtos
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Equipamentos de alta qualidade selecionados especialmente para
            surfistas apaixonados
          </p>

          {/* Indicador de atualização e botão de refresh manual */}
          <div className="flex justify-center items-center mt-4 space-x-4">
            {isUpdating && (
              <div className="flex items-center space-x-2 text-ocean-medium">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Atualizando produtos...</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isUpdating}
              className="flex items-center space-x-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isUpdating ? "animate-spin" : ""}`}
              />
              <span>Atualizar</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-medium mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando produtos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => {
              // ✅ ADICIONADO: Validação segura
              const produtoNoCarrinho = product?.id
                ? isInCart(product.id)
                : false;

              return (
                <Card
                  key={product.id}
                  className="group hover:shadow-[var(--shadow-ocean)] transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={product.imagem_url || surfboardsImage}
                      alt={product.nome}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = surfboardsImage;
                      }}
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-ocean-deep">
                      {product.nome}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {product.descricao}
                    </p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-2xl font-bold text-ocean-medium">
                        R$ {product.preco_unitario.toFixed(2)}
                      </span>
                      <Button
                        variant="wave"
                        size="sm"
                        onClick={() => handleViewMore(product)}
                      >
                        Ver Mais
                      </Button>
                    </div>

                    {/* Add to Cart Button */}
                    <div className="mb-3">
                      <Button
                        onClick={() => addItem(product)}
                        disabled={!product.id || produtoNoCarrinho} // ✅ Verifica se produto tem ID
                        className="w-full bg-ocean-medium hover:bg-ocean-deep disabled:opacity-50"
                        size="sm"
                      >
                        {cartLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Adicionando...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {produtoNoCarrinho
                              ? `No carrinho (${getItemQuantity(product.id)})`
                              : product.quantidade <= 0
                              ? "Esgotado"
                              : "Adicionar ao Carrinho"}
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="mt-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${
                          product.quantidade > 10
                            ? "bg-green-100 text-green-800"
                            : product.quantidade > 0
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.quantidade > 0
                          ? `${product.quantidade} em estoque`
                          : "Esgotado"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <Button variant="ocean" size="lg">
            Ver Todos os Produtos
          </Button>
        </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetail
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </section>
  );
};

export default Products;
