import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Mail, Clock, CheckCircle, RotateCcw } from 'lucide-react';
import { CreateStaffModal } from '@/components/forms/CreateStaffModal';

interface StaffMember {
  id: string;
  nome_completo: string;
  email: string;
  whatsapp: string;
  role: string;
  email_confirmed: boolean;
  email_confirmation_sent_at: string | null;
  created_at: string;
}

export function StaffManager() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchStaff = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'professor', 'funcionario'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Erro ao buscar equipe:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista da equipe',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const resendInvitation = async (staffId: string, email: string) => {
    try {
      const { error } = await supabase.functions.invoke('resend-staff-invitation', {
        body: { staffId, email }
      });

      if (error) throw error;

      toast({
        title: 'Convite reenviado',
        description: `Um novo email de convite foi enviado para ${email}`,
      });

      // Refresh the list
      fetchStaff();
    } catch (error: any) {
      toast({
        title: 'Erro ao reenviar convite',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredStaff = staff.filter(member =>
    member.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'professor': return 'Professor';
      case 'funcionario': return 'Funcionário';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'professor': return 'bg-blue-500';
      case 'funcionario': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão da Equipe</h2>
          <p className="text-muted-foreground">
            Gerencie funcionários, professores e administradores
          </p>
        </div>
        <Button 
          className="dance-gradient"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Membro
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou função..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStaff.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhum membro da equipe encontrado' : 'Nenhum membro da equipe cadastrado'}
                </p>
              </div>
            ) : (
              filteredStaff.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div>
                        <h3 className="font-medium">{member.nome_completo}</h3>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">WhatsApp:</span>
                        <span>{member.whatsapp}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">Cadastro:</span>
                        <span>
                          {new Date(member.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant="secondary" 
                      className={`${getRoleColor(member.role)} text-white`}
                    >
                      {getRoleName(member.role)}
                    </Badge>
                    
                    <div className="flex items-center space-x-2">
                      {member.email_confirmed ? (
                        <Badge variant="default" className="bg-green-500 text-white">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Confirmado
                        </Badge>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-yellow-500 text-white">
                            <Clock className="mr-1 h-3 w-3" />
                            Pendente
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resendInvitation(member.id, member.email)}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Reenviar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CreateStaffModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchStaff}
      />
    </div>
  );
}