import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { cn } from '@/lib/utils';
import { 
  Music, 
  LogOut, 
  User, 
  Lock, 
  Menu,
  Home,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  Calendar,
  BarChart3,
  Settings,
  Palette
} from 'lucide-react';

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Users, label: 'Alunos', path: '/admin/students' },
  { icon: GraduationCap, label: 'Professores', path: '/admin/teachers' },
  { icon: Palette, label: 'Modalidades', path: '/admin/class-types' },
  { icon: BookOpen, label: 'Turmas', path: '/admin/classes' },
  { icon: DollarSign, label: 'Financeiro', path: '/admin/finance' },
  { icon: Calendar, label: 'Eventos', path: '/admin/events' },
  { icon: BarChart3, label: 'Relatórios', path: '/admin/reports' },
  { icon: Settings, label: 'Configurações', path: '/admin/settings' },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleChangePasswordClick = () => {
    navigate('/change-password');
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Music className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold dance-text-gradient">
              Vila Dança & Arte
            </h1>
            <p className="text-xs text-muted-foreground">
              Admin Portal
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 pb-4">
        <div className="mb-4">
          <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Menu
          </p>
        </div>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <div key={item.path} className="relative">
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full z-10" />
                )}
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-12 text-left font-medium pl-6",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md border-primary/20" 
                      : "hover:bg-accent hover:text-accent-foreground text-foreground hover:shadow-sm border border-transparent",
                    "transition-all duration-200 cursor-pointer"
                  )}
                  onClick={() => {
                    navigate(item.path);
                    if (mobile) setSidebarOpen(false);
                  }}
                >
                  <Icon className={cn(
                    "h-5 w-5",
                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                  )} />
                  {item.label}
                </Button>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Menu trigger (both mobile and desktop) */}
          <div className="flex items-center space-x-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-accent"
                  title="Menu de navegação"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80 sm:w-96 bg-card shadow-xl border-r-2">
                <SidebarContent mobile />
              </SheetContent>
            </Sheet>

            {/* Logo and title */}
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-bold dance-text-gradient text-lg">
                  Vila Dança & Arte
                </h1>
                <p className="text-xs text-muted-foreground">
                  Painel Administrativo
                </p>
              </div>
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {profile && (
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">{profile.nome_completo}</p>
                <p className="text-xs text-muted-foreground">
                  Administrador
                </p>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {profile ? getInitials(profile.nome_completo) : 'A'}
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
                          Administrador
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

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-card border-r shadow-sm">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
              <AdminBreadcrumb />
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}