import { useState, useEffect } from 'react'
import { auth, supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { useToast } from '../hooks/use-toast'
import { 
  Waves, 
  ArrowLeft, 
  Plus, 
  Minus,
  Search,
  Archive,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  History,
  Filter
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  Badge,
} from '../components/ui/badge'

interface Produto {
  id: string
  nome: string
  descricao: string
  preco: number
  quantidade: number
  categoria: string
  imagem_url?: string
  created_at: string
}

interface MovimentacaoEstoque {
  id: string
  produto_id: string
  produto_nome: string
  tipo: 'entrada' | 'saida'
  quantidade: number
  motivo: string
  observacoes?: string
  usuario: string
  created_at: string
}

export default function GerenciarEstoque() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('todas')
  const [filterEstoque, setFilterEstoque] = useState('todos')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null)
  const [movimentacaoData, setMovimentacaoData] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    quantidade: '',
    motivo: '',
    observacoes: ''
  })
  const [showAllMovements, setShowAllMovements] = useState(false)
  const [allMovements, setAllMovements] = useState<MovimentacaoEstoque[]>([])
  const [loadingAllMovements, setLoadingAllMovements] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    checkUser()
    loadProdutos()
    loadMovimentacoes()
    
    // Configurar realtime subscription para movimentações
    const movimentacoesChannel = supabase
      .channel('movimentacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'movimentacoes_estoque'
        },
        (payload) => {
          console.log('Nova movimentação registrada:', payload)
          // Recarregar movimentações quando houver nova inserção
          loadMovimentacoes()
          // Se o modal estiver aberto, recarregar todas as movimentações também
          if (showAllMovements) {
            loadAllMovimentacoes()
          }
        }
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      supabase.removeChannel(movimentacoesChannel)
    }
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

  const loadProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar produtos:', error)
        // Dados mock para demonstração
        setProdutos([
          {
            id: '1',
            nome: 'Prancha de Surf Pro',
            descricao: 'Prancha profissional para surfistas experientes',
            preco: 1299.99,
            quantidade: 15,
            categoria: 'Pranchas',
            imagem_url: '/placeholder.svg',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            nome: 'Wetsuit Premium',
            descricao: 'Wetsuit de alta qualidade para águas frias',
            preco: 599.99,
            quantidade: 3,
            categoria: 'Wetsuits',
            imagem_url: '/placeholder.svg',
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            nome: 'Leash Surf Premium',
            descricao: 'Leash resistente para pranchas de surf',
            preco: 89.99,
            quantidade: 0,
            categoria: 'Acessórios',
            imagem_url: '/placeholder.svg',
            created_at: new Date().toISOString()
          }
        ])
      } else {
        setProdutos(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setProdutos([])
    }
  }

  const loadMovimentacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Erro ao carregar movimentações:', error)
        // Se não conseguir carregar do Supabase, manter movimentações existentes ou usar mock apenas se estiver vazio
        if (movimentacoes.length === 0) {
          setMovimentacoes([
            {
              id: '1',
              produto_id: '1',
              produto_nome: 'Prancha de Surf Pro',
              tipo: 'entrada',
              quantidade: 10,
              motivo: 'Compra de fornecedor',
              observacoes: 'Lote 2024-001',
              usuario: user?.email || 'admin@wavesurf.com',
              created_at: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: '2',
              produto_id: '2',
              produto_nome: 'Wetsuit Premium',
              tipo: 'saida',
              quantidade: 2,
              motivo: 'Venda',
              observacoes: 'Pedido #1234',
              usuario: user?.email || 'admin@wavesurf.com',
              created_at: new Date(Date.now() - 172800000).toISOString()
            }
          ])
        }
      } else {
        setMovimentacoes(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error)
      setMovimentacoes([])
    }
  }

  const loadAllMovimentacoes = async () => {
    setLoadingAllMovements(true)
    try {
      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500) // Limite maior para histórico completo

      if (error) {
        console.error('Erro ao carregar todas as movimentações:', error)
        // Se não conseguir carregar do Supabase, usar movimentações existentes ou mock apenas se estiver vazio
        if (allMovements.length === 0) {
          const mockMovements = [
            {
              id: '1',
              produto_id: '1',
              produto_nome: 'Prancha de Surf Pro',
              tipo: 'entrada' as 'entrada',
              quantidade: 10,
              motivo: 'Compra de fornecedor',
              observacoes: 'Lote 2024-001',
              usuario: user?.email || 'admin@wavesurf.com',
              created_at: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: '2',
              produto_id: '2',
              produto_nome: 'Wetsuit Premium',
              tipo: 'saida' as 'saida',
              quantidade: 2,
              motivo: 'Venda',
              observacoes: 'Pedido #1234',
              usuario: user?.email || 'admin@wavesurf.com',
              created_at: new Date(Date.now() - 172800000).toISOString()
            },
            {
              id: '3',
              produto_id: '1',
              produto_nome: 'Prancha de Surf Pro',
              tipo: 'saida' as 'saida',
              quantidade: 1,
              motivo: 'Venda',
              observacoes: 'Venda online',
              usuario: user?.email || 'admin@wavesurf.com',
              created_at: new Date(Date.now() - 259200000).toISOString()
            },
            {
              id: '4',
              produto_id: '3',
              produto_nome: 'Leash Surf Premium',
              tipo: 'entrada' as 'entrada',
              quantidade: 25,
              motivo: 'Compra de fornecedor',
              observacoes: 'Reestoque mensal',
              usuario: user?.email || 'admin@wavesurf.com',
              created_at: new Date(Date.now() - 345600000).toISOString()
            },
            {
              id: '5',
              produto_id: '2',
              produto_nome: 'Wetsuit Premium',
              tipo: 'entrada' as 'entrada',
              quantidade: 5,
              motivo: 'Devolução de cliente',
              observacoes: 'Produto sem uso',
              usuario: user?.email || 'admin@wavesurf.com',
              created_at: new Date(Date.now() - 432000000).toISOString()
            }
          ]
          setAllMovements(mockMovements)
        }
      } else {
        setAllMovements(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar todas as movimentações:', error)
      setAllMovements([])
    } finally {
      setLoadingAllMovements(false)
    }
  }

  const handleMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProduct) return

    const quantidade = parseInt(movimentacaoData.quantidade)
    if (quantidade <= 0) {
      toast({
        title: "Erro",
        description: "A quantidade deve ser maior que zero.",
        variant: "destructive",
      })
      return
    }

    // Verificar se há estoque suficiente para saída
    if (movimentacaoData.tipo === 'saida' && quantidade > selectedProduct.quantidade) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${selectedProduct.quantidade} unidades disponíveis.`,
        variant: "destructive",
      })
      return
    }

    try {
      // Calcular nova quantidade
      const novaQuantidade = movimentacaoData.tipo === 'entrada' 
        ? selectedProduct.quantidade + quantidade
        : selectedProduct.quantidade - quantidade

      // Atualizar produto
      const { error: produtoError } = await supabase
        .from('produtos')
        .update({ quantidade: novaQuantidade })
        .eq('id', selectedProduct.id)

      if (produtoError) {
        // Simular atualização se a tabela não existir
        setProdutos(prev => prev.map(p => 
          p.id === selectedProduct.id 
            ? { ...p, quantidade: novaQuantidade }
            : p
        ))
      }

      // Registrar movimentação
      const movimentacao = {
        produto_id: selectedProduct.id,
        produto_nome: selectedProduct.nome,
        tipo: movimentacaoData.tipo,
        quantidade: quantidade,
        motivo: movimentacaoData.motivo,
        observacoes: movimentacaoData.observacoes,
        usuario: user?.email || 'admin@wavesurf.com'
      }

      const { error: movError } = await supabase
        .from('movimentacoes_estoque')
        .insert([movimentacao])

      if (movError) {
        // Simular inserção se a tabela não existir
        const novaMovimentacao: MovimentacaoEstoque = {
          id: Date.now().toString(),
          ...movimentacao,
          created_at: new Date().toISOString()
        }
        setMovimentacoes(prev => [novaMovimentacao, ...prev.slice(0, 4)])
        setAllMovements(prev => [novaMovimentacao, ...prev])
      }

      toast({
        title: "Movimentação registrada!",
        description: `${movimentacaoData.tipo === 'entrada' ? 'Entrada' : 'Saída'} de ${quantidade} unidades registrada com sucesso.`,
      })

      // Reset form
      setMovimentacaoData({
        tipo: 'entrada',
        quantidade: '',
        motivo: '',
        observacoes: ''
      })
      setSelectedProduct(null)
      setIsDialogOpen(false)
      
      // Recarregar dados
      setTimeout(() => {
        loadProdutos()
        loadMovimentacoes()
      }, 500)
      
      // Notificar outros componentes sobre a mudança no estoque
      window.dispatchEvent(new CustomEvent('estoqueAtualizado', {
        detail: { 
          produtoId: selectedProduct.id, 
          produtoNome: selectedProduct.nome,
          tipo: movimentacaoData.tipo,
          quantidade: quantidade,
          novaQuantidade: novaQuantidade
        }
      }))

    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar a movimentação.",
        variant: "destructive",
      })
    }
  }

  const getStatusEstoque = (quantidade: number) => {
    if (quantidade === 0) {
      return { label: 'Esgotado', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    } else if (quantidade <= 5) {
      return { label: 'Baixo', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    } else if (quantidade <= 10) {
      return { label: 'Médio', color: 'bg-blue-100 text-blue-800', icon: Package }
    } else {
      return { label: 'Alto', color: 'bg-green-100 text-green-800', icon: Package }
    }
  }

  const categorias = [...new Set(produtos.map(p => p.categoria))]

  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategoria = filterCategoria === 'todas' || produto.categoria === filterCategoria
    
    const matchesEstoque = filterEstoque === 'todos' ||
                          (filterEstoque === 'esgotado' && produto.quantidade === 0) ||
                          (filterEstoque === 'baixo' && produto.quantidade > 0 && produto.quantidade <= 5) ||
                          (filterEstoque === 'normal' && produto.quantidade > 5)
    
    return matchesSearch && matchesCategoria && matchesEstoque
  })

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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/backoffice')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <Archive className="h-8 w-8 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Gerenciar Estoque</h1>
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
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{produtos.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {produtos.reduce((total, produto) => total + produto.quantidade, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos Esgotados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {produtos.filter(p => p.quantidade === 0).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {produtos.filter(p => p.quantidade > 0 && p.quantidade <= 5).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.map(categoria => (
                  <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterEstoque} onValueChange={setFilterEstoque}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status do estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="esgotado">Esgotado</SelectItem>
                <SelectItem value="baixo">Estoque baixo</SelectItem>
                <SelectItem value="normal">Estoque normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Produtos em Estoque</CardTitle>
                <CardDescription>
                  {filteredProdutos.length} produto(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProdutos.map((produto) => {
                      const status = getStatusEstoque(produto.quantidade)
                      const StatusIcon = status.icon
                      
                      return (
                        <TableRow key={produto.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <img 
                                src={produto.imagem_url || '/placeholder.svg'} 
                                alt={produto.nome}
                                className="w-10 h-10 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg'
                                }}
                              />
                              <div>
                                <div className="font-medium">{produto.nome}</div>
                                <div className="text-sm text-gray-500">R$ {produto.preco.toFixed(2)}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{produto.categoria}</TableCell>
                          <TableCell>
                            <span className="text-lg font-semibold">{produto.quantidade}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedProduct(produto)
                                  setMovimentacaoData(prev => ({ ...prev, tipo: 'entrada' }))
                                  setIsDialogOpen(true)
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedProduct(produto)
                                  setMovimentacaoData(prev => ({ ...prev, tipo: 'saida' }))
                                  setIsDialogOpen(true)
                                }}
                                className="text-red-600 hover:text-red-700"
                                disabled={produto.quantidade === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredProdutos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Nenhum produto encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Recent Movements */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <History className="h-5 w-5" />
                    <span>Movimentações Recentes</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAllMovements(true)
                      if (allMovements.length === 0) {
                        loadAllMovimentacoes()
                      }
                    }}
                    className="text-xs"
                  >
                    Ver Todas
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {movimentacoes.map((mov) => (
                    <div key={mov.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full ${
                        mov.tipo === 'entrada' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {mov.tipo === 'entrada' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{mov.produto_nome}</div>
                        <div className="text-xs text-gray-500">
                          {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade} • {mov.motivo}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(mov.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {movimentacoes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma movimentação registrada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All Movements Dialog */}
        <Dialog open={showAllMovements} onOpenChange={setShowAllMovements}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Histórico Completo de Movimentações</span>
              </DialogTitle>
              <DialogDescription>
                Todas as movimentações de estoque registradas no sistema
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto max-h-96">
              {loadingAllMovements ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Carregando movimentações...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allMovements.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="text-sm">
                          {new Date(mov.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium">{mov.produto_nome}</TableCell>
                        <TableCell>
                          <Badge className={`${
                            mov.tipo === 'entrada' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <div className="flex items-center space-x-1">
                              {mov.tipo === 'entrada' ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              <span className="capitalize">{mov.tipo}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{mov.motivo}</TableCell>
                        <TableCell className="text-sm text-gray-600">{mov.usuario}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {mov.observacoes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {allMovements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Nenhuma movimentação encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowAllMovements(false)}
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Movement Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {movimentacaoData.tipo === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque'}
              </DialogTitle>
              <DialogDescription>
                {selectedProduct && (
                  <>
                    Produto: <strong>{selectedProduct.nome}</strong><br />
                    Estoque atual: <strong>{selectedProduct.quantidade} unidades</strong>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleMovimentacao} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={movimentacaoData.quantidade}
                  onChange={(e) => setMovimentacaoData({...movimentacaoData, quantidade: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo *</Label>
                <Select 
                  value={movimentacaoData.motivo} 
                  onValueChange={(value) => setMovimentacaoData({...movimentacaoData, motivo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {movimentacaoData.tipo === 'entrada' ? (
                      <>
                        <SelectItem value="Compra de fornecedor">Compra de fornecedor</SelectItem>
                        <SelectItem value="Devolução de cliente">Devolução de cliente</SelectItem>
                        <SelectItem value="Ajuste de inventário">Ajuste de inventário</SelectItem>
                        <SelectItem value="Transferência">Transferência</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Venda">Venda</SelectItem>
                        <SelectItem value="Devolução ao fornecedor">Devolução ao fornecedor</SelectItem>
                        <SelectItem value="Produto danificado">Produto danificado</SelectItem>
                        <SelectItem value="Ajuste de inventário">Ajuste de inventário</SelectItem>
                        <SelectItem value="Transferência">Transferência</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={movimentacaoData.observacoes}
                  onChange={(e) => setMovimentacaoData({...movimentacaoData, observacoes: e.target.value})}
                  rows={3}
                  placeholder="Informações adicionais..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className={movimentacaoData.tipo === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {movimentacaoData.tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
