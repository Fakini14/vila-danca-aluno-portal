import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UserCog, Search, Crown, GraduationCap, Briefcase, User } from 'lucide-react';

interface UserProfile {
  id: string;
  nome_completo: string;
  email: string;
  cpf: string;
  whatsapp: string;
  role: 'admin' | 'professor' | 'funcionario' | 'aluno';
  status: 'ativo' | 'inativo';
  created_at: string;
}

export function UserRoleManager() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [promotionDialog, setPromotionDialog] = useState<{
    isOpen: boolean;
    user: UserProfile | null;
    newRole: string;
  }>({
    isOpen: false,
    user: null,
    newRole: '',
  });

  const roleLabels = {
    admin: 'Administrador',
    professor: 'Professor',
    funcionario: 'Funcionário',
    aluno: 'Aluno',
  };

  const roleIcons = {
    admin: Crown,
    professor: GraduationCap,
    funcionario: Briefcase,
    aluno: User,
  };

  const roleColors = {
    admin: 'destructive',
    professor: 'default',
    funcionario: 'secondary',
    aluno: 'outline',
  } as const;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('nome_completo');

      if (error) throw error;

      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cpf.includes(searchTerm)
      );
    }

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  };

  const handleRoleChange = (user: UserProfile, newRole: string) => {
    setPromotionDialog({
      isOpen: true,
      user,
      newRole,
    });
  };

  const confirmRoleChange = async () => {
    if (!promotionDialog.user || !promotionDialog.newRole) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: promotionDialog.newRole })
        .eq('id', promotionDialog.user.id);

      if (error) throw error;

      toast({
        title: "Função atualizada",
        description: `${promotionDialog.user.nome_completo} agora é ${roleLabels[promotionDialog.newRole as keyof typeof roleLabels]}`,
      });

      // Refresh users list
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar função",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPromotionDialog({
        isOpen: false,
        user: null,
        newRole: '',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Gerenciar Funções de Usuários
          </CardTitle>
          <CardDescription>
            Promova ou altere a função dos usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Buscar usuário</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, email ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="role-filter">Filtrar por função</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  <SelectItem value="aluno">Alunos</SelectItem>
                  <SelectItem value="professor">Professores</SelectItem>
                  <SelectItem value="funcionario">Funcionários</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado
              </div>
            ) : (
              filteredUsers.map((user) => {
                const RoleIcon = roleIcons[user.role];
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <RoleIcon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{user.nome_completo}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge variant={roleColors[user.role]}>
                        {roleLabels[user.role]}
                      </Badge>
                      
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => handleRoleChange(user, newRole)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aluno">Aluno</SelectItem>
                          <SelectItem value="professor">Professor</SelectItem>
                          <SelectItem value="funcionario">Funcionário</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={promotionDialog.isOpen} onOpenChange={(open) => 
        setPromotionDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de função</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a alterar a função de <strong>{promotionDialog.user?.nome_completo}</strong> para{' '}
              <strong>{promotionDialog.newRole ? roleLabels[promotionDialog.newRole as keyof typeof roleLabels] : ''}</strong>.
              <br /><br />
              Esta ação irá mover automaticamente o usuário da tabela atual para a tabela correspondente à nova função.
              <br /><br />
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Confirmar alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}