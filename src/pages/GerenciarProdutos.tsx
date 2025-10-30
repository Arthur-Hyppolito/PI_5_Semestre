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
  Edit, 
  Trash2, 
  Upload, 
  Search,
  Package,
  DollarSign,
  Hash,
  Image,
  Link,
  X,
  Download
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs'

interface User {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    avatar_url?: string
  }
}

interface Categoria {
  id: string
  nome: string
  descricao?: string
}

interface Cor {
  id: string
  codigo: string
  nome: string
}

interface Unidade {
  id: string
  codigo: string
  nome: string
  sigla?: string
}

interface Produto {
  // Campos básicos
  id: string
  nome: string
  descricao?: string
  created_at: string
  updated_at?: string
  
  // Campos financeiros
  preco_unitario: number
  
  // Campos de estoque
  quantidade_estoque: number
  qtd_entrada_total?: number
  qtd_saida_total?: number
  qtd_original?: number
  
  // Campos de controle
  status?: boolean
  produto_simples?: boolean
  codigo_produto?: string
  
  // Relacionamentos (IDs)
  categoria_id?: string
  cor_id?: string
  unidade_id?: string
  
  // Mídia
  imagem_url?: string
  
  // Auditoria de estoque
  data_ultima_entrada?: string
  hora_ultima_entrada?: string
  data_ultima_saida?: string
  hora_ultima_saida?: string
  
  // Relacionamentos (objetos) - quando usar JOINs
  categorias?: Categoria
  cores?: Cor
  unidades?: Unidade
}

// Interface para evento customizado de produto atualizado
interface ProdutoAtualizadoDetail {
  produtoId: string
  acao: 'criado' | 'atualizado' | 'excluido'
  produto?: Produto
}

// Declaração de tipo para o evento customizado
declare global {
  interface WindowEventMap {
    'produtoAtualizado': CustomEvent<ProdutoAtualizadoDetail>
  }
}

