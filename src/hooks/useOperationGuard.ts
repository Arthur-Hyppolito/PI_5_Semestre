import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "./use-toast";

interface PendingOperation {
  id: string;
  name: string;
  abortController: AbortController;
  startedAt: number;
}

/**
 * Hook para proteger operações contra logout inesperado
 * Cancela operações pendentes e previne perda de dados
 */
export function useOperationGuard() {
  const { toast } = useToast();
  const pendingOperations = useRef<Map<string, PendingOperation>>(new Map());
  const [hasPendingOperations, setHasPendingOperations] = useState(false);

  /**
   * Registra uma nova operação
   */
  const startOperation = useCallback((name: string): string => {
    const id = `${name}-${Date.now()}-${Math.random()}`;
    const abortController = new AbortController();

    pendingOperations.current.set(id, {
      id,
      name,
      abortController,
      startedAt: Date.now(),
    });

    setHasPendingOperations(pendingOperations.current.size > 0);
    console.log(`🔵 Operação iniciada: ${name} (${id})`);

    return id;
  }, []);

  /**
   * Finaliza uma operação
   */
  const endOperation = useCallback((operationId: string) => {
    const operation = pendingOperations.current.get(operationId);

    if (operation) {
      const duration = Date.now() - operation.startedAt;
      console.log(`✅ Operação finalizada: ${operation.name} (${duration}ms)`);
      pendingOperations.current.delete(operationId);
      setHasPendingOperations(pendingOperations.current.size > 0);
    }
  }, []);

  /**
   * Cancela uma operação específica
   */
  const cancelOperation = useCallback(
    (operationId: string, reason: string = "Usuário cancelou") => {
      const operation = pendingOperations.current.get(operationId);

      if (operation) {
        operation.abortController.abort(reason);
        console.warn(`⚠️ Operação cancelada: ${operation.name} (${reason})`);
        pendingOperations.current.delete(operationId);
        setHasPendingOperations(pendingOperations.current.size > 0);
      }
    },
    []
  );

  /**
   * Cancela todas as operações pendentes
   */
  const cancelAllOperations = useCallback(
    (reason: string = "Logout do usuário") => {
      const count = pendingOperations.current.size;

      if (count > 0) {
        console.warn(`⚠️ Cancelando ${count} operações pendentes...`);

        pendingOperations.current.forEach((operation) => {
          operation.abortController.abort(reason);
          console.warn(`  ❌ ${operation.name} cancelada`);
        });

        pendingOperations.current.clear();
        setHasPendingOperations(false);

        toast({
          title: "Operações canceladas",
          description: `${count} operação(ões) em andamento foram canceladas pelo logout.`,
          variant: "default",
        });
      }
    },
    [toast]
  );

  /**
   * Obtém AbortSignal para uma operação
   */
  const getAbortSignal = useCallback(
    (operationId: string): AbortSignal | undefined => {
      return pendingOperations.current.get(operationId)?.abortController.signal;
    },
    []
  );

  /**
   * Verifica se pode fazer logout
   */
  const canLogout = useCallback((): boolean => {
    const count = pendingOperations.current.size;

    if (count > 0) {
      const operations = Array.from(pendingOperations.current.values())
        .map((op) => op.name)
        .join(", ");

      console.warn(`⚠️ ${count} operação(ões) em andamento: ${operations}`);
      return false;
    }

    return true;
  }, []);

  /**
   * Monitora auth state e cancela operações em logout
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        console.warn("🚪 Logout detectado, cancelando operações pendentes...");
        cancelAllOperations("Logout do usuário");
      }

      if (event === "TOKEN_REFRESHED") {
        console.log("🔄 Token renovado, operações continuam");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [cancelAllOperations]);

  /**
   * Cleanup ao desmontar componente
   */
  useEffect(() => {
    return () => {
      if (pendingOperations.current.size > 0) {
        console.warn(
          "⚠️ Componente desmontado com operações pendentes, cancelando..."
        );
        cancelAllOperations("Componente desmontado");
      }
    };
  }, [cancelAllOperations]);

  return {
    startOperation,
    endOperation,
    cancelOperation,
    cancelAllOperations,
    getAbortSignal,
    canLogout,
    hasPendingOperations,
    pendingCount: pendingOperations.current.size,
  };
}
