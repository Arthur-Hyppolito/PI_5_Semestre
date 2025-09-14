import { useState } from 'react'
import { supabase } from "@/lib/supabase"
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Waves, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Registrar usuário no Supabase Auth com metadados
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: nome,
            sobrenome: sobrenome,
            telefone: telefone
          }
        }
      })
      
      if (error) {
        console.error('Erro no Supabase Auth:', error)
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      if (data.user) {
        console.log('Usuário criado com sucesso:', data.user)
        console.log('Session:', data.session)
        console.log('User confirmado?', data.user.email_confirmed_at)
        
        if (data.session) {
          toast({
            title: "Cadastro realizado!",
            description: "Complete seu perfil para uma melhor experiência.",
          })
          navigate('/perfil')
        } else {
          toast({
            title: "Verifique seu email",
            description: "Um link de confirmação foi enviado para seu email.",
          })
        }
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Verifique o console para mais detalhes.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-white hover:text-ocean-light transition-colors">
            <Waves className="h-10 w-10" />
            <span className="text-2xl font-bold">WaveSurf</span>
          </Link>
        </div>

        {/* Register Card */}
        <Card className="bg-white/95 backdrop-blur-md shadow-[var(--shadow-ocean)]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center bg-gradient-ocean bg-clip-text text-transparent">
              Criar Conta de Cliente
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Cadastre-se para acessar nossa loja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="focus:ring-ocean-medium focus:border-ocean-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sobrenome">Sobrenome *</Label>
                  <Input
                    id="sobrenome"
                    type="text"
                    placeholder="Seu sobrenome"
                    value={sobrenome}
                    onChange={(e) => setSobrenome(e.target.value)}
                    required
                    className="focus:ring-ocean-medium focus:border-ocean-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="focus:ring-ocean-medium focus:border-ocean-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="focus:ring-ocean-medium focus:border-ocean-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha (mín. 6 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="focus:ring-ocean-medium focus:border-ocean-medium pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" variant="ocean" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Criar Conta"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-ocean-medium hover:text-ocean-deep transition-colors font-medium">
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link to="/" className="text-white/80 hover:text-white transition-colors">
            ← Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  )
}
