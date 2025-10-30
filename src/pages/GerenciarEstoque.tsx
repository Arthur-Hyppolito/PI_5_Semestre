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

// Interfaces auxiliares para relacionamentos
interface Categoria {
  id: string
  nome: string
}

interface Cor {
  id: string
  nome: string
}

interface Unidade {
  id: string
  nome: string
  sigla: string
}

interface Fornecedor {
  id: string
  nome: string
  cnpj?: string
  telefone?: string
  email?: string
}

interface User {
  id: string
  email: string
  tipo_usuario: 'cliente' | 'admin'
  nome: string
  sobrenome: string
}

// Enum para tipo de movimentação (corresponde ao enum do banco)
enum TipoMovimentacao {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA'
}

// Interface Produto corrigida com TODOS os 21 campos do banco
interface Produto {
  id: string
  nome: string
  descricao?: string
  preco_unitario: number
  quantidade_estoque: number
  status?: boolean
  categoria_id?: string
  imagem_url?: string
  created_at: string
  updated_at?: string
  cor_id?: string
  unidade_id?: string
  produto_simples?: boolean
  qtd_entrada_total?: number
  qtd_saida_total?: number
  qtd_original?: number
  data_ultima_entrada?: string
  hora_ultima_entrada?: string
  data_ultima_saida?: string
  hora_ultima_saida?: string
  codigo_produto?: string
  // Relacionamentos (quando usar JOINs)
  categorias?: Categoria
  cores?: Cor
  unidades?: Unidade
}

// Interface MovimentacaoEstoque corrigida com campos corretos do banco
interface MovimentacaoEstoque {
  id: string
  produto_id: string
  tipo_movimentacao: TipoMovimentacao
  quantidade: number
  data_movimentacao?: string
  fornecedor_id?: string
  nota_fiscal?: string
  valor_unitario: number
  user_id?: string
  created_at: string
  // Relacionamentos (quando usar JOINs)
  produtos?: Produto
  fornecedores?: Fornecedor
}

