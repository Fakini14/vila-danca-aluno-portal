import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Crown, GraduationCap, Briefcase, User, CheckCircle, AlertCircle, UserCog } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast as sonnerToast } from 'sonner';

interface StudentData {
  id: string;
  nome_completo: string;
  email: string;
  role: 'admin' | 'professor' | 'funcionario' | 'aluno';
  email_confirmed: boolean;
}

interface RoleChangeModalProps {
  student: StudentData | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleChanged?: () => void;
}

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

export function RoleChangeModal({ student, isOpen, onOpenChange, onRoleChanged }: RoleChangeModalProps) {
  const { toast } = useToast();
  const [newRole, setNewRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  if (!student) return null;

  const currentRoleIcon = roleIcons[student.role];
  const CurrentRoleIcon = currentRoleIcon;

  const handleRoleChange = (selectedRole: string) => {
    if (selectedRole === student.role) {
      sonnerToast.info('Este usuário já possui este nível de acesso');
      return;
    }

    // Prevent role change for unconfirmed users
    if (!student.email_confirmed) {
      sonnerToast.error('O usuário precisa confirmar o email antes de ter sua função alterada');
      return;
    }
    
    setNewRole(selectedRole);
    setConfirmDialog(true);
  };

  const confirmRoleChange = async () => {
    if (!newRole || !student) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', student.id);

      if (error) throw error;

      sonnerToast.success(`${student.nome_completo} agora é ${roleLabels[newRole as keyof typeof roleLabels]}`);

      // Reset states
      setNewRole('');
      setConfirmDialog(false);
      onOpenChange(false);
      
      // Callback to refresh data
      if (onRoleChanged) {
        onRoleChanged();
      }
    } catch (error) {
      sonnerToast.error(`Erro ao atualizar função: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Alterar Nível de Acesso
            </DialogTitle>
            <DialogDescription>
              Modifique a função do usuário no sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <CurrentRoleIcon className="h-4 w-4" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{student.nome_completo}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {student.email_confirmed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          {student.email_confirmed ? 'Email confirmado' : 'Email não confirmado'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="text-sm text-muted-foreground">{student.email}</div>
                </div>
              </div>
              
              <div className="ml-auto">
                <Badge variant={roleColors[student.role]}>
                  {roleLabels[student.role]}
                </Badge>
              </div>
            </div>

            {/* Email not confirmed warning */}
            {!student.email_confirmed && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-700">
                    <strong>Email não confirmado</strong>
                    <p>O usuário precisa confirmar o email antes de ter sua função alterada.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Nova função:</label>
              <Select
                onValueChange={handleRoleChange}
                disabled={!student.email_confirmed || isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma nova função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aluno" disabled={student.role === 'aluno'}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Aluno
                      {student.role === 'aluno' && <span className="text-muted-foreground">(atual)</span>}
                    </div>
                  </SelectItem>
                  <SelectItem value="professor" disabled={student.role === 'professor'}>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Professor
                      {student.role === 'professor' && <span className="text-muted-foreground">(atual)</span>}
                    </div>
                  </SelectItem>
                  <SelectItem value="funcionario" disabled={student.role === 'funcionario'}>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Funcionário
                      {student.role === 'funcionario' && <span className="text-muted-foreground">(atual)</span>}
                    </div>
                  </SelectItem>
                  <SelectItem value="admin" disabled={student.role === 'admin'}>
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Administrador
                      {student.role === 'admin' && <span className="text-muted-foreground">(atual)</span>}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de função</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a alterar a função de <strong>{student.nome_completo}</strong> para{' '}
              <strong>{newRole ? roleLabels[newRole as keyof typeof roleLabels] : ''}</strong>.
              <br /><br />
              Esta ação irá alterar as permissões de acesso do usuário no sistema.
              <br /><br />
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}