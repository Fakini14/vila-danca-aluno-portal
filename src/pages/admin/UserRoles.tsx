import { UserRoleManager } from '@/components/admin/UserRoleManager';

export default function UserRoles() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Funções</h1>
        <p className="text-muted-foreground">
          Promova usuários e gerencie suas funções no sistema
        </p>
      </div>
      
      <UserRoleManager />
    </div>
  );
}