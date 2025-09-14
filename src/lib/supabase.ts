import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase não configuradas. Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no arquivo .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para autenticação
export type AuthUser = {
  id: string
  email: string
  created_at: string
}

// Tipo para cliente
export type Cliente = {
  id: string
  auth_user_id: string
  nome: string
  sobrenome: string
  telefone?: string
  data_nascimento?: string
  genero?: string
  endereco?: any
  preferencias?: any
  tipo_usuario: 'cliente' | 'admin'
  ativo: boolean
  created_at: string
  updated_at: string
}

// Funções de autenticação
export const auth = {
  // Login com email e senha
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Registro de novo usuário
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  // Sistema de logout completo
  performLogout: async () => {
    try {
      // 1. Fazer logout no Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'global' // Remove sessão de todos os dispositivos
      })
      
      if (error) {
        console.error('Erro no logout do Supabase:', error)
        return { 
          success: false, 
          error: error.message || 'Erro ao fazer logout' 
        }
      }

      // 2. Limpar localStorage
      try {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('sb-' + supabaseUrl.split('//')[1] + '-auth-token')
        localStorage.clear() // Limpa todo o localStorage por segurança
      } catch (storageError) {
        console.warn('Erro ao limpar localStorage:', storageError)
      }

      // 3. Limpar sessionStorage
      try {
        sessionStorage.clear()
      } catch (sessionError) {
        console.warn('Erro ao limpar sessionStorage:', sessionError)
      }

      return { 
        success: true, 
        message: 'Logout realizado com sucesso' 
      }
    } catch (error) {
      console.error('Erro inesperado no logout:', error)
      return { 
        success: false, 
        error: 'Erro inesperado durante o logout' 
      }
    }
  },

  // Obter usuário atual
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Escutar mudanças de autenticação
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Buscar perfil do cliente
  getClientProfile: async (userId: string) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 3000);
    });
    
    const queryPromise = supabase
      .from('clientes')
      .select('*')
      .eq('auth_user_id', userId)
      .single();
    
    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);
      return result;
    } catch (err) {
      // Retornar dados básicos como fallback
      return { 
        data: { 
          nome: 'Cliente', 
          sobrenome: '', 
          email: '' 
        }, 
        error: null 
      }
    }
  },

  // Verificar se usuário é admin
  isAdmin: async (userId: string) => {
    const { data, error } = await supabase
      .from('clientes')
      .select('tipo_usuario')
      .eq('auth_user_id', userId)
      .single()
    
    if (error || !data) return false
    return data.tipo_usuario === 'admin'
  }
}

// Exportar função getClientProfile separadamente para compatibilidade
export const getClientProfile = auth.getClientProfile
