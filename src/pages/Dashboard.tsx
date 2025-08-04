import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirecionar admin para o novo layout
  if (profile?.role === 'admin' || profile?.role === 'funcionario') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Redirecionar professor para o portal do professor
  if (profile?.role === 'professor') {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  // Redirecionar aluno para o novo layout com sidebar
  if (profile?.role === 'aluno') {
    return <Navigate to="/student/dashboard" replace />;
  }

  // Se chegou até aqui, a role não é reconhecida
  return <Navigate to="/auth" replace />;
};

export default Dashboard;