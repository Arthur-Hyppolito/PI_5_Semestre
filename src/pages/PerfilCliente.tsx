import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Save, User, MapPin, Mail, Phone, Calendar, ArrowLeft } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { auth, supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Sidebar from '@/components/Sidebar'

export default function PerfilCliente() {
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profileData, setProfileData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    telefone: '',
    cpf: '',
    data_nascimento: '',
    genero: '',
    foto_perfil: '',
    endereco: {
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    }
  })
  
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
      setProfileData(prev => ({
        ...prev,
        email: user.email || ''
      }))
      
      // Tentar carregar perfil existente
      loadProfile(user.id)
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      navigate('/login')
    }
  }

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('auth_user_id', userId)
        .single()

      console.log('Dados do perfil carregados:', data)
      console.log('Erro ao carregar perfil:', error)

      if (data) {
        console.log('Preenchendo campos com:', {
          nome: data.nome,
          sobrenome: data.sobrenome,
          telefone: data.telefone,
          email: user?.email
        })
        
        setProfileData({
          nome: data.nome || '',
          sobrenome: data.sobrenome || '',
          email: user?.email || '',
          telefone: data.telefone || '',
          cpf: data.cpf || '',
          data_nascimento: data.data_nascimento || '',
          genero: data.genero || '',
          foto_perfil: data.foto_perfil || '',
          endereco: data.endereco || {
            rua: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: ''
          }
        })
      } else {
        console.log('Nenhum perfil encontrado, mantendo apenas email')
        // Se não existe perfil, criar um vazio mas manter email do usuário
        setProfileData(prev => ({
          ...prev,
          email: user?.email || ''
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        // Fallback para base64 se o storage falhar
        const reader = new FileReader()
        reader.onload = (e) => {
          const base64 = e.target?.result as string
          setProfileData(prev => ({ ...prev, foto_perfil: base64 }))
        }
        reader.readAsDataURL(file)
        
        toast({
          title: "Imagem carregada",
          description: "Imagem salva localmente. Configure o Supabase Storage para persistência.",
        })
      } else {
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        setProfileData(prev => ({ ...prev, foto_perfil: data.publicUrl }))
        
        toast({
          title: "Foto atualizada!",
          description: "Sua foto de perfil foi atualizada com sucesso.",
        })
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('clientes')
        .upsert([
          {
            auth_user_id: user.id,
            nome: profileData.nome,
            sobrenome: profileData.sobrenome,
            telefone: profileData.telefone,
            cpf: profileData.cpf,
            data_nascimento: profileData.data_nascimento || null,
            genero: profileData.genero,
            foto_perfil: profileData.foto_perfil,
            endereco: profileData.endereco,
            tipo_usuario: 'cliente'
          }
        ])

      if (error) {
        throw error
      }

      toast({
        title: "Perfil salvo!",
        description: "Suas informações foram atualizadas com sucesso.",
      })
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error)
      console.error('Detalhes do erro:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
      toast({
        title: "Erro ao salvar",
        description: `Erro: ${error?.message || 'Ocorreu um erro ao salvar suas informações. Tente novamente.'}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddressChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      endereco: { ...prev.endereco, [field]: value }
    }))
  }

  const formatCPF = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '')
    
    // Aplica a máscara do CPF: 000.000.000-00
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    }
    return numbers.slice(0, 11)
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const handleCPFChange = (value: string) => {
    const formattedCPF = formatCPF(value)
    handleInputChange('cpf', formattedCPF)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar à Loja</span>
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-ocean-deep">Meu Perfil</h1>
            <p className="text-gray-600 mt-2">Complete suas informações pessoais</p>
          </div>

        {/* Foto de Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Foto de Perfil</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profileData.foto_perfil} />
              <AvatarFallback className="text-2xl">
                {profileData.nome ? profileData.nome[0] : <User className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="avatar-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('avatar-upload')?.click()}
                disabled={uploadingImage}
              >
                <Camera className="h-4 w-4 mr-2" />
                {uploadingImage ? 'Enviando...' : 'Alterar Foto'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Informações Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={profileData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sobrenome">Sobrenome *</Label>
                <Input
                  id="sobrenome"
                  value={profileData.sobrenome}
                  onChange={(e) => handleInputChange('sobrenome', e.target.value)}
                  placeholder="Seu sobrenome"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Email não pode ser alterado</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={profileData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={profileData.cpf}
                  onChange={(e) => handleCPFChange(e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                <p className="text-xs text-gray-500">Campo opcional</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={profileData.data_nascimento}
                  onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genero">Gênero</Label>
                <Select value={profileData.genero} onValueChange={(value) => handleInputChange('genero', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                    <SelectItem value="nao_informar">Prefiro não informar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Endereço</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="rua">Rua</Label>
                <Input
                  id="rua"
                  value={profileData.endereco.rua}
                  onChange={(e) => handleAddressChange('rua', e.target.value)}
                  placeholder="Nome da rua"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={profileData.endereco.numero}
                  onChange={(e) => handleAddressChange('numero', e.target.value)}
                  placeholder="123"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={profileData.endereco.complemento}
                  onChange={(e) => handleAddressChange('complemento', e.target.value)}
                  placeholder="Apto, bloco, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={profileData.endereco.bairro}
                  onChange={(e) => handleAddressChange('bairro', e.target.value)}
                  placeholder="Nome do bairro"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={profileData.endereco.cidade}
                  onChange={(e) => handleAddressChange('cidade', e.target.value)}
                  placeholder="Nome da cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select value={profileData.endereco.estado} onValueChange={(value) => handleAddressChange('estado', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AC">AC</SelectItem>
                    <SelectItem value="AL">AL</SelectItem>
                    <SelectItem value="AP">AP</SelectItem>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="BA">BA</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="DF">DF</SelectItem>
                    <SelectItem value="ES">ES</SelectItem>
                    <SelectItem value="GO">GO</SelectItem>
                    <SelectItem value="MA">MA</SelectItem>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="MS">MS</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="PA">PA</SelectItem>
                    <SelectItem value="PB">PB</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="PE">PE</SelectItem>
                    <SelectItem value="PI">PI</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="RN">RN</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                    <SelectItem value="RO">RO</SelectItem>
                    <SelectItem value="RR">RR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="SE">SE</SelectItem>
                    <SelectItem value="TO">TO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={profileData.endereco.cep}
                  onChange={(e) => handleAddressChange('cep', e.target.value)}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
