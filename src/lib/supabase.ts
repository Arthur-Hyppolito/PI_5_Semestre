import { createClient, Session, User } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variáveis de ambiente do Supabase não configuradas. Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no arquivo .env"
  );
}

// ✅ SUGESTÃO: Adicionar singleton pattern para evitar múltiplas instâncias
let supabaseInstance: SupabaseClient | null = null;

export const supabase =
  supabaseInstance || createClient(supabaseUrl, supabaseAnonKey);
supabaseInstance = supabase;

// Tipos para autenticação
export type AuthUser = {
  id: string;
  email: string;
  created_at: string;
};

// Tipo para endereço
export type Endereco = {
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  pais?: string;
};

// Tipo para preferências
export type Preferencias = {
  notificacoes_email?: boolean;
  notificacoes_sms?: boolean;
  tema?: "light" | "dark" | "auto";
  idioma?: string;
  newsletter?: boolean;
};

// Tipo para cliente
export type Cliente = {
  id: string;
  auth_user_id: string;
  nome: string;
  sobrenome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  genero?: string;
  endereco?: Endereco;
  preferencias?: Preferencias;
  tipo_usuario: "cliente" | "admin";
  ativo: boolean;
  foto_perfil?: string;
  created_at: string;
  updated_at: string;
};

// Funções de autenticação
export const auth = {
  // Login com email e senha
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Registro de novo usuário
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // Sistema de logout completo
  performLogout: async () => {
    try {
      // 1. Fazer logout no Supabase
      const { error } = await supabase.auth.signOut({
        scope: "global", // Remove sessão de todos os dispositivos
      });

      if (error) {
        console.error("Erro no logout do Supabase:", error);
        return {
          success: false,
          error: error.message || "Erro ao fazer logout",
        };
      }

      // 2. Limpar apenas chaves específicas do Supabase no localStorage
      try {
        // Lista de chaves relacionadas ao Supabase que devem ser removidas
        const supabaseKeys = [
          "supabase.auth.token",
          `sb-${supabaseUrl.split("//")[1]}-auth-token`,
          `sb-${supabaseUrl.split("//")[1]}-auth-token-code-verifier`,
        ];

        // Remover chaves específicas do Supabase
        supabaseKeys.forEach((key) => {
          try {
            localStorage.removeItem(key);
          } catch (err) {
            console.warn(`Erro ao remover chave ${key}:`, err);
          }
        });

        // Remover todas as chaves que começam com 'sb-' (padrão Supabase)
        // 🆕 IMPORTANTE: Preservar carrinho e outros dados do app
        Object.keys(localStorage).forEach((key) => {
          if (
            (key.startsWith("sb-") || key.includes("supabase")) &&
            !key.includes("wavecraft-cart") && // ✅ Preserva carrinho
            !key.includes("wavesurf-cart") && // ✅ Preserva carrinho (nome alternativo)
            !key.endsWith("-last-update")
          ) {
            // ✅ Preserva timestamps do carrinho
            try {
              localStorage.removeItem(key);
            } catch (err) {
              console.warn(`Erro ao remover chave ${key}:`, err);
            }
          }
        });
      } catch (storageError) {
        console.warn("Erro ao limpar localStorage:", storageError);
      }

      // 3. Limpar apenas chaves específicas do sessionStorage
      try {
        // Remover apenas chaves relacionadas ao Supabase
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("sb-") || key.includes("supabase")) {
            try {
              sessionStorage.removeItem(key);
            } catch (err) {
              console.warn(`Erro ao remover chave ${key}:`, err);
            }
          }
        });
      } catch (sessionError) {
        console.warn("Erro ao limpar sessionStorage:", sessionError);
      }

      return {
        success: true,
        message: "Logout realizado com sucesso",
      };
    } catch (error) {
      console.error("Erro inesperado no logout:", error);
      return {
        success: false,
        error: "Erro inesperado durante o logout",
      };
    }
  },

  // Obter usuário atual
  getCurrentUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  // Escutar mudanças de autenticação
  onAuthStateChange: (
    callback: (event: string, session: Session | null) => void
  ) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Buscar perfil do cliente
  getClientProfile: async (userId: string) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), 3000);
    });

    const queryPromise = supabase
      .from("clientes")
      .select("*")
      .eq("auth_user_id", userId)
      .single();

    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);
      return result;
    } catch (err) {
      // Retornar dados básicos como fallback
      return {
        data: {
          nome: "Cliente",
          sobrenome: "",
          email: "",
        },
        error: null,
      };
    }
  },

  // Verificar se usuário é admin
  isAdmin: async (userId: string) => {
    const { data, error } = await supabase
      .from("clientes")
      .select("tipo_usuario")
      .eq("auth_user_id", userId)
      .single();

    if (error || !data) return false;
    return data.tipo_usuario === "admin";
  },
};

// Exportar função getClientProfile separadamente para compatibilidade
export const getClientProfile = auth.getClientProfile;
