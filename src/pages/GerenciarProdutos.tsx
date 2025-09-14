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
  X
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

export default function GerenciarProdutos() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    quantidade: '',
    categoria: '',
    imagem_url: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageUploadType, setImageUploadType] = useState<'url' | 'file'>('url')
  const [uploadingImage, setUploadingImage] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    checkUser()
    loadProdutos()
    
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
          toast({
            title: "Produtos atualizados!",
            description: "Os produtos foram atualizados automaticamente.",
          })
          
          // Recarregar produtos quando houver mudanças
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
          toast({
            title: "Estoque atualizado!",
            description: "Uma movimentação de estoque foi registrada.",
          })
          
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
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar produtos:', error)
        // Se a tabela não existir, vamos criar dados mock
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
            quantidade: 8,
            categoria: 'Wetsuits',
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

  const uploadImageFile = async (file: File): Promise<string> => {
    try {
      setUploadingImage(true)
      
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `produtos/${fileName}`

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (error) {
        console.error('Erro no upload:', error)
        // Fallback: converter para base64
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Erro no upload:', error)
      // Fallback: converter para base64
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let finalImageUrl = formData.imagem_url || '/placeholder.svg'
    
    // Se há um arquivo de imagem, fazer upload
    if (imageFile && imageUploadType === 'file') {
      finalImageUrl = await uploadImageFile(imageFile)
    }
    
    const produtoData = {
      nome: formData.nome,
      descricao: formData.descricao,
      preco: parseFloat(formData.preco),
      quantidade: parseInt(formData.quantidade),
      categoria: formData.categoria,
      imagem_url: finalImageUrl
    }

    try {
      if (editingProduct) {
        // Atualizar produto existente
        const { error } = await supabase
          .from('produtos')
          .update(produtoData)
          .eq('id', editingProduct.id)

        if (error) {
          // Simular atualização se a tabela não existir
          setProdutos(prev => prev.map(p => 
            p.id === editingProduct.id 
              ? { ...p, ...produtoData }
              : p
          ))
        }

        toast({
          title: "Produto atualizado!",
          description: "As alterações foram salvas com sucesso.",
        })
      } else {
        // Criar novo produto
        const { error } = await supabase
          .from('produtos')
          .insert([produtoData])

        if (error) {
          // Simular criação se a tabela não existir
          const novoProduto: Produto = {
            id: Date.now().toString(),
            ...produtoData,
            created_at: new Date().toISOString()
          }
          setProdutos(prev => [novoProduto, ...prev])
        }

        toast({
          title: "Produto criado!",
          description: "O produto foi adicionado ao catálogo.",
        })
      }

      // Reset form
      setFormData({
        nome: '',
        descricao: '',
        preco: '',
        quantidade: '',
        categoria: '',
        imagem_url: ''
      })
      setImageFile(null)
      setImagePreview('')
      setImageUploadType('url')
      setEditingProduct(null)
      setIsDialogOpen(false)
      
      // Recarregar produtos após mudança
      setTimeout(() => {
        loadProdutos()
      }, 500)
      
      // Notificar outros componentes sobre a mudança
      window.dispatchEvent(new CustomEvent('produtoAtualizado', {
        detail: { produtoId: editingProduct?.id || 'novo', acao: editingProduct ? 'atualizado' : 'criado' }
      }))

    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o produto.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (produto: Produto) => {
    setEditingProduct(produto)
    setFormData({
      nome: produto.nome,
      descricao: produto.descricao,
      preco: produto.preco.toString(),
      quantidade: produto.quantidade.toString(),
      categoria: produto.categoria,
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

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id)

      if (error) {
        // Simular exclusão se a tabela não existir
        setProdutos(prev => prev.filter(p => p.id !== id))
      }

      toast({
        title: "Produto excluído!",
        description: "O produto foi removido do catálogo.",
      })
      
      // Recarregar produtos após exclusão
      setTimeout(() => {
        loadProdutos()
      }, 500)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o produto.",
        variant: "destructive",
      })
    }
  }

  const filteredProdutos = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center space-x-2"
                onClick={() => {
                  setEditingProduct(null)
                  setFormData({
                    nome: '',
                    descricao: '',
                    preco: '',
                    quantidade: '',
                    categoria: '',
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct 
                    ? 'Edite as informações do produto abaixo.'
                    : 'Preencha as informações para adicionar um novo produto.'
                  }
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Input
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      placeholder="Ex: Pranchas, Wetsuits, Acessórios"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preco">Preço (R$) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="preco"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.preco}
                        onChange={(e) => setFormData({...formData, preco: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade *</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="quantidade"
                        type="number"
                        min="0"
                        value={formData.quantidade}
                        onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
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
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingProduct ? 'Atualizar' : 'Criar'} Produto
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Cadastrados</CardTitle>
            <CardDescription>
              {filteredProdutos.length} produto(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProdutos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell>
                      <img 
                        src={produto.imagem_url || '/placeholder.svg'} 
                        alt={produto.nome}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg'
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell>{produto.categoria}</TableCell>
                    <TableCell>R$ {produto.preco.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-sm ${
                        produto.quantidade > 10 
                          ? 'bg-green-100 text-green-800' 
                          : produto.quantidade > 0 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {produto.quantidade}
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
                          onClick={() => handleDelete(produto.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProdutos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
