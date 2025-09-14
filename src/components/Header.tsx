import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Waves, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, getClientProfile, auth } from "@/lib/supabase";
import { CartIcon } from "@/components/Cart";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Teste básico do console

  const navigation = [
    { name: "Início", href: "/" },
    { name: "Produtos", href: "#produtos" },
    { name: "Quem Somos", href: "#quem-somos" },
    { name: "Serviços", href: "#servicos" },
  ];

  useEffect(() => {
    // Verificar usuário atual
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const result = await getClientProfile(user.id) as any;
          setClientProfile(result.data);
        }
      } catch (err) {
        console.error('Header - Erro ao verificar usuário:', err);
      }
    };

    checkUser();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        // Usar dados do user_metadata imediatamente como fallback
        const fallbackProfile = {
          nome: session.user.user_metadata?.nome || 'Cliente',
          sobrenome: session.user.user_metadata?.sobrenome || '',
          email: session.user.email || ''
        };
        setClientProfile(fallbackProfile);
        
        // Buscar perfil completo em background
        const result = await getClientProfile(session.user.id) as any;
        if (result.data && !result.error) {
          setClientProfile(result.data);
        }
      } else {
        setClientProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUserClick = () => {
    navigate('/perfil');
  };

  // Nova função de logout robusta
  const handleLogout = async () => {
    if (isLoggingOut) return; // Previne múltiplos cliques
    
    setIsLoggingOut(true);
    
    try {
      // Usar a nova função de logout
      const result = await auth.performLogout();
      
      if (result.success) {
        // Limpar estados locais
        setUser(null);
        setClientProfile(null);
        
        // Mostrar mensagem de sucesso
        toast({
          title: "Logout realizado",
          description: result.message,
          variant: "default",
        });
        
        // Redirecionar para home
        navigate('/', { replace: true });
        
        // Forçar reload da página para garantir limpeza completa
        setTimeout(() => {
          window.location.href = '/';
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
        description: "Falha crítica no logout. Recarregando página...",
        variant: "destructive",
      });
      
      // Em caso de erro crítico, forçar reload
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-ocean-light/20">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Waves className="h-8 w-8 text-ocean-medium" />
            <span className="text-xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
              WaveSurf
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-ocean-medium transition-colors duration-300"
              >
                {item.name}
              </a>
            ))}
            
            {/* Cart Icon */}
            <CartIcon />
            
            {user ? (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUserClick}
                  className="flex items-center space-x-2 hover:bg-ocean-light/10"
                >
                  <User className="h-4 w-4" />
                  <span>{clientProfile?.nome || 'Usuário'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "Saindo..." : "Sair"}
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="ocean" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-ocean-light/20">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-foreground hover:text-ocean-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              
              {/* Mobile Cart Icon */}
              <div className="px-3 py-2">
                <CartIcon />
              </div>
              
              <div className="px-3 py-2">
                {user ? (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUserClick}
                      className="w-full flex items-center space-x-2 justify-start"
                    >
                      <User className="h-4 w-4" />
                      <span>{clientProfile?.nome || 'Usuário'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full"
                    >
                      {isLoggingOut ? "Saindo..." : "Sair"}
                    </Button>
                  </div>
                ) : (
                  <Link to="/login">
                    <Button variant="ocean" size="sm" className="w-full">
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;