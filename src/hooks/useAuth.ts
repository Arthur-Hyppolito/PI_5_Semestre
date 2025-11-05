import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "./use-toast";

interface UseAuthReturn {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isTokenExpiringSoon: boolean;
  refreshSession: () => Promise<boolean>;
  ensureValidSession: () => Promise<boolean>;
}

/**
 * Hook customizado para gerenciar autenticação com refresh automático de token
 */
export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenExpiringSoon, setIsTokenExpiringSoon] = useState(false);
  const { toast } = useToast();

  /**
   * Verifica se o token está próximo de expirar (dentro de 5 minutos)
   */
  const checkTokenExpiration = useCallback(
    (currentSession: Session | null): boolean => {
      if (!currentSession?.expires_at) return false;

      const expiresAt = currentSession.expires_at * 1000; // Converter para ms
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      return expiresAt - now < fiveMinutes;
    },
    []
  );

  /**
   * Refresh manual da sessão
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Erro ao renovar sessão:", error);
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return false;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsTokenExpiringSoon(false);
        console.log("✅ Sessão renovada com sucesso");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Erro inesperado ao renovar sessão:", error);
      return false;
    }
  }, [toast]);

  /**
   * Garante que a sessão está válida antes de operação crítica
   * Se token estiver expirando ou expirado, renova automaticamente
   */
  const ensureValidSession = useCallback(async (): Promise<boolean> => {
    try {
      // 1. Obter sessão atual
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Erro ao obter sessão:", error);
        return false;
      }

      // 2. Se não há sessão, retorna false
      if (!currentSession) {
        toast({
          title: "Sessão não encontrada",
          description: "Faça login para continuar.",
          variant: "destructive",
        });
        return false;
      }

      // 3. Verificar se token está expirado ou expirando
      const isExpiringSoon = checkTokenExpiration(currentSession);

      if (isExpiringSoon) {
        console.warn("⚠️ Token expirando em breve, renovando...");
        return await refreshSession();
      }

      // 4. Sessão válida
      return true;
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      return false;
    }
  }, [checkTokenExpiration, refreshSession, toast]);

  /**
   * Carrega sessão inicial e configura listener
   */
  useEffect(() => {
    // Carregar sessão inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsTokenExpiringSoon(checkTokenExpiration(initialSession));
      setIsLoading(false);
    });

    // Listener de mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsTokenExpiringSoon(checkTokenExpiration(currentSession));
    });

    return () => subscription.unsubscribe();
  }, [checkTokenExpiration]);

  /**
   * Timer para verificar expiração do token a cada 1 minuto
   */
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const expiring = checkTokenExpiration(session);
      setIsTokenExpiringSoon(expiring);

      if (expiring) {
        console.warn("⚠️ Token expirando em breve");
      }
    }, 60 * 1000); // Verifica a cada 1 minuto

    return () => clearInterval(interval);
  }, [session, checkTokenExpiration]);

  return {
    session,
    user,
    isLoading,
    isTokenExpiringSoon,
    refreshSession,
    ensureValidSession,
  };
}
