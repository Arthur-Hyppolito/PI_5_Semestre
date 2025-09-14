import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Heart, Share2, Package, Truck, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import surfboardsImage from "@/assets/surfboards.jpg";

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  quantidade: number;
  categoria: string;
  imagem_url?: string;
}

interface ProductDetailProps {
  product: Produto | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetail = ({ product, isOpen, onClose }: ProductDetailProps) => {
  const { toast } = useToast();

  if (!product) return null;

  const handleAddToCart = () => {
    toast({
      title: "Produto adicionado!",
      description: `${product.nome} foi adicionado ao carrinho.`,
    });
  };

  const handleAddToWishlist = () => {
    toast({
      title: "Adicionado aos favoritos!",
      description: `${product.nome} foi salvo na sua lista de desejos.`,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.nome,
        text: product.descricao,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link do produto foi copiado para a área de transferência.",
      });
    }
  };

  const getStockStatus = () => {
    if (product.quantidade > 10) {
      return { text: "Em estoque", color: "bg-green-100 text-green-800" };
    } else if (product.quantidade > 0) {
      return { text: "Últimas unidades", color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { text: "Esgotado", color: "bg-red-100 text-red-800" };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-ocean-deep">
            {product.nome}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border">
              <img 
                src={product.imagem_url || surfboardsImage} 
                alt={product.nome}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src = surfboardsImage;
                }}
              />
            </div>
            
            {/* Additional product images placeholder */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded border opacity-50">
                  <img 
                    src={product.imagem_url || surfboardsImage} 
                    alt={`${product.nome} - Imagem ${i}`}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = surfboardsImage;
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category and Stock */}
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-ocean-medium border-ocean-medium">
                {product.categoria}
              </Badge>
              <Badge className={stockStatus.color}>
                {stockStatus.text}
              </Badge>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="text-3xl font-bold text-ocean-deep">
                R$ {product.preco.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                À vista no PIX ou em até 12x sem juros
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Descrição</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.descricao}
              </p>
            </div>

            <Separator />

            {/* Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Características</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <Package className="h-4 w-4 text-ocean-medium" />
                  <span>Produto original com garantia</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="h-4 w-4 text-ocean-medium" />
                  <span>Frete grátis para todo o Brasil</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-ocean-medium" />
                  <span>Garantia de 12 meses</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Stock Info */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Disponível:</span>
                <span className="font-medium">{product.quantidade} unidades</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleAddToCart}
                disabled={product.quantidade === 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {product.quantidade > 0 ? "Adicionar ao Carrinho" : "Produto Esgotado"}
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleAddToWishlist}
                  className="flex items-center gap-2"
                >
                  <Heart className="h-4 w-4" />
                  Favoritar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleShare}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Produto ID: {product.id}</p>
              <p>• Categoria: {product.categoria}</p>
              <p>• Consulte condições de frete e prazo de entrega</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetail;
