import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, auth } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { useToast } from '../hooks/use-toast'
import { 
  Waves, ArrowLeft, Plus, Edit, Trash2, Search, Users,
  User, Shield, UserX, UserCheck
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogTrigger,
} from '../components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select'
import { Badge } from '../components/ui/badge'

interface Usuario {
  id: string
  auth_user_id: string | null
  nome: string
  sobrenome: string
  email: string | null
  telefone: string | null
  cpf: string | null
  data_nascimento: string | null
  genero: string | null
  tipo_usuario: 'cliente' | 'admin'
  ativo: boolean
  created_at: string
  updated_at: string
}

const GerenciarUsuarios = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<'todos' | 'cliente' | 'admin'>('todos')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    cpf: '',
    data_nascimento: '',
    genero: '',
    tipo_usuario: 'cliente' as 'cliente' | 'admin',
    ativo: true
  })

  useEffect(() => {
    const checkAndLoad = async () => {
      try {
        const { user, error } = await auth.getCurrentUser()
        
        if (error || !user) {
          navigate('/login')
          return
        }

        const isUserAdmin = await auth.isAdmin(user.id)
        if (!isUserAdmin) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar esta página.",
            variant: "destructive",
          })
          navigate('/backoffice')
          return
        }

        loadUsuarios()
      } catch (error) {
        console.error('Erro:', error)
        navigate('/login')
      }
    }

    checkAndLoad()
  }, [])

  const loadUsuarios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsuarios(data || [])
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14)
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    
    try {
      if (!formData.nome || !formData.sobrenome) {
        toast({
          title: "Campos obrigatórios",
          description: "Nome e sobrenome são obrigatórios.",
          variant: "destructive",
        })
        return
      }

      const usuarioData = {
        nome: formData.nome,
        sobrenome: formData.sobrenome,
        email: formData.email || null,
        telefone: formData.telefone || null,
        cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : null,
        data_nascimento: formData.data_nascimento || null,
        genero: formData.genero || null,
        tipo_usuario: formData.tipo_usuario,
        ativo: formData.ativo,
      }

      if (editingUsuario) {
        const { data, error } = await supabase
          .from('clientes')
          .update(usuarioData)
          .eq('id', editingUsuario.id)
          .select()
          .single()

        if (error) throw error

        toast({
          title: "Usuário atualizado!",
          description: "As alterações foram salvas com sucesso.",
        })

        setUsuarios(prev => prev.map(u => u.id === data.id ? data : u))
      }

      setFormData({
        nome: '', sobrenome: '', email: '', telefone: '', cpf: '',
        data_nascimento: '', genero: '', tipo_usuario: 'cliente', ativo: true
      })
      setEditingUsuario(null)
      setIsDialogOpen(false)

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario)
    setFormData({
      nome: usuario.nome,
      sobrenome: usuario.sobrenome,
      email: usuario.email || '',
      telefone: usuario.telefone || '',
      cpf: usuario.cpf ? formatCPF(usuario.cpf) : '',
      data_nascimento: usuario.data_nascimento || '',
      genero: usuario.genero || '',
      tipo_usuario: usuario.tipo_usuario,
      ativo: usuario.ativo
    })
    setIsDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!usuarioToDelete) return
    setDeleting(true)

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', usuarioToDelete.id)

      if (error) throw error

      toast({
        title: "Usuário excluído!",
        description: "O usuário foi removido com sucesso.",
      })

      setUsuarios(prev => prev.filter(u => u.id !== usuarioToDelete.id))
      setIsDeleteDialogOpen(false)
      setUsuarioToDelete(null)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleStatus = async (usuario: Usuario) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ ativo: !usuario.ativo })
        .eq('id', usuario.id)

      if (error) throw error

      toast({
        title: "Status atualizado!",
        description: `Usuário ${!usuario.ativo ? 'ativado' : 'desativado'} com sucesso.`,
      })

      setUsuarios(prev => prev.map(u => 
        u.id === usuario.id ? { ...u, ativo: !u.ativo } : u
      ))
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(usuario => {
      const matchesSearch = 
        usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.sobrenome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.cpf?.includes(searchTerm.replace(/\D/g, ''))

      const matchesTipo = filterTipo === 'todos' || usuario.tipo_usuario === filterTipo
      const matchesStatus = 
        filterStatus === 'todos' || 
        (filterStatus === 'ativo' && usuario.ativo) ||
        (filterStatus === 'inativo' && !usuario.ativo)

      return matchesSearch && matchesTipo && matchesStatus
    })
  }, [usuarios, searchTerm, filterTipo, filterStatus])

  const stats = useMemo(() => ({
    total: usuarios.length,
    admins: usuarios.filter(u => u.tipo_usuario === 'admin').length,
    clientes: usuarios.filter(u => u.tipo_usuario === 'cliente').length,
    ativos: usuarios.filter(u => u.ativo).length,
    inativos: usuarios.filter(u => !u.ativo).length,
  }), [usuarios])

  return (
    <div className="min-h-screen bg-gray-50">
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
                <Users className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
                  <p className="text-blue-100 text-sm">Controle de usuários e permissões</p>
                </div>
              </div>
            </div>
            <Waves className="h-8 w-8 opacity-50" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.clientes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Inativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inativos}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Usuários Cadastrados ({filteredUsuarios.length})</span>
              </CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterTipo} onValueChange={(value: any) => setFilterTipo(value)}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="cliente">Clientes</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredUsuarios.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum usuário encontrado</h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Usuário</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Tipo</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsuarios.map((usuario) => (
                      <tr key={usuario.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{usuario.nome} {usuario.sobrenome}</div>
                              {usuario.cpf && (
                                <div className="text-xs text-gray-500">CPF: {formatCPF(usuario.cpf)}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {usuario.email || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={usuario.tipo_usuario === 'admin' ? 'default' : 'secondary'}>
                            {usuario.tipo_usuario === 'admin' ? (
                              <><Shield className="h-3 w-3 mr-1" /> Admin</>
                            ) : (
                              <><User className="h-3 w-3 mr-1" /> Cliente</>
                            )}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={usuario.ativo ? 'default' : 'destructive'}>
                            {usuario.ativo ? (
                              <><UserCheck className="h-3 w-3 mr-1" /> Ativo</>
                            ) : (
                              <><UserX className="h-3 w-3 mr-1" /> Inativo</>
                            )}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(usuario)}
                            >
                              {usuario.ativo ? (
                                <UserX className="h-4 w-4 text-orange-600" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(usuario)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUsuarioToDelete(usuario)
                                setIsDeleteDialogOpen(true)
                              }}
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

      {/* Dialog de Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Edite as informações do usuário abaixo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} required />
              </div>
              <div>
                <Label>Sobrenome *</Label>
                <Input value={formData.sobrenome} onChange={(e) => setFormData({...formData, sobrenome: e.target.value})} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: formatPhone(e.target.value)})} />
              </div>
              <div>
                <Label>CPF</Label>
                <Input value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})} maxLength={14} />
              </div>
              <div>
                <Label>Data Nascimento</Label>
                <Input type="date" value={formData.data_nascimento} onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={formData.tipo_usuario} onValueChange={(value: any) => setFormData({...formData, tipo_usuario: value})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.ativo ? 'ativo' : 'inativo'} onValueChange={(value) => setFormData({...formData, ativo: value === 'ativo'})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir {usuarioToDelete?.nome}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default GerenciarUsuarios
