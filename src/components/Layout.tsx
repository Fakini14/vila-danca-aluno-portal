
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Music, LogOut, User, Lock } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      admin: 'Administrador',
      professor: 'Professor',
      funcionario: 'Funcionário',
      aluno: 'Aluno'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleChangePasswordClick = () => {
    navigate('/change-password');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold dance-text-gradient">
                  Espaço Vila Dança & Arte
                </h1>
                <p className="text-xs text-muted-foreground">
                  Sistema de Gestão
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {profile && (
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium">{profile.nome_completo}</p>
                <p className="text-xs text-muted-foreground">
                  {getRoleDisplay(profile.role)}
                </p>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {profile ? getInitials(profile.nome_completo) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {profile && (
                      <>
                        <p className="font-medium">{profile.nome_completo}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getRoleDisplay(profile.role)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleChangePasswordClick}>
                  <Lock className="mr-2 h-4 w-4" />
                  Alterar Senha
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
