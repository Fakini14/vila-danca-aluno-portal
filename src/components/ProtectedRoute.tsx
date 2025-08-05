import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type Props = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, profile, loading } = useAuth();
  
  // Sempre mostrar loading enquanto estiver carregando
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Se não há usuário autenticado, redirecionar para auth
  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }
  
  // Se o usuário não tem a role permitida
  if (!allowedRoles.includes(profile.role)) {
    // Evitar loop - não redirecionar para /dashboard se já veio de lá
    // Em vez disso, mostrar uma página de acesso negado
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar esta página.
          </p>
          <a 
            href="/dashboard" 
            className="text-primary hover:underline"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}