import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
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
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se o usuário está autenticado mas não tem profile, mostrar loading
  // Isso evita redirecionamentos prematuros
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Redirecionar baseado na role
  switch (profile.role) {
    case 'admin':
    case 'funcionario':
      return <Navigate to="/admin/dashboard" replace />;
    case 'professor':
      return <Navigate to="/teacher/dashboard" replace />;
    case 'aluno':
      return <Navigate to="/student/dashboard" replace />;
    default:
      // Se a role não é reconhecida, mostrar mensagem de erro
      console.error('Role não reconhecida:', profile.role);
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Erro de Permissão</h1>
            <p className="text-muted-foreground">
              Sua conta não tem uma função válida atribuída. 
              Entre em contato com o administrador.
            </p>
          </div>
        </div>
      );
  }
};

export default Dashboard;