export default function GerenciarProdutos() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cores, setCores] = useState<Cor[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortBy, setSortBy] = useState<'nome' | 'preco_unitario' | 'quantidade_estoque' | 'created_at'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Produto | null>(null)
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco_unitario: '',
    quantidade_estoque: '0',
    categoria_id: '',
    cor_id: '',
    unidade_id: '',
    codigo_produto: '',
    produto_simples: true,
    status: true,
    imagem_url: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageUploadType, setImageUploadType] = useState<'url' | 'file'>('url')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [loadingCores, setLoadingCores] = useState(false)
  const [loadingUnidades, setLoadingUnidades] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false)
  const [newCategoryData, setNewCategoryData] = useState({ nome: '', descricao: '' })
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [codigoAutomatico, setCodigoAutomatico] = useState(true)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleImageError = (productId: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    setBrokenImages(prev => new Set(prev).add(productId))
    e.currentTarget.src = '/placeholder.svg'
  }

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // 300ms de delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    checkUser()
    loadProdutos()
    loadCategorias()
    loadCores()
    loadUnidades()
    
    // Configurar realtime subscription para atualizações automáticas
    const channel = supabase
      .channel('produtos-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'produtos'
        },
        (payload) => {
          console.log('Produto alterado:', payload)
          // Recarregar produtos quando houver mudanças de outros usuários
          loadProdutos()
        }
      )
      .subscribe()

    // Escutar mudanças na tabela de movimentações de estoque
    const movimentacoesChannel = supabase
      .channel('movimentacoes-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'movimentacoes_estoque'
        },
        (payload) => {
          console.log('Movimentação de estoque registrada:', payload)
          // Recarregar produtos para refletir mudanças no estoque
          loadProdutos()
        }
      )
      .subscribe()

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(channel)
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
        .select(`
          *,
          categorias (
            id,
            nome,
            descricao
          ),
          cores (
            id,
            codigo,
            nome
          ),
          unidades (
            id,
            codigo,
            nome,
            sigla
          )
        `)
        .eq('status', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar produtos:', error)
        toast({
          title: "Erro ao carregar produtos",
          description: error.message || "Não foi possível carregar os produtos.",
          variant: "destructive",
        })
        setProdutos([])
      } else {
        setProdutos(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar os produtos.",
        variant: "destructive",
      })
      setProdutos([])
    }
  }

  const loadCategorias = async () => {
    try {
      setLoadingCategorias(true)
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome, descricao')
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar categorias:', error)
        setCategorias([])
      } else {
        setCategorias(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      setCategorias([])
    } finally {
      setLoadingCategorias(false)
    }
  }

  const loadCores = async () => {
    try {
      setLoadingCores(true)
      const { data, error } = await supabase
        .from('cores')
        .select('id, codigo, nome')
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar cores:', error)
        setCores([])
      } else {
        setCores(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar cores:', error)
      setCores([])
    } finally {
      setLoadingCores(false)
    }
  }

  const loadUnidades = async () => {
    try {
      setLoadingUnidades(true)
      const { data, error } = await supabase
        .from('unidades')
        .select('id, codigo, nome, sigla')
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar unidades:', error)
        setUnidades([])
      } else {
        setUnidades(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error)
      setUnidades([])
    } finally {
      setLoadingUnidades(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryData.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome da categoria.",
        variant: "destructive",
      })
      return
    }

    setCreatingCategory(true)

    try {
      const { data, error } = await supabase
        .from('categorias')
        .insert([{
          nome: newCategoryData.nome.trim(),
          descricao: newCategoryData.descricao.trim() || null,
          ativo: true
        }])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar categoria:', error)
        toast({
          title: "Erro ao criar categoria",
          description: error.message || "Não foi possível criar a categoria.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Categoria criada!",
        description: `${data.nome} foi adicionada com sucesso.`,
      })

      // Adicionar categoria na lista local
      setCategorias(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
      
      // Selecionar a nova categoria no formulário
      setFormData({...formData, categoria_id: data.id})

      // Fechar dialog e limpar dados
      setIsNewCategoryDialogOpen(false)
      setNewCategoryData({ nome: '', descricao: '' })

    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a categoria.",
        variant: "destructive",
      })
    } finally {
      setCreatingCategory(false)
    }
  }

  const gerarCodigoAutomatico = async (): Promise<string> => {
    try {
      // Buscar o último código gerado
      const { data, error } = await supabase
        .from('produtos')
        .select('codigo_produto')
        .not('codigo_produto', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Erro ao buscar último código:', error)
        // Se houver erro, gerar código baseado em timestamp
        return `PROD${Date.now().toString().slice(-6)}`
      }

      if (!data || data.length === 0) {
        // Primeiro produto
        return 'PROD0001'
      }

      // Extrair número do último código
      const ultimoCodigo = data[0].codigo_produto
      const match = ultimoCodigo?.match(/\d+$/)
      
      if (match) {
        const numero = parseInt(match[0]) + 1
        return `PROD${numero.toString().padStart(4, '0')}`
      }

      // Se não conseguir extrair número, usar timestamp
      return `PROD${Date.now().toString().slice(-6)}`
    } catch (error) {
      console.error('Erro ao gerar código:', error)
      return `PROD${Date.now().toString().slice(-6)}`
    }
  }

  const uploadImageFile = async (file: File): Promise<string> => {
    try {
      setUploadingImage(true)
      
      // Validação de tamanho (máximo 5MB)
      const MAX_SIZE = 5 * 1024 * 1024 // 5MB em bytes
      if (file.size > MAX_SIZE) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        })
        throw new Error('Arquivo muito grande')
      }

      // Validação de tipo
      const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas imagens JPG, PNG, WebP e GIF são permitidas.",
          variant: "destructive",
        })
        throw new Error('Tipo de arquivo inválido')
      }
      
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `produtos/${fileName}`

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Erro no upload:', error)
        toast({
          title: "Erro no upload",
          description: "Não foi possível fazer upload da imagem. Use uma URL externa.",
          variant: "destructive",
        })
        throw error
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      toast({
        title: "Upload concluído!",
        description: "Imagem enviada com sucesso.",
      })

      return publicUrl
    } catch (error) {
      console.error('Erro no upload:', error)
      // Não usar fallback base64 - retornar placeholder
      return '/placeholder.svg'
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Previne múltiplos submits
    if (submitting) return
    
    setSubmitting(true)
    
    try {
      // Validação de preço
      const preco = parseFloat(formData.preco_unitario)
      if (isNaN(preco) || preco <= 0) {
        toast({
          title: "Preço inválido",
          description: "O preço unitário deve ser maior que zero.",
          variant: "destructive",
        })
        return
      }
      
      // Validação de nome único
      const { data: existingByName, error: nameCheckError } = await supabase
        .from('produtos')
        .select('id, nome')
        .ilike('nome', formData.nome)
        .single()
      
      if (nameCheckError && nameCheckError.code !== 'PGRST116') {
        console.error('Erro ao verificar nome:', nameCheckError)
      }
      
      // Se encontrou produto com mesmo nome e não é o que está sendo editado
      if (existingByName && existingByName.id !== editingProduct?.id) {
        toast({
          title: "Nome duplicado",
          description: `Já existe um produto com o nome "${formData.nome}".`,
          variant: "destructive",
        })
        return
      }
      
      // Gerar código automático se necessário (apenas ao criar)
      let codigoProduto = formData.codigo_produto
      if (!editingProduct && codigoAutomatico) {
        codigoProduto = await gerarCodigoAutomatico()
      }
      
      // Validação de código único (se fornecido)
      if (codigoProduto) {
        const { data: existingProduct, error: checkError } = await supabase
          .from('produtos')
          .select('id, codigo_produto')
          .eq('codigo_produto', codigoProduto)
          .single()
        
        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 = no rows returned (código não existe, ok)
          console.error('Erro ao verificar código:', checkError)
        }
        
        // Se encontrou produto e não é o que está sendo editado
        if (existingProduct && existingProduct.id !== editingProduct?.id) {
          toast({
            title: "Código duplicado",
            description: `O código "${codigoProduto}" já está em uso por outro produto.`,
            variant: "destructive",
          })
          return
        }
      }
    
    let finalImageUrl = formData.imagem_url || '/placeholder.svg'
    
    // Se há um arquivo de imagem, fazer upload
    if (imageFile && imageUploadType === 'file') {
      finalImageUrl = await uploadImageFile(imageFile)
    }
    
      // Dados base do produto (sem quantidade_estoque)
      const produtoDataBase = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        preco_unitario: parseFloat(formData.preco_unitario),
        status: formData.status,
        categoria_id: formData.categoria_id || null,
        cor_id: formData.cor_id || null,
        unidade_id: formData.unidade_id || null,
        codigo_produto: codigoProduto || null,
        produto_simples: formData.produto_simples,
        imagem_url: finalImageUrl
      }

      let produtoSalvo: Produto | null = null
      const isUpdate = !!editingProduct

      if (editingProduct) {
        // Atualizar produto existente - NÃO inclui quantidade_estoque
        const { data, error } = await supabase
          .from('produtos')
          .update(produtoDataBase)
          .eq('id', editingProduct.id)
          .select(`
            *,
            categorias (id, nome, descricao),
            cores (id, codigo, nome),
            unidades (id, codigo, nome, sigla)
          `)
          .single()

        if (error) {
          console.error('Erro ao atualizar produto:', error)
          toast({
            title: "Erro ao atualizar",
            description: error.message || "Não foi possível atualizar o produto.",
            variant: "destructive",
          })
          return
        }

        produtoSalvo = data

        toast({
          title: "Produto atualizado!",
          description: "As alterações foram salvas com sucesso.",
        })

        // Atualizar produto na lista local imediatamente
        setProdutos(prevProdutos => 
          prevProdutos.map(p => p.id === data.id ? data : p)
        )
      } else {
        // Criar novo produto - INCLUI quantidade_estoque do formulário
        const quantidadeEstoque = parseInt(formData.quantidade_estoque) || 0
        const produtoDataComEstoque = {
          ...produtoDataBase,
          quantidade_estoque: quantidadeEstoque
        }
        
        const { data, error } = await supabase
          .from('produtos')
          .insert([produtoDataComEstoque])
          .select(`
            *,
            categorias (id, nome, descricao),
            cores (id, codigo, nome),
            unidades (id, codigo, nome, sigla)
          `)
          .single()

        if (error) {
          console.error('Erro ao criar produto:', error)
          toast({
            title: "Erro ao criar produto",
            description: error.message || "Não foi possível criar o produto.",
            variant: "destructive",
          })
          return
        }

        produtoSalvo = data

        toast({
          title: "Produto criado!",
          description: "O produto foi adicionado ao catálogo.",
        })

        // Adicionar produto na lista local imediatamente
        setProdutos(prevProdutos => [data, ...prevProdutos])
      }

      // Reset form
      setFormData({
        nome: '',
        descricao: '',
        preco_unitario: '',
        quantidade_estoque: '0',
        categoria_id: '',
        cor_id: '',
        unidade_id: '',
        codigo_produto: '',
        produto_simples: true,
        status: true,
        imagem_url: ''
      })
      setImageFile(null)
      setImagePreview('')
      setImageUploadType('url')
      setEditingProduct(null)
      setIsDialogOpen(false)
      
      // Notificar outros componentes sobre a mudança
      if (produtoSalvo) {
        const evento = new CustomEvent<ProdutoAtualizadoDetail>('produtoAtualizado', {
          detail: { 
            produtoId: produtoSalvo.id,
            acao: isUpdate ? 'atualizado' : 'criado',
            produto: produtoSalvo
          }
        })
        window.dispatchEvent(evento)
      }

    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o produto.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (produto: Produto) => {
    setEditingProduct(produto)
    setFormData({
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco_unitario: produto.preco_unitario.toString(),
      quantidade_estoque: produto.quantidade_estoque.toString(),
      categoria_id: produto.categoria_id || '',
      cor_id: produto.cor_id || '',
      unidade_id: produto.unidade_id || '',
      codigo_produto: produto.codigo_produto || '',
      produto_simples: produto.produto_simples ?? true,
      status: produto.status ?? true,
      imagem_url: produto.imagem_url || ''
    })
    setImageFile(null)
    setImagePreview(produto.imagem_url || '')
    setImageUploadType('url')
    setIsDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validação de tamanho (máximo 5MB)
      const MAX_SIZE = 5 * 1024 * 1024 // 5MB
      if (file.size > MAX_SIZE) {
        toast({
          title: "Arquivo muito grande",
          description: `A imagem deve ter no máximo 5MB. Tamanho atual: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
          variant: "destructive",
        })
        e.target.value = '' // Limpar input
        return
      }

      // Validação de tipo
      const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas imagens JPG, PNG, WebP e GIF são permitidas.",
          variant: "destructive",
        })
        e.target.value = '' // Limpar input
        return
      }

      setImageFile(file)
      
      // Criar preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUrlChange = (url: string) => {
    setFormData({...formData, imagem_url: url})
    setImagePreview(url)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData({...formData, imagem_url: ''})
  }

  const handleDeleteClick = (produto: Produto) => {
    setProductToDelete(produto)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    // Previne múltiplas exclusões
    if (deleting) return

    setDeleting(true)

    try {
      // Verificar se produto tem movimentações de estoque
      const { data: movimentacoes, error: checkError } = await supabase
        .from('movimentacoes_estoque')
        .select('id')
        .eq('produto_id', productToDelete.id)
        .limit(1)

      if (checkError) {
        console.error('Erro ao verificar movimentações:', checkError)
        toast({
          title: "Erro ao verificar",
          description: "Não foi possível verificar o histórico do produto.",
          variant: "destructive",
        })
        return
      }

      // Se tem movimentações, não permite exclusão
      if (movimentacoes && movimentacoes.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: "Este produto possui histórico de movimentações de estoque e não pode ser excluído. Você pode desativá-lo ao invés de excluir.",
          variant: "destructive",
        })
        setIsDeleteDialogOpen(false)
        setProductToDelete(null)
        return
      }

      // Verificar se produto está em carrinhos
      const { data: carrinhos, error: carrinhoError } = await supabase
        .from('carrinho_itens')
        .select('id')
        .eq('produto_id', productToDelete.id)
        .limit(1)

      if (carrinhoError) {
        console.error('Erro ao verificar carrinhos:', carrinhoError)
      }

      // Se está em carrinhos, avisar mas permitir exclusão
      if (carrinhos && carrinhos.length > 0) {
        toast({
          title: "Aviso",
          description: "Este produto está em carrinhos de compra. A exclusão removerá o produto desses carrinhos.",
        })
      }

      // Produto pode ser excluído
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', productToDelete.id)

      if (error) throw error

      toast({
        title: "Produto excluído!",
        description: `${productToDelete.nome} foi removido do catálogo.`,
      })

      // Remover produto da lista local imediatamente
      setProdutos(prevProdutos => 
        prevProdutos.filter(p => p.id !== productToDelete.id)
      )

      setIsDeleteDialogOpen(false)
      setProductToDelete(null)

      // Notificar outros componentes sobre a exclusão
      const evento = new CustomEvent<ProdutoAtualizadoDetail>('produtoAtualizado', {
        detail: { 
          produtoId: productToDelete.id,
          acao: 'excluido',
          produto: productToDelete
        }
      })
      window.dispatchEvent(evento)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o produto.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      // Se já está ordenando por este campo, inverte a ordem
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Se é um campo novo, ordena ascendente
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleExportCSV = () => {
    try {
      // Cabeçalhos do CSV
      const headers = [
        'Código',
        'Nome',
        'Descrição',
        'Categoria',
        'Cor',
        'Unidade',
        'Preço Unitário',
        'Quantidade em Estoque',
        'Status',
        'Data de Criação'
      ]

      // Dados dos produtos (usa sortedProdutos para exportar na ordem atual)
      const rows = sortedProdutos.map(produto => [
        produto.codigo_produto || '-',
        produto.nome,
        produto.descricao || '-',
        produto.categorias?.nome || '-',
        produto.cores?.nome || '-',
        produto.unidades?.sigla || '-',
        produto.preco_unitario.toFixed(2),
        produto.quantidade_estoque,
        produto.status ? 'Ativo' : 'Inativo',
        new Date(produto.created_at).toLocaleDateString('pt-BR')
      ])

      // Combina headers e rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Cria blob e faz download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `produtos_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Exportação concluída!",
        description: `${sortedProdutos.length} produto(s) exportado(s) para CSV.`,
      })
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      })
    }
  }

  const filteredProdutos = produtos.filter(produto => {
    // Filtro por busca
    const matchesSearch = produto.nome.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      produto.categorias?.nome.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      produto.codigo_produto?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    
    // Filtro por categoria
    const matchesCategory = !selectedCategory || produto.categoria_id === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Ordenação
  const sortedProdutos = [...filteredProdutos].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy) {
      case 'nome':
        aValue = a.nome.toLowerCase()
        bValue = b.nome.toLowerCase()
        break
      case 'preco_unitario':
        aValue = a.preco_unitario
        bValue = b.preco_unitario
        break
      case 'quantidade_estoque':
        aValue = a.quantidade_estoque
        bValue = b.quantidade_estoque
        break
      case 'created_at':
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  // Paginação
  const totalPages = Math.ceil(sortedProdutos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProdutos = sortedProdutos.slice(startIndex, endIndex)

  // Reset para página 1 quando busca muda
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm])

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
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Gerenciar Produtos</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
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
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
            
            {(debouncedSearchTerm || selectedCategory) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('')
                }}
                className="text-gray-600"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={sortedProdutos.length === 0}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Exportar CSV</span>
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center space-x-2"
                onClick={() => {
                  setEditingProduct(null)
                  setFormData({
                    nome: '',
                    descricao: '',
                    preco_unitario: '',
                    quantidade_estoque: '0',
                    categoria_id: '',
                    cor_id: '',
                    unidade_id: '',
                    codigo_produto: '',
                    produto_simples: true,
                    status: true,
                    imagem_url: ''
                  })
                  setImageFile(null)
                  setImagePreview('')
                  setImageUploadType('url')
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Novo Produto</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct 
                    ? 'Edite as informações do produto. A quantidade de estoque não pode ser alterada aqui, use o gerenciamento de estoque.'
                    : 'Preencha as informações do produto. O código pode ser gerado automaticamente e você pode definir a quantidade inicial em estoque.'
                  }
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Produto *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="codigo_produto">Código do Produto</Label>
                      {!editingProduct && (
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={codigoAutomatico}
                            onChange={(e) => {
                              setCodigoAutomatico(e.target.checked)
                              if (e.target.checked) {
                                setFormData({...formData, codigo_produto: ''})
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600">Automático</span>
                        </label>
                      )}
                    </div>
                    <Input
                      id="codigo_produto"
                      value={formData.codigo_produto}
                      onChange={(e) => setFormData({...formData, codigo_produto: e.target.value})}
                      placeholder={codigoAutomatico ? "Será gerado automaticamente" : "Ex: PROD001"}
                      maxLength={8}
                      disabled={codigoAutomatico || !!editingProduct}
                    />
                    {codigoAutomatico && !editingProduct && (
                      <p className="text-xs text-blue-600">
                        O código será gerado automaticamente no formato PROD0001, PROD0002, etc.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preco_unitario">Preço Unitário (R$) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="preco_unitario"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.preco_unitario}
                        onChange={(e) => setFormData({...formData, preco_unitario: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unidade_id">Unidade de Medida *</Label>
                    <select
                      id="unidade_id"
                      value={formData.unidade_id}
                      onChange={(e) => setFormData({...formData, unidade_id: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                      disabled={loadingUnidades}
                    >
                      <option value="">
                        {loadingUnidades ? 'Carregando unidades...' : 'Selecione a unidade'}
                      </option>
                      {unidades.map((un) => (
                        <option key={un.id} value={un.id}>
                          {un.nome} ({un.sigla})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      Ex: Unidade (un), Dúzia (dz), Caixa (cx), etc.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade_estoque">Quantidade Inicial em Estoque *</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="quantidade_estoque"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.quantidade_estoque}
                      onChange={(e) => setFormData({...formData, quantidade_estoque: e.target.value})}
                      className="pl-10"
                      required
                      disabled={!!editingProduct}
                      placeholder="Ex: 10, 50, 100..."
                    />
                  </div>
                  {!editingProduct && formData.unidade_id && (
                    <p className="text-xs text-blue-600">
                      {formData.quantidade_estoque || '0'} {unidades.find(u => u.id === formData.unidade_id)?.sigla || 'unidade(s)'}
                    </p>
                  )}
                  {editingProduct && (
                    <p className="text-xs text-gray-500">
                      A quantidade de estoque não pode ser alterada na edição. Use o gerenciamento de estoque.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="categoria_id">Categoria *</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsNewCategoryDialogOpen(true)}
                        className="h-6 px-2 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Nova
                      </Button>
                    </div>
                    <select
                      id="categoria_id"
                      value={formData.categoria_id}
                      onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                      disabled={loadingCategorias}
                    >
                      <option value="">
                        {loadingCategorias ? 'Carregando categorias...' : 'Selecione uma categoria'}
                      </option>
                      {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cor_id">Cor (opcional)</Label>
                    <select
                      id="cor_id"
                      value={formData.cor_id}
                      onChange={(e) => setFormData({...formData, cor_id: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={loadingCores}
                    >
                      <option value="">
                        {loadingCores ? 'Carregando cores...' : 'Selecione uma cor'}
                      </option>
                      {cores.map((cor) => (
                        <option key={cor.id} value={cor.id}>
                          {cor.nome} ({cor.codigo})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    rows={3}
                  />
                </div>

                {/* Aviso sobre estoque */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>ℹ️ Nota:</strong> O estoque inicial será 0. Para adicionar estoque, use o sistema de movimentações após criar o produto.
                  </p>
                </div>

                <div className="space-y-4">
                  <Label>Imagem do Produto</Label>
                  
                  <Tabs value={imageUploadType} onValueChange={(value) => setImageUploadType(value as 'url' | 'file')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url" className="flex items-center space-x-2">
                        <Link className="h-4 w-4" />
                        <span>URL Online</span>
                      </TabsTrigger>
                      <TabsTrigger value="file" className="flex items-center space-x-2">
                        <Upload className="h-4 w-4" />
                        <span>Upload Local</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="url" className="space-y-2">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="https://exemplo.com/imagem.jpg"
                          value={formData.imagem_url}
                          onChange={(e) => handleUrlChange(e.target.value)}
                        />
                        {imagePreview && (
                          <Button type="button" variant="outline" size="icon" onClick={clearImage}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="file" className="space-y-2">
                      <div className="flex space-x-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {imagePreview && (
                          <Button type="button" variant="outline" size="icon" onClick={clearImage}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {uploadingImage && (
                        <div className="flex items-center space-x-2 text-sm text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Fazendo upload da imagem...</span>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                  
                  {/* Preview da imagem */}
                  {imagePreview && (
                    <div className="mt-4">
                      <Label className="text-sm text-gray-600 mb-2 block">Preview:</Label>
                      <div className="relative inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg'
                            toast({
                              title: "Erro ao carregar imagem",
                              description: "A URL da imagem pode estar incorreta ou inacessível.",
                              variant: "destructive",
                            })
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={clearImage}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting || uploadingImage}
                  >
                    {submitting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        {editingProduct ? 'Atualizando...' : 'Criando...'}
                      </>
                    ) : uploadingImage ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Enviando imagem...
                      </>
                    ) : (
                      editingProduct ? 'Atualizar Produto' : 'Criar Produto'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Cadastrados</CardTitle>
            <CardDescription>
              {sortedProdutos.length} produto(s) encontrado(s) - Página {currentPage} de {totalPages || 1}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('nome')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nome</span>
                      {sortBy === 'nome' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('preco_unitario')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Preço</span>
                      {sortBy === 'preco_unitario' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('quantidade_estoque')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Quantidade</span>
                      {sortBy === 'quantidade_estoque' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProdutos.length > 0 ? (
                  paginatedProdutos.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <div className="relative w-12 h-12">
                          {brokenImages.has(produto.id) ? (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                              <Image className="h-6 w-6 text-gray-400" />
                            </div>
                          ) : (
                            <img 
                              src={produto.imagem_url || '/placeholder.svg'} 
                              alt={produto.nome}
                              className="w-12 h-12 object-cover rounded border border-gray-200"
                              onError={(e) => handleImageError(produto.id, e)}
                              loading="lazy"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{produto.nome}</TableCell>
                      <TableCell>
                        {produto.categorias?.nome || '-'}
                      </TableCell>
                      <TableCell>R$ {produto.preco_unitario.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-sm ${
                          produto.quantidade_estoque > 10 
                            ? 'bg-green-100 text-green-800' 
                            : produto.quantidade_estoque > 0 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {produto.quantidade_estoque}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          produto.status 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {produto.status ? '● Ativo' : '○ Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(produto)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(produto)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64">
                      <div className="flex flex-col items-center justify-center py-12">
                        <Package className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {debouncedSearchTerm || selectedCategory ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
                          {debouncedSearchTerm || selectedCategory 
                            ? 'Tente ajustar os filtros de busca ou categoria para encontrar produtos.'
                            : 'Comece adicionando seu primeiro produto ao catálogo clicando no botão "Novo Produto".'}
                        </p>
                        {!debouncedSearchTerm && !selectedCategory && (
                          <Button
                            onClick={() => {
                              setEditingProduct(null)
                              setFormData({
                                nome: '',
                                descricao: '',
                                preco_unitario: '',
                                quantidade_estoque: '0',
                                categoria_id: '',
                                cor_id: '',
                                unidade_id: '',
                                codigo_produto: '',
                                produto_simples: true,
                                status: true,
                                imagem_url: ''
                              })
                              setImageFile(null)
                              setImagePreview('')
                              setImageUploadType('url')
                              setIsDialogOpen(true)
                            }}
                            className="flex items-center space-x-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Adicionar Primeiro Produto</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Controles de Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, sortedProdutos.length)} de {sortedProdutos.length} produtos
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Nova Categoria */}
        <Dialog open={isNewCategoryDialogOpen} onOpenChange={setIsNewCategoryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
              <DialogDescription>
                Adicione uma nova categoria de produtos.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new_categoria_nome">Nome da Categoria *</Label>
                <Input
                  id="new_categoria_nome"
                  value={newCategoryData.nome}
                  onChange={(e) => setNewCategoryData({...newCategoryData, nome: e.target.value})}
                  placeholder="Ex: Pranchas, Acessórios, Roupas..."
                  maxLength={100}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_categoria_descricao">Descrição (opcional)</Label>
                <Textarea
                  id="new_categoria_descricao"
                  value={newCategoryData.descricao}
                  onChange={(e) => setNewCategoryData({...newCategoryData, descricao: e.target.value})}
                  placeholder="Descreva esta categoria..."
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsNewCategoryDialogOpen(false)
                  setNewCategoryData({ nome: '', descricao: '' })
                }}
                disabled={creatingCategory}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateCategory}
                disabled={creatingCategory || !newCategoryData.nome.trim()}
              >
                {creatingCategory ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Categoria
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            
            {productToDelete && (
              <div className="space-y-4 py-4">
                <div className="flex items-start space-x-4">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    {brokenImages.has(productToDelete.id) ? (
                      <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                        <Image className="h-10 w-10 text-gray-400" />
                      </div>
                    ) : (
                      <img 
                        src={productToDelete.imagem_url || '/placeholder.svg'} 
                        alt={productToDelete.nome}
                        className="w-20 h-20 object-cover rounded border border-gray-200"
                        onError={(e) => handleImageError(productToDelete.id, e)}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{productToDelete.nome}</h3>
                    <p className="text-sm text-gray-600">{productToDelete.categorias?.nome || 'Sem categoria'}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Código: {productToDelete.codigo_produto || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600 text-xl">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800 font-medium">Atenção:</p>
                      <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                        <li>• O produto será removido permanentemente</li>
                        <li>• O histórico de movimentações será mantido</li>
                        <li>• Esta ação não pode ser desfeita</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setProductToDelete(null)
                }}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Excluindo...
                  </>
                ) : (
                  'Excluir Produto'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