export default function GerenciarEstoque() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingProdutos, setLoadingProdutos] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('todas')
  const [filterEstoque, setFilterEstoque] = useState('todos')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null)
  const [movimentacaoData, setMovimentacaoData] = useState({
    tipo_movimentacao: TipoMovimentacao.ENTRADA,
    quantidade: '',
    fornecedor_id: '',
    nota_fiscal: '',
    valor_unitario: ''
  })
  const [showAllMovements, setShowAllMovements] = useState(false)
  const [allMovements, setAllMovements] = useState<MovimentacaoEstoque[]>([])
  const [loadingAllMovements, setLoadingAllMovements] = useState(false)
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const init = async () => {
      try {
        await checkUser()
        await loadProdutos()
        await loadMovimentacoes()
        await loadFornecedores()
      } catch (error) {
        console.error('Erro ao inicializar:', error)
        toast({
          title: "Erro",
          description: "Falha ao carregar dados iniciais.",
          variant: "destructive",
        })
      }
    }
    
    init()
    
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
          // Recarregar movimentações e produtos quando houver nova inserção
          loadMovimentacoes()
          loadProdutos()
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
      const { user: authUser, error } = await auth.getCurrentUser()
      
      if (error || !authUser) {
        navigate('/login')
        return
      }
      
      // Buscar dados completos do usuário na tabela clientes
      const { data: userData, error: userError } = await supabase
        .from('clientes')
        .select('id, email, tipo_usuario, nome, sobrenome')
        .eq('auth_user_id', authUser.id)
        .single()
      
      if (userError || !userData) {
        console.error('Erro ao buscar dados do usuário:', userError)
        navigate('/login')
        return
      }
      
      setUser(userData as User)
    } catch (error) {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadProdutos = async () => {
    try {
      setLoadingProdutos(true)
      
      // ✅ Query com JOINs para trazer relacionamentos
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          categorias (id, nome),
          cores (id, nome),
          unidades (id, nome, sigla)
        `)
        .eq('status', true)
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar produtos:', error)
        // ❌ Removido dados mock
        setProdutos([])
      } else {
        setProdutos(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setProdutos([])
    } finally {
      setLoadingProdutos(false)
    }
  }

  const loadFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome, cnpj, telefone, email')
        .eq('ativo', true)
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar fornecedores:', error)
        setFornecedores([])
      } else {
        setFornecedores(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
      setFornecedores([])
    }
  }

  const loadMovimentacoes = async () => {
    try {
      // ✅ Query com JOINs para trazer nome do produto e fornecedor
      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .select(`
          *,
          produtos (id, nome, codigo_produto),
          fornecedores (id, nome)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Erro ao carregar movimentações:', error)
        // Se não conseguir carregar do Supabase, manter movimentações existentes ou usar mock apenas se estiver vazio
        if (movimentacoes.length === 0) {
          // ❌ Removido dados mock - usar apenas dados reais do banco
          setMovimentacoes([])
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
      // ✅ Query com JOINs para histórico completo
      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .select(`
          *,
          produtos (id, nome, codigo_produto),
          fornecedores (id, nome)
        `)
        .order('created_at', { ascending: false })
        .limit(500) // Limite maior para histórico completo

      if (error) {
        console.error('Erro ao carregar todas as movimentações:', error)
        setAllMovements([])
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

  const loadAllMovimentacoesOLD = async () => {
    setLoadingAllMovements(true)
    try {
      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) {
        console.error('Erro ao carregar todas as movimentações:', error)
        // ❌ Removido dados mock
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
          // ❌ Removido dados mock - usar apenas dados reais do banco
          setAllMovements([])
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
    if (movimentacaoData.tipo_movimentacao === TipoMovimentacao.SAIDA && quantidade > selectedProduct.quantidade_estoque) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${selectedProduct.quantidade_estoque} unidades disponíveis.`,
        variant: "destructive",
      })
      return
    }

    try {
      // ✅ Validar user_id antes de inserir
      if (!user || !user.id) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado.",
          variant: "destructive",
        })
        return
      }

      // ✅ IMPORTANTE: NÃO atualizar estoque manualmente!
      // O banco tem um trigger (trigger_atualizar_estoque) que atualiza
      // automaticamente o campo quantidade_estoque quando inserimos uma movimentação

      // ✅ Registrar movimentação com campos corretos do banco
      const movimentacao = {
        produto_id: selectedProduct.id,
        tipo_movimentacao: movimentacaoData.tipo_movimentacao,
        quantidade: quantidade,
        valor_unitario: parseFloat(movimentacaoData.valor_unitario) || selectedProduct.preco_unitario,
        fornecedor_id: movimentacaoData.fornecedor_id || null,
        nota_fiscal: movimentacaoData.nota_fiscal || null,
        user_id: user.id
      }

      const { error: movError } = await supabase
        .from('movimentacoes_estoque')
        .insert([movimentacao])

      if (movError) {
        console.error('Erro ao registrar movimentação:', movError)
        toast({
          title: "Erro ao registrar movimentação",
          description: movError.message || "Não foi possível registrar a movimentação.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Movimentação registrada!",
        description: `${movimentacaoData.tipo_movimentacao === TipoMovimentacao.ENTRADA ? 'Entrada' : 'Saída'} de ${quantidade} unidades registrada com sucesso.`,
      })

      // ✅ Recarregar produtos para ver estoque atualizado pelo trigger
      await loadProdutos()
      await loadMovimentacoes()

      // Reset form
      setMovimentacaoData({
        tipo_movimentacao: TipoMovimentacao.ENTRADA,
        quantidade: '',
        fornecedor_id: '',
        nota_fiscal: '',
        valor_unitario: ''
      })
      setSelectedProduct(null)
      setIsDialogOpen(false)
      
      // ✅ Notificar outros componentes sobre a mudança no estoque
      // (Estoque será atualizado pelo trigger do banco)
      window.dispatchEvent(new CustomEvent('estoqueAtualizado', {
        detail: { 
          produtoId: selectedProduct.id, 
          produtoNome: selectedProduct.nome,
          tipo_movimentacao: movimentacaoData.tipo_movimentacao,
          quantidade: quantidade
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

  const getStatusEstoque = (quantidade_estoque: number) => {
    if (quantidade_estoque === 0) {
      return { label: 'Esgotado', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    } else if (quantidade_estoque <= 5) {
      return { label: 'Baixo', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    } else if (quantidade_estoque <= 10) {
      return { label: 'Médio', color: 'bg-blue-100 text-blue-800', icon: Package }
    } else {
      return { label: 'Alto', color: 'bg-green-100 text-green-800', icon: Package }
    }
  }

  const categorias = [...new Set(produtos.map(p => p.categorias?.nome).filter(Boolean))]

  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (produto.categorias?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategoria = filterCategoria === 'todas' || produto.categorias?.nome === filterCategoria
    
    const matchesEstoque = filterEstoque === 'todos' ||
                          (filterEstoque === 'esgotado' && produto.quantidade_estoque === 0) ||
                          (filterEstoque === 'baixo' && produto.quantidade_estoque > 0 && produto.quantidade_estoque <= 5) ||
                          (filterEstoque === 'normal' && produto.quantidade_estoque > 5)
    
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
                {produtos.reduce((total, produto) => total + produto.quantidade_estoque, 0)}
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
                {produtos.filter(p => p.quantidade_estoque === 0).length}
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
                {produtos.filter(p => p.quantidade_estoque > 0 && p.quantidade_estoque <= 5).length}
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
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Código</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-[100px]">Categoria</TableHead>
                        <TableHead className="w-[140px]">Quantidade</TableHead>
                        <TableHead className="w-[90px]">Status</TableHead>
                        <TableHead className="w-[140px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProdutos.map((produto) => {
                        const status = getStatusEstoque(produto.quantidade_estoque)
                        const StatusIcon = status.icon
                        const codigoCurto = produto.codigo_produto || produto.id.substring(0, 8)
                        
                        return (
                          <TableRow key={produto.id} className="hover:bg-gray-50">
                            <TableCell className="align-top px-3 py-3">
                              <div className="font-mono text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded inline-block">
                                #{codigoCurto}
                              </div>
                            </TableCell>
                            <TableCell className="align-top px-3 py-3">
                              <div className="flex items-start space-x-2">
                                <img 
                                  src={produto.imagem_url || '/placeholder.svg'} 
                                  alt={produto.nome}
                                  className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.svg'
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm text-gray-900 truncate">{produto.nome}</div>
                                  <div className="text-xs text-green-600 font-semibold mt-0.5">
                                    R$ {produto.preco_unitario.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top px-3 py-3">
                              <span className="text-xs text-gray-700">{produto.categorias?.nome || '-'}</span>
                            </TableCell>
                            <TableCell className="align-top px-3 py-3">
                              <div className="space-y-1.5">
                                <div className="flex items-baseline space-x-1">
                                  <span className="text-xl font-bold text-gray-900">{produto.quantidade_estoque}</span>
                                  {produto.unidades?.sigla && (
                                    <span className="text-xs text-gray-500">{produto.unidades.sigla}</span>
                                  )}
                                </div>
                                {(produto.qtd_entrada_total !== undefined || produto.qtd_saida_total !== undefined) && (
                                  <div className="flex items-center space-x-2 text-xs">
                                    <div className="flex items-center space-x-0.5 text-green-600">
                                      <TrendingUp className="h-3 w-3" />
                                      <span className="font-medium">{produto.qtd_entrada_total || 0}</span>
                                    </div>
                                    <div className="flex items-center space-x-0.5 text-red-600">
                                      <TrendingDown className="h-3 w-3" />
                                      <span className="font-medium">{produto.qtd_saida_total || 0}</span>
                                    </div>
                                  </div>
                                )}
                                {(produto.data_ultima_entrada || produto.data_ultima_saida) && (
                                  <div className="text-xs text-gray-500 space-y-0.5 pt-1 border-t border-gray-200">
                                    {produto.data_ultima_entrada && (
                                      <div className="flex items-center space-x-0.5">
                                        <span className="text-green-600">↑</span>
                                        <span className="truncate">{new Date(produto.data_ultima_entrada).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                      </div>
                                    )}
                                    {produto.data_ultima_saida && (
                                      <div className="flex items-center space-x-0.5">
                                        <span className="text-red-600">↓</span>
                                        <span className="truncate">{new Date(produto.data_ultima_saida).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="align-top px-3 py-3">
                              <Badge className={status.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="align-top px-2 py-3">
                              <div className="flex flex-col space-y-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProduct(produto)
                                    setMovimentacaoData(prev => ({ 
                                      ...prev, 
                                      tipo_movimentacao: TipoMovimentacao.ENTRADA,
                                      valor_unitario: produto.preco_unitario.toString()
                                    }))
                                    setIsDialogOpen(true)
                                  }}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 w-full justify-center text-xs h-8"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Entrada
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProduct(produto)
                                    setMovimentacaoData(prev => ({ 
                                      ...prev, 
                                      tipo_movimentacao: TipoMovimentacao.SAIDA,
                                      valor_unitario: produto.preco_unitario.toString()
                                    }))
                                    setIsDialogOpen(true)
                                  }}
                                  disabled={produto.quantidade_estoque === 0}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full justify-center text-xs h-8 disabled:opacity-50"
                                >
                                  <Minus className="h-3 w-3 mr-1" />
                                  Saída
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {filteredProdutos.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            Nenhum produto encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
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
                        mov.tipo_movimentacao === TipoMovimentacao.ENTRADA ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {mov.tipo_movimentacao === TipoMovimentacao.ENTRADA ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{mov.produtos?.nome || 'Produto removido'}</div>
                        <div className="text-xs text-gray-500">
                          {mov.tipo_movimentacao === TipoMovimentacao.ENTRADA ? '+' : '-'}{mov.quantidade} • R$ {mov.valor_unitario.toFixed(2)}
                          {mov.fornecedores?.nome && ` • ${mov.fornecedores.nome}`}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(mov.created_at).toLocaleDateString('pt-BR')} às {new Date(mov.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                      <TableHead>Valor Unitário</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Nota Fiscal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allMovements.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="text-sm">
                          {new Date(mov.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium">{mov.produtos?.nome || 'Produto removido'}</TableCell>
                        <TableCell>
                          <Badge className={`${
                            mov.tipo_movimentacao === TipoMovimentacao.ENTRADA
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <div className="flex items-center space-x-1">
                              {mov.tipo_movimentacao === TipoMovimentacao.ENTRADA ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              <span>{mov.tipo_movimentacao === TipoMovimentacao.ENTRADA ? 'Entrada' : 'Saída'}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            mov.tipo_movimentacao === TipoMovimentacao.ENTRADA ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {mov.tipo_movimentacao === TipoMovimentacao.ENTRADA ? '+' : '-'}{mov.quantidade}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">R$ {mov.valor_unitario.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-gray-600">{mov.fornecedores?.nome || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {mov.nota_fiscal || '-'}
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
                {movimentacaoData.tipo_movimentacao === TipoMovimentacao.ENTRADA ? 'Entrada de Estoque' : 'Saída de Estoque'}
              </DialogTitle>
              <DialogDescription>
                {selectedProduct && (
                  <>
                    Produto: <strong>{selectedProduct.nome}</strong><br />
                    Estoque atual: <strong>{selectedProduct.quantidade_estoque} unidades</strong>
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
                  max="999999"
                  value={movimentacaoData.quantidade}
                  onChange={(e) => setMovimentacaoData({...movimentacaoData, quantidade: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_unitario">Valor Unitário *</Label>
                <Input
                  id="valor_unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={movimentacaoData.valor_unitario}
                  onChange={(e) => setMovimentacaoData({...movimentacaoData, valor_unitario: e.target.value})}
                  placeholder={selectedProduct ? `Padrão: R$ ${selectedProduct.preco_unitario.toFixed(2)}` : '0.00'}
                />
                <p className="text-xs text-gray-500">
                  Deixe vazio para usar o preço do produto
                </p>
              </div>

              {movimentacaoData.tipo_movimentacao === TipoMovimentacao.ENTRADA && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor_id">Fornecedor</Label>
                    <Select 
                      value={movimentacaoData.fornecedor_id} 
                      onValueChange={(value) => setMovimentacaoData({...movimentacaoData, fornecedor_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fornecedor (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores.map(fornecedor => (
                          <SelectItem key={fornecedor.id} value={fornecedor.id}>
                            {fornecedor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nota_fiscal">Nota Fiscal</Label>
                    <Input
                      id="nota_fiscal"
                      type="text"
                      maxLength={50}
                      value={movimentacaoData.nota_fiscal}
                      onChange={(e) => setMovimentacaoData({...movimentacaoData, nota_fiscal: e.target.value})}
                      placeholder="Número da NF (opcional)"
                    />
                  </div>
                </>
              )}

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
                  className={movimentacaoData.tipo_movimentacao === TipoMovimentacao.ENTRADA ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {movimentacaoData.tipo_movimentacao === TipoMovimentacao.ENTRADA ? 'Registrar Entrada' : 'Registrar Saída'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
