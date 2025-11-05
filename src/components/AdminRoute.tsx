import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { auth } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Waves } from 'lucide-react'

interface AdminRouteProps {
  children: React.ReactNode
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const [isChecking, setIsChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Verificar se usuário está autenticado
        const { user, error } = await auth.getCurrentUser()
        
        if (error || !user) {
          setIsAuthenticated(false)
          setIsChecking(false)
          return
        }

        setIsAuthenticated(true)

        // Verificar se é admin
        const isUserAdmin = await auth.isAdmin(user.id)
        
        if (!isUserAdmin) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar esta área administrativa.",
            variant: "destructive",
          })
          setIsAdmin(false)
        } else {
          setIsAdmin(true)
        }
      } catch (error) {
        console.error('Erro ao verificar permissões:', error)
        setIsAuthenticated(false)
        setIsAdmin(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAdminAccess()
  }, [toast])

  // Mostrar loading enquanto verifica
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Waves className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Redirecionar para login se não estiver autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Redirecionar para home se não for admin
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  // Renderizar conteúdo protegido se for admin
  return <>{children}</>
}

export default AdminRoute
