import { useAuth } from "@/hooks/useAuth";

export function Checkout() {
  const { ensureValidSession, isTokenExpiringSoon } = useAuth();

  // ...existing code...

  const handleFinalizarPedido = async () => {
    try {
      // ✅ CRÍTICO: Verificar sessão antes de checkout
      const isSessionValid = await ensureValidSession();

      if (!isSessionValid) {
        toast({
          title: "Sessão expirada",
          description:
            "Sua sessão expirou. Faça login novamente para finalizar o pedido.",
          variant: "destructive",
        });
        // Redirecionar para login mantendo carrinho
        router.push("/login?redirect=/checkout");
        return;
      }

      // Aviso se token está expirando
      if (isTokenExpiringSoon) {
        console.warn("⚠️ Token renovado automaticamente antes do checkout");
      }

      // ...existing code... (processar checkout)
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);

      // Tratamento específico para erro de JWT
      if (error instanceof Error && error.message.includes("JWT")) {
        toast({
          title: "Sessão expirada durante checkout",
          description: "Faça login novamente. Seu carrinho foi preservado.",
          variant: "destructive",
        });
        router.push("/login?redirect=/checkout");
        return;
      }

      toast({
        title: "Erro ao finalizar pedido",
        description: "Não foi possível processar seu pedido. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // ...existing code...
}
