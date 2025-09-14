import { useState, useEffect } from 'react'
import { auth } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useToast } from '../hooks/use-toast'
import { Waves, Users, Package, BarChart3, DollarSign, LogOut, User, Archive } from 'lucide-react'

export default function Backoffice() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { user, error } = await auth.getCurrentUser()
      
      if (error || !user) {
        navigate('/login')
        return
      }
      
      setUser(user)
    } catch (error) {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

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
        navigate('/login', { replace: true });
        
        // Forçar reload da página para garantir limpeza completa
        setTimeout(() => {
          window.location.href = '/login';
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
      console.error('Erro crítico no logout:', error);
      toast({
        title: "Erro crítico",
        description: "Falha crítica no logout. Redirecionando...",
        variant: "destructive",
      });
      
      // Em caso de erro crítico, forçar redirecionamento
      setTimeout(() => {
        window.location.href = '/login';
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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Waves className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">WaveSurf Backoffice</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
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
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                +12% em relação ao mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground">
                itens em estoque
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 45.231</div>
              <p className="text-xs text-muted-foreground">
                +23% em relação ao mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">
                usuários cadastrados
              </p>
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
                Adicione, edite ou remova produtos do catálogo. Gerencie categorias, preços e descrições.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => navigate('/backoffice/produtos')}
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
                Controle de entrada e saída de produtos. Monitore níveis de estoque e alertas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => navigate('/backoffice/estoque')}
              >
                Acessar Estoque
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
                Relatórios financeiros, vendas, receitas e análise de performance da loja.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">Acessar Financeiro</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-orange-600" />
                <span>Gerenciar Usuários</span>
              </CardTitle>
              <CardDescription>
                Gerencie usuários do sistema, permissões e controle de acesso ao backoffice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">Acessar Usuários</Button>
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
              <Button className="w-full" variant="outline">Ver Relatórios</Button>
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
                onClick={() => window.open('/', '_blank')}
              >
                Abrir Site
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
