import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Waves, Eye, EyeOff, Loader2, Users, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<"cliente" | "gerencial" | null>(
    null
  );
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await auth.signIn(email, password);

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando...",
        });

        // Redirecionar baseado no tipo de usuário
        if (loginType === "cliente") {
          navigate("/");
        } else {
          // Verificar se é admin
          const isUserAdmin = await auth.isAdmin(data.user.id);

          if (isUserAdmin) {
            navigate("/backoffice");
          } else {
            toast({
              title: "Acesso negado",
              description:
                "Você não tem permissão para acessar a área gerencial.",
              variant: "destructive",
            });
            return;
          }
        }
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Se não selecionou o tipo de login, mostrar seleção
  if (!loginType) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-white hover:text-ocean-light transition-colors"
            >
              <Waves className="h-10 w-10" />
              <span className="text-2xl font-bold">WaveSurf</span>
            </Link>
          </div>

          {/* Seleção de Tipo de Login */}
          <Card className="bg-white/95 backdrop-blur-md shadow-[var(--shadow-ocean)]">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center bg-gradient-ocean bg-clip-text text-transparent">
                Escolha seu Acesso
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Selecione o tipo de login desejado
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setLoginType("cliente")}
                variant="outline"
                className="w-full h-16 flex items-center justify-center space-x-3 hover:bg-ocean-light/10 hover:border-ocean-medium hover:text-ocean-deep transition-all"
              >
                <Users className="h-6 w-6 text-ocean-medium" />
                <div className="text-left">
                  <div className="font-semibold text-lg">Cliente</div>
                  <div className="text-sm text-muted-foreground hover:text-ocean-medium transition-colors">
                    Acesso à loja e pedidos
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => setLoginType("gerencial")}
                variant="outline"
                className="w-full h-16 flex items-center justify-center space-x-3 hover:bg-ocean-light/10 hover:border-ocean-medium hover:text-ocean-deep transition-all"
              >
                <Shield className="h-6 w-6 text-ocean-medium" />
                <div className="text-left">
                  <div className="font-semibold text-lg">Área Gerencial</div>
                  <div className="text-sm text-muted-foreground hover:text-ocean-medium transition-colors">
                    Painel administrativo
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Link
              to="/"
              className="text-white/80 hover:text-white transition-colors"
            >
              ← Voltar ao site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-white hover:text-ocean-light transition-colors"
          >
            <Waves className="h-10 w-10" />
            <span className="text-2xl font-bold">WaveSurf</span>
          </Link>
        </div>

        {/* Login Card */}
        <Card className="bg-white/95 backdrop-blur-md shadow-[var(--shadow-ocean)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLoginType(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Voltar
              </Button>
              <div className="flex items-center space-x-2">
                {loginType === "cliente" ? (
                  <Users className="h-5 w-5 text-ocean-medium" />
                ) : (
                  <Shield className="h-5 w-5 text-ocean-medium" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center bg-gradient-ocean bg-clip-text text-transparent">
              {loginType === "cliente" ? "Acesso do Cliente" : "Área Gerencial"}
            </CardTitle>
            <p className="text-center text-muted-foreground">
              {loginType === "cliente"
                ? "Acesse sua conta para fazer pedidos"
                : "Acesse o painel administrativo"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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

              <Button
                type="submit"
                variant="ocean"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Esqueceu sua senha?{" "}
                <a
                  href="#"
                  className="text-ocean-medium hover:text-ocean-deep transition-colors"
                >
                  Recuperar acesso
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <Link
                  to="/register"
                  className="text-ocean-medium hover:text-ocean-deep transition-colors font-medium"
                >
                  Criar conta
                </Link>
              </p>
            </div>

            {loginType === "gerencial" && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 text-center font-medium mb-2">
                  <strong>🔐 Credenciais de Administrador</strong>
                </p>
                <div className="text-xs text-blue-600 space-y-1">
                  <p>
                    <strong>Email:</strong> admin@admin.com
                  </p>
                  <p>
                    <strong>Senha:</strong> 123321
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 text-center">
                <strong>✅ Supabase Configurado!</strong> O sistema de
                autenticação está ativo.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-white/80 hover:text-white transition-colors"
          >
            ← Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
