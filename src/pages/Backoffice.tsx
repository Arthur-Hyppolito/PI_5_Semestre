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
import { useToast } from "../hooks/use-toast";
import {
  Waves,
  Users,
  Package,
  BarChart3,
  DollarSign,
  LogOut,
  User as UserIcon,
  Archive,
  Building2,
  ShoppingCart,
  Shield,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface KPIs {
  totalProdutos: number;
  totalEstoque: number;
  totalFaturamento: number;
  totalUsuarios: number;
  crescimentoProdutos: number;
  crescimentoFaturamento: number;
}

export default function Backoffice() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [kpis, setKpis] = useState<KPIs>({
    totalProdutos: 0,
    totalEstoque: 0,
    totalFaturamento: 0,
    totalUsuarios: 0,
    crescimentoProdutos: 0,
    crescimentoFaturamento: 0,
  });
  const [loadingKPIs, setLoadingKPIs] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    loadKPIs();
  }, [navigate]);

  const checkUser = async () => {
    try {
      const { user, error } = await auth.getCurrentUser();

      if (error || !user) {
        navigate("/login");
        return;
      }

      setUser(user);
    } catch (error) {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadKPIs = async () => {
    try {
      setLoadingKPIs(true);

      // 1. Total de Produtos Ativos
      const { count: totalProdutos } = await supabase
        .from("produtos")
        .select("*", { count: "exact", head: true })
        .eq("status", true);

      // 2. Total de Itens em Estoque (soma de quantidade_estoque)
      const { data: estoqueData } = await supabase
        .from("produtos")
        .select("quantidade_estoque")
        .eq("status", true);

      const totalEstoque =
        estoqueData?.reduce((sum, p) => sum + (p.quantidade_estoque || 0), 0) ||
        0;

      // 3. Total de Usuários/Clientes
      const { count: totalUsuarios } = await supabase
        .from("clientes")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true);

      // 4. Faturamento Total (soma de pedidos pagos)
      const { data: pedidosData } = await supabase
        .from("pedidos")
        .select("total")
        .not("data_pagamento", "is", null); // Apenas pedidos pagos

      const totalFaturamento =
        pedidosData?.reduce(
          (sum, p) => sum + (parseFloat(p.total as any) || 0),
          0
        ) || 0;

      // 5. Crescimento de Produtos (últimos 30 dias vs mês anterior)
      const hoje = new Date();
      const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const inicioMesAnterior = new Date(
        hoje.getFullYear(),
        hoje.getMonth() - 1,
        1
      );
      const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

      const { count: produtosMesAtual } = await supabase
        .from("produtos")
        .select("*", { count: "exact", head: true })
        .gte("created_at", inicioMesAtual.toISOString());

      const { count: produtosMesAnterior } = await supabase
        .from("produtos")
        .select("*", { count: "exact", head: true })
        .gte("created_at", inicioMesAnterior.toISOString())
        .lte("created_at", fimMesAnterior.toISOString());

      const crescimentoProdutos =
        produtosMesAnterior && produtosMesAnterior > 0
          ? (((produtosMesAtual || 0) - produtosMesAnterior) /
              produtosMesAnterior) *
            100
          : 0;

      // 6. Crescimento de Faturamento (mês atual vs mês anterior)
      const { data: faturamentoMesAtual } = await supabase
        .from("pedidos")
        .select("total")
        .not("data_pagamento", "is", null)
        .gte("data_pagamento", inicioMesAtual.toISOString());

      const { data: faturamentoMesAnterior } = await supabase
        .from("pedidos")
        .select("total")
        .not("data_pagamento", "is", null)
        .gte("data_pagamento", inicioMesAnterior.toISOString())
        .lte("data_pagamento", fimMesAnterior.toISOString());

      const valorMesAtual =
        faturamentoMesAtual?.reduce(
          (sum, p) => sum + (parseFloat(p.total as any) || 0),
          0
        ) || 0;
      const valorMesAnterior =
        faturamentoMesAnterior?.reduce(
          (sum, p) => sum + (parseFloat(p.total as any) || 0),
          0
        ) || 0;

      const crescimentoFaturamento =
        valorMesAnterior > 0
          ? ((valorMesAtual - valorMesAnterior) / valorMesAnterior) * 100
          : 0;

      setKpis({
        totalProdutos: totalProdutos || 0,
        totalEstoque,
        totalFaturamento,
        totalUsuarios: totalUsuarios || 0,
        crescimentoProdutos,
        crescimentoFaturamento,
      });
    } catch (error) {
      console.error("Erro ao carregar KPIs:", error);
      toast({
        title: "Erro ao carregar estatísticas",
        description: "Não foi possível carregar os dados do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoadingKPIs(false);
    }
  };

  // Nova função de logout robusta para Backoffice
  const handleLogout = async () => {
    if (isLoggingOut) return; // Previne múltiplos cliques

    setIsLoggingOut(true);

    try {
      // Usar a nova função de logout
      const result = await auth.performLogout();

      if (result.success) {
        // Limpar estados locais
        setUser(null);

        // Mostrar mensagem de sucesso
        toast({
          title: "Logout realizado",
          description: result.message,
          variant: "default",
        });

        // Redirecionar para login
        navigate("/login", { replace: true });

        // Forçar reload da página para garantir limpeza completa
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
      } else {
        // Mostrar erro
        toast({
          title: "Erro no logout",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro crítico no logout:", error);
      toast({
        title: "Erro crítico",
        description: "Falha crítica no logout. Redirecionando...",
        variant: "destructive",
      });

      // Em caso de erro crítico, forçar redirecionamento
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } finally {
      setIsLoggingOut(false);
    }
  };

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
              <Waves className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                WaveSurf Backoffice
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <UserIcon className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>{isLoggingOut ? "Saindo..." : "Sair"}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bem-vindo ao Painel Administrativo
          </h2>
          <p className="text-gray-600">
            Gerencie sua loja de surf com facilidade e eficiência.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingKPIs ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{kpis.totalProdutos}</div>
                  <p
                    className={`text-xs ${
                      kpis.crescimentoProdutos >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {kpis.crescimentoProdutos >= 0 ? "+" : ""}
                    {kpis.crescimentoProdutos.toFixed(1)}% em relação ao mês
                    passado
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingKPIs ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {kpis.totalEstoque.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    itens em estoque
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingKPIs ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    R${" "}
                    {kpis.totalFaturamento.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p
                    className={`text-xs ${
                      kpis.crescimentoFaturamento >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {kpis.crescimentoFaturamento >= 0 ? "+" : ""}
                    {kpis.crescimentoFaturamento.toFixed(1)}% em relação ao mês
                    passado
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingKPIs ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{kpis.totalUsuarios}</div>
                  <p className="text-xs text-muted-foreground">
                    usuários cadastrados
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Módulos Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-6 w-6 text-blue-600" />
                <span>Gerenciar Produtos</span>
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova produtos do catálogo. Gerencie
                categorias, preços e descrições.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate("/backoffice/produtos")}
              >
                Acessar Produtos
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Archive className="h-6 w-6 text-green-600" />
                <span>Gerenciar Estoque</span>
              </CardTitle>
              <CardDescription>
                Controle de entrada e saída de produtos. Monitore níveis de
                estoque e alertas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate("/backoffice/estoque")}
              >
                Acessar Estoque
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-6 w-6 text-orange-600" />
                <span>Gerenciar Fornecedores</span>
              </CardTitle>
              <CardDescription>
                Cadastro e controle de fornecedores. Gerencie contatos e
                informações comerciais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate("/backoffice/fornecedores")}
              >
                Acessar Fornecedores
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-purple-600" />
                <span>Financeiro</span>
              </CardTitle>
              <CardDescription>
                Relatórios financeiros, vendas, receitas e análise de
                performance da loja.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                Acessar Financeiro
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-orange-600" />
                <span>Gerenciar Usuários</span>
              </CardTitle>
              <CardDescription>
                Gerencie usuários do sistema, permissões e controle de acesso ao
                backoffice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate("/backoffice/usuarios")}
              >
                Acessar Usuários
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
                <span>Gerenciar Carrinhos</span>
              </CardTitle>
              <CardDescription>
                Visualize e gerencie carrinhos de compras ativos. Monitore
                abandonos e tentativas suspeitas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate("/backoffice/carrinhos")}
              >
                Acessar Carrinhos
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-indigo-600" />
                <span>Auditoria do Sistema</span>
              </CardTitle>
              <CardDescription>
                Visualize logs de auditoria, erros, tentativas suspeitas e
                sessões do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate("/backoffice/auditoria")}
              >
                Acessar Auditoria
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Ações Secundárias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                <span>Relatórios Gerais</span>
              </CardTitle>
              <CardDescription>
                Visualize relatórios consolidados e métricas de performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Ver Relatórios
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Waves className="h-5 w-5 text-blue-500" />
                <span>Ver Site</span>
              </CardTitle>
              <CardDescription>
                Visualize como está o site para os clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => window.open("/", "_blank")}
              >
                Abrir Site
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
