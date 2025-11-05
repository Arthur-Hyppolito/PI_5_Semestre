import { useState, useEffect } from "react";
import { auth, supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";
import {
  Waves,
  ArrowLeft,
  ShoppingCart,
  Search,
  Trash2,
  Eye,
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  User,
  Calendar,
  TrendingUp,
  XCircle,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
  };
}

interface Cliente {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  telefone?: string;
}

interface Produto {
  id: string;
  nome: string;
  preco_unitario: number;
  quantidade_estoque: number;
  imagem_url?: string;
  codigo_produto?: string;
}

interface CarrinhoItem {
  id: string;
  user_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  clientes?: Cliente;
  produtos?: Produto;
}

interface CarrinhoDetalhado {
  user_id: string;
  user_email: string;
  user_nome: string;
  total_itens: number;
  total_produtos: number;
  valor_total: number;
  ultimo_update: string;
  itens: CarrinhoItem[];
}

interface TentativaSuspeita {
  id: string;
  user_id: string;
  tipo_tentativa: string;
  created_at: string;
  diferenca_preco?: number;
  diferenca_quantidade?: number;
  payload_recebido: any;
}

export default function GerenciarCarrinhos() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [carrinhos, setCarrinhos] = useState<CarrinhoDetalhado[]>([]);
  const [tentativasSuspeitas, setTentativasSuspeitas] = useState<
    TentativaSuspeita[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [selectedCarrinho, setSelectedCarrinho] =
    useState<CarrinhoDetalhado | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [carrinhoToDelete, setCarrinhoToDelete] =
    useState<CarrinhoDetalhado | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    loadCarrinhos();
    loadTentativasSuspeitas();

    // Realtime subscription
    const channel = supabase
      .channel("carrinhos-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "carrinho_itens",
        },
        () => {
          loadCarrinhos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkUser = async () => {
    try {
      const { user, error } = await auth.getCurrentUser();

      if (error || !user) {
        navigate("/login");
        return;
      }

      const isUserAdmin = await auth.isAdmin(user.id);
      if (!isUserAdmin) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para gerenciar carrinhos.",
          variant: "destructive",
        });
        navigate("/backoffice");
        return;
      }

      setUser(user);
    } catch (error) {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadCarrinhos = async () => {
    try {
      // ✅ Query corrigida - buscar dados do cliente pela tabela clientes
      const { data: carrinhoData, error: carrinhoError } = await supabase
        .from("carrinho_itens")
        .select(
          `
          *,
          produtos (
            id,
            nome,
            preco_unitario,
            quantidade_estoque,
            imagem_url,
            codigo_produto
          )
        `
        )
        .order("updated_at", { ascending: false });

      if (carrinhoError) {
        console.error("Erro ao carregar itens do carrinho:", carrinhoError);
        setCarrinhos([]);
        return;
      }

      if (!carrinhoData || carrinhoData.length === 0) {
        console.log("Nenhum item no carrinho encontrado");
        setCarrinhos([]);
        return;
      }

      // ✅ Buscar dados dos clientes separadamente
      const userIds = [...new Set(carrinhoData.map((item) => item.user_id))];

      const { data: clientesData, error: clientesError } = await supabase
        .from("clientes")
        .select("id, auth_user_id, nome, sobrenome, email, telefone")
        .in("auth_user_id", userIds);

      if (clientesError) {
        console.error("Erro ao carregar dados dos clientes:", clientesError);
      }

      // ✅ Criar mapa de clientes por auth_user_id
      const clientesMap = new Map(
        (clientesData || []).map((cliente) => [cliente.auth_user_id, cliente])
      );

      // ✅ Agrupar por usuário com dados do cliente
      const carrinhosAgrupados = carrinhoData.reduce((acc, item) => {
        const userId = item.user_id;
        const cliente = clientesMap.get(userId);

        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            user_email: cliente?.email || "Email não disponível",
            user_nome: cliente
              ? `${cliente.nome || ""} ${cliente.sobrenome || ""}`.trim()
              : "Nome não disponível",
            total_itens: 0,
            total_produtos: 0,
            valor_total: 0,
            ultimo_update: item.updated_at,
            itens: [],
          };
        }

        acc[userId].total_itens += item.quantidade;
        acc[userId].total_produtos += 1;
        acc[userId].valor_total += item.quantidade * item.preco_unitario;

        // ✅ Adicionar dados do cliente ao item
        acc[userId].itens.push({
          ...item,
          clientes: cliente,
        });

        // Atualizar último update
        if (new Date(item.updated_at) > new Date(acc[userId].ultimo_update)) {
          acc[userId].ultimo_update = item.updated_at;
        }

        return acc;
      }, {} as Record<string, CarrinhoDetalhado>);

      const carrinhosList = Object.values(carrinhosAgrupados);

      console.log(`✅ ${carrinhosList.length} carrinho(s) carregado(s)`);
      setCarrinhos(carrinhosList);
    } catch (error) {
      console.error("Erro ao carregar carrinhos:", error);
      setCarrinhos([]);
    }
  };

  const loadTentativasSuspeitas = async () => {
    try {
      const { data, error } = await supabase
        .from("carrinho_tentativas_suspeitas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Erro ao carregar tentativas suspeitas:", error);
        setTentativasSuspeitas([]);
      } else {
        setTentativasSuspeitas(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar tentativas suspeitas:", error);
      setTentativasSuspeitas([]);
    }
  };

  const handleViewDetails = (carrinho: CarrinhoDetalhado) => {
    setSelectedCarrinho(carrinho);
    setIsDetailDialogOpen(true);
  };

  const handleDeleteClick = (carrinho: CarrinhoDetalhado) => {
    setCarrinhoToDelete(carrinho);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!carrinhoToDelete || deleting) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from("carrinho_itens")
        .delete()
        .eq("user_id", carrinhoToDelete.user_id);

      if (error) throw error;

      toast({
        title: "Carrinho excluído!",
        description: `Carrinho de ${carrinhoToDelete.user_nome} foi removido.`,
      });

      loadCarrinhos();
      setIsDeleteDialogOpen(false);
      setCarrinhoToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir carrinho:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o carrinho.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleLimparCarrinhosAntigos = async () => {
    try {
      // Usar função SQL do banco
      const { error } = await supabase.rpc("limpar_carrinhos_expirados");

      if (error) throw error;

      toast({
        title: "Limpeza concluída!",
        description: "Carrinhos antigos foram removidos.",
      });

      loadCarrinhos();
    } catch (error) {
      console.error("Erro ao limpar carrinhos:", error);
      toast({
        title: "Erro na limpeza",
        description: "Não foi possível limpar os carrinhos antigos.",
        variant: "destructive",
      });
    }
  };

  const filteredCarrinhos = carrinhos.filter((carrinho) => {
    const matchesSearch =
      carrinho.user_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carrinho.user_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "todos" ||
      (filterStatus === "abandonados" &&
        isCarrinhoAbandonado(carrinho.ultimo_update)) ||
      (filterStatus === "recentes" &&
        !isCarrinhoAbandonado(carrinho.ultimo_update));

    return matchesSearch && matchesStatus;
  });

  const isCarrinhoAbandonado = (ultimoUpdate: string) => {
    const diff = Date.now() - new Date(ultimoUpdate).getTime();
    return diff > 24 * 60 * 60 * 1000; // mais de 24h
  };

  const totalItensGeral = carrinhos.reduce((sum, c) => sum + c.total_itens, 0);
  const totalValorGeral = carrinhos.reduce((sum, c) => sum + c.valor_total, 0);
  const carrinhosAbandonados = carrinhos.filter((c) =>
    isCarrinhoAbandonado(c.ultimo_update)
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Waves className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/backoffice")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Gerenciar Carrinhos
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Carrinhos Ativos
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{carrinhos.length}</div>
              <p className="text-xs text-muted-foreground">
                Total de usuários com itens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Itens Totais
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItensGeral}</div>
              <p className="text-xs text-muted-foreground">
                Produtos em todos os carrinhos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totalValorGeral.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Potencial de vendas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abandonados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {carrinhosAbandonados}
              </div>
              <p className="text-xs text-muted-foreground">
                Mais de 24h sem atualização
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os carrinhos</SelectItem>
                <SelectItem value="recentes">Recentes (24h)</SelectItem>
                <SelectItem value="abandonados">
                  Abandonados (&gt;24h)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={handleLimparCarrinhosAntigos}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Limpar Antigos (30d+)</span>
          </Button>
        </div>

        {/* Carrinhos Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Carrinhos de Compras</CardTitle>
            <CardDescription>
              {filteredCarrinhos.length} carrinho(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCarrinhos.map((carrinho) => {
                  const abandonado = isCarrinhoAbandonado(
                    carrinho.ultimo_update
                  );

                  return (
                    <TableRow key={carrinho.user_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{carrinho.user_nome}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {carrinho.user_email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {carrinho.total_produtos} produtos
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {carrinho.total_itens}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        R$ {carrinho.valor_total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(carrinho.ultimo_update).toLocaleString(
                              "pt-BR"
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {abandonado ? (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-300"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Abandonado
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-300"
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(carrinho)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(carrinho)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredCarrinhos.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      Nenhum carrinho encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tentativas Suspeitas */}
        {tentativasSuspeitas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Tentativas Suspeitas Recentes</span>
              </CardTitle>
              <CardDescription>
                Últimas 100 tentativas de manipulação detectadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tentativasSuspeitas.slice(0, 10).map((tentativa) => (
                  <div
                    key={tentativa.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-sm">
                          {tentativa.tipo_tentativa}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        User ID: {tentativa.user_id.substring(0, 8)}...
                        {tentativa.diferenca_preco &&
                          ` | Diferença preço: R$ ${tentativa.diferenca_preco.toFixed(
                            2
                          )}`}
                        {tentativa.diferenca_quantidade &&
                          ` | Dif. qtd: ${tentativa.diferenca_quantidade}`}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(tentativa.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog Detalhes */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Carrinho</DialogTitle>
              <DialogDescription>
                {selectedCarrinho && (
                  <div className="space-y-2 mt-2">
                    <p>
                      <strong>Cliente:</strong> {selectedCarrinho.user_nome}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedCarrinho.user_email}
                    </p>
                    <p>
                      <strong>Total de produtos:</strong>{" "}
                      {selectedCarrinho.total_produtos}
                    </p>
                    <p>
                      <strong>Total de itens:</strong>{" "}
                      {selectedCarrinho.total_itens}
                    </p>
                    <p>
                      <strong>Valor total:</strong> R${" "}
                      {selectedCarrinho.valor_total.toFixed(2)}
                    </p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedCarrinho && (
              <div className="mt-4">
                <h3 className="font-semibold mb-3">Itens do Carrinho:</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Estoque</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCarrinho.itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <img
                              src={
                                item.produtos?.imagem_url || "/placeholder.svg"
                              }
                              alt={item.produtos?.nome}
                              className="w-10 h-10 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium text-sm">
                                {item.produtos?.nome}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.produtos?.codigo_produto || "Sem código"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {item.quantidade}
                        </TableCell>
                        <TableCell>
                          R$ {item.preco_unitario.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          R${" "}
                          {(item.quantidade * item.preco_unitario).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              (item.produtos?.quantidade_estoque || 0) >=
                              item.quantidade
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {item.produtos?.quantidade_estoque || 0}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Delete */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o carrinho de{" "}
                <strong>{carrinhoToDelete?.user_nome}</strong>? Esta ação não
                pode ser desfeita.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? "Excluindo..." : "Excluir Carrinho"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
