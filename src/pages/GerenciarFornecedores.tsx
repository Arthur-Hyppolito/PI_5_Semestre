import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { useToast } from '../hooks/use-toast'
import { 
  Waves, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  FileText
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'

interface Fornecedor {
  id: string
  nome: string
  cnpj: string
  contato: string | null
  endereco: string | null
  email: string | null
  telefone: string | null
  created_at: string
  updated_at: string
}

const GerenciarFornecedores = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [fornecedorToDelete, setFornecedorToDelete] = useState<Fornecedor | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    contato: '',
    endereco: '',
    email: '',
    telefone: ''
  })

  useEffect(() => {
    loadFornecedores()
  }, [])

  const loadFornecedores = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome', { ascending: true })

      if (error) {
        console.error('Erro ao carregar fornecedores:', error)
        toast({
          title: "Erro ao carregar fornecedores",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      setFornecedores(data || [])
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar os fornecedores.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  const validateCNPJ = (cnpj: string): boolean => {
    const numbers = cnpj.replace(/\D/g, '')
    return numbers.length === 14
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (submitting) return
    
    setSubmitting(true)
    
    try {
      // Validar CNPJ
      if (!validateCNPJ(formData.cnpj)) {
        toast({
          title: "CNPJ inválido",
          description: "O CNPJ deve ter 14 dígitos.",
          variant: "destructive",
        })
        return
      }

      // Remover formatação do CNPJ
      const cnpjLimpo = formData.cnpj.replace(/\D/g, '')

      // Verificar CNPJ único
      const { data: existingFornecedor, error: checkError } = await supabase
        .from('fornecedores')
        .select('id, cnpj')
        .eq('cnpj', cnpjLimpo)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar CNPJ:', checkError)
      }

      if (existingFornecedor && existingFornecedor.id !== editingFornecedor?.id) {
        toast({
          title: "CNPJ já cadastrado",
          description: `O CNPJ ${formData.cnpj} já está em uso por outro fornecedor.`,
          variant: "destructive",
        })
        return
      }

      const fornecedorData = {
        nome: formData.nome,
        cnpj: cnpjLimpo,
        contato: formData.contato || null,
        endereco: formData.endereco || null,
        email: formData.email || null,
        telefone: formData.telefone || null,
      }

      if (editingFornecedor) {
        // Atualizar
        const { data, error } = await supabase
          .from('fornecedores')
          .update(fornecedorData)
          .eq('id', editingFornecedor.id)
          .select()
          .single()

        if (error) {
          console.error('Erro ao atualizar fornecedor:', error)
          toast({
            title: "Erro ao atualizar fornecedor",
            description: error.message,
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Fornecedor atualizado!",
          description: "As alterações foram salvas com sucesso.",
        })

        setFornecedores(prev => prev.map(f => f.id === data.id ? data : f))
      } else {
        // Criar
        const { data, error } = await supabase
          .from('fornecedores')
          .insert([fornecedorData])
          .select()
          .single()

        if (error) {
          console.error('Erro ao criar fornecedor:', error)
          toast({
            title: "Erro ao criar fornecedor",
            description: error.message,
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Fornecedor criado!",
          description: "O fornecedor foi adicionado com sucesso.",
        })

        setFornecedores(prev => [data, ...prev])
      }

      // Reset form
      setFormData({
        nome: '',
        cnpj: '',
        contato: '',
        endereco: '',
        email: '',
        telefone: ''
      })
      setEditingFornecedor(null)
      setIsDialogOpen(false)

    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o fornecedor.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor)
    setFormData({
      nome: fornecedor.nome,
      cnpj: formatCNPJ(fornecedor.cnpj),
      contato: fornecedor.contato || '',
      endereco: fornecedor.endereco || '',
      email: fornecedor.email || '',
      telefone: fornecedor.telefone || ''
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (fornecedor: Fornecedor) => {
    setFornecedorToDelete(fornecedor)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!fornecedorToDelete) return

    setDeleting(true)

    try {
      // Verificar se há movimentações vinculadas
      const { data: movimentacoes, error: checkError } = await supabase
        .from('movimentacoes_estoque')
        .select('id')
        .eq('fornecedor_id', fornecedorToDelete.id)
        .limit(1)

      if (checkError) {
        console.error('Erro ao verificar movimentações:', checkError)
      }

      if (movimentacoes && movimentacoes.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: "Este fornecedor possui movimentações de estoque vinculadas. Não é possível excluí-lo.",
          variant: "destructive",
        })
        setIsDeleteDialogOpen(false)
        setFornecedorToDelete(null)
        return
      }

      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', fornecedorToDelete.id)

      if (error) {
        console.error('Erro ao excluir fornecedor:', error)
        toast({
          title: "Erro ao excluir fornecedor",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Fornecedor excluído!",
        description: "O fornecedor foi removido com sucesso.",
      })

      setFornecedores(prev => prev.filter(f => f.id !== fornecedorToDelete.id))
      setIsDeleteDialogOpen(false)
      setFornecedorToDelete(null)

    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o fornecedor.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const filteredFornecedores = fornecedores.filter(fornecedor =>
    fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.cnpj.includes(searchTerm.replace(/\D/g, '')) ||
    fornecedor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/backoffice')}
                className="text-white hover:bg-blue-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Gerenciar Fornecedores</h1>
                  <p className="text-blue-100 text-sm">Cadastro e controle de fornecedores</p>
                </div>
              </div>
            </div>
            <Waves className="h-8 w-8 opacity-50" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Fornecedores Cadastrados</span>
                <span className="text-sm font-normal text-gray-500">
                  ({filteredFornecedores.length})
                </span>
              </CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, CNPJ ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="flex items-center space-x-2"
                      onClick={() => {
                        setEditingFornecedor(null)
                        setFormData({
                          nome: '',
                          cnpj: '',
                          contato: '',
                          endereco: '',
                          email: '',
                          telefone: ''
                        })
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Novo Fornecedor</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingFornecedor 
                          ? 'Edite as informações do fornecedor abaixo.'
                          : 'Preencha as informações para cadastrar um novo fornecedor.'
                        }
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nome">Nome do Fornecedor *</Label>
                          <Input
                            id="nome"
                            value={formData.nome}
                            onChange={(e) => setFormData({...formData, nome: e.target.value})}
                            placeholder="Ex: Surf Imports Ltda"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cnpj">CNPJ *</Label>
                          <Input
                            id="cnpj"
                            value={formData.cnpj}
                            onChange={(e) => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})}
                            placeholder="00.000.000/0000-00"
                            maxLength={18}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contato">Nome do Contato</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              id="contato"
                              value={formData.contato}
                              onChange={(e) => setFormData({...formData, contato: e.target.value})}
                              placeholder="Ex: João Silva"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="telefone">Telefone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              id="telefone"
                              value={formData.telefone}
                              onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                              placeholder="(00) 00000-0000"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              placeholder="contato@fornecedor.com.br"
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endereco">Endereço Completo</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                          <Textarea
                            id="endereco"
                            value={formData.endereco}
                            onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                            placeholder="Rua, número, bairro, cidade, estado, CEP"
                            rows={3}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false)
                            setEditingFornecedor(null)
                          }}
                          disabled={submitting}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span>
                              {editingFornecedor ? 'Atualizando...' : 'Criando...'}
                            </>
                          ) : (
                            editingFornecedor ? 'Atualizar Fornecedor' : 'Criar Fornecedor'
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredFornecedores.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum fornecedor encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm 
                    ? 'Tente ajustar sua busca.'
                    : 'Comece adicionando seu primeiro fornecedor clicando no botão "Novo Fornecedor".'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Nome</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">CNPJ</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Contato</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Telefone</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFornecedores.map((fornecedor) => (
                      <tr key={fornecedor.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{fornecedor.nome}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatCNPJ(fornecedor.cnpj)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {fornecedor.contato || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {fornecedor.email || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {fornecedor.telefone || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(fornecedor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(fornecedor)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {fornecedorToDelete && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{fornecedorToDelete.nome}</h3>
                    <p className="text-sm text-gray-600">CNPJ: {formatCNPJ(fornecedorToDelete.cnpj)}</p>
                    {fornecedorToDelete.email && (
                      <p className="text-sm text-gray-600">Email: {fornecedorToDelete.email}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Se este fornecedor possuir movimentações de estoque vinculadas, não será possível excluí-lo.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setFornecedorToDelete(null)
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
                'Excluir Fornecedor'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default GerenciarFornecedores
