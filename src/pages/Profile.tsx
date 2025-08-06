
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StudentProfileForm } from '@/components/student/StudentProfileForm';
import { StaffProfileForm } from '@/components/admin/StaffProfileForm';

export default function Profile() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais
          </p>
        </div>

        {profile?.role === 'aluno' ? (
          <StudentProfileForm />
        ) : (
          <StaffProfileForm />
        )}
      </div>
    </Layout>
  );
}
