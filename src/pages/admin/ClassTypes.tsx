import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Check,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClassTypeFormModal } from '@/components/admin/forms/ClassTypeFormModal';
import { useToast } from '@/hooks/use-toast';

interface ClassType {
  id: string;
  name: string;
  color: string;
  description: string | null;
  nivel: 'basico' | 'intermediario' | 'avancado';
  active: boolean;
  created_at: string;
  updated_at: string;
}

const useClassTypes = (searchTerm: string, activeFilter: string) => {
  return useQuery({
    queryKey: ['classTypes', searchTerm, activeFilter],
    queryFn: async (): Promise<ClassType[]> => {
      let query = supabase
        .from('class_types')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (activeFilter !== 'all') {
        query = query.eq('active', activeFilter === 'active');
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
};

export default function ClassTypes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: classTypes, isLoading, error } = useClassTypes(searchTerm, activeFilter);

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('class_types')
        .update({ active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classTypes'] });
      toast({
        title: "Status atualizado",
        description: "O status da modalidade foi atualizado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('class_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classTypes'] });
      toast({
        title: "Modalidade excluída",
        description: "A modalidade foi removida com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir modalidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta modalidade? Esta ação não pode ser desfeita.')) {
      return;
    }
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold dance-text-gradient">Modalidades de Dança</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold dance-text-gradient">Modalidades de Dança</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Erro ao carregar modalidades</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dance-text-gradient">Modalidades de Dança</h1>
          <p className="text-muted-foreground">
            Gerencie os tipos de dança oferecidos pela escola
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Modalidade
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('all')}
              >
                Todas
              </Button>
              <Button
                variant={activeFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('active')}
              >
                Ativas
              </Button>
              <Button
                variant={activeFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('inactive')}
              >
                Inativas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Modalidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classTypes?.map((classType) => (
          <Card key={classType.id} className="dance-shadow hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: classType.color + '20' }}
                  >
                    <Palette className="h-6 w-6" style={{ color: classType.color }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{classType.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {classType.description || 'Sem descrição'}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      {classType.active ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <X className="h-3 w-3 mr-1" />
                          Inativa
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {classType.nivel === 'basico' && 'Básico'}
                        {classType.nivel === 'intermediario' && 'Intermediário'}
                        {classType.nivel === 'avancado' && 'Avançado'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedClassType(classType);
                      setShowForm(true);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => toggleActiveMutation.mutate({ 
                        id: classType.id, 
                        active: !classType.active 
                      })}
                    >
                      {classType.active ? (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Ativar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(classType.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Preview da cor */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Cor da modalidade:</p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-full h-10 rounded-md border"
                      style={{ backgroundColor: classType.color }}
                    />
                    <code className="text-xs px-2 py-1 bg-muted rounded">
                      {classType.color}
                    </code>
                  </div>
                </div>
                
                {/* Data de criação */}
                <div className="text-xs text-muted-foreground">
                  Criada em {new Date(classType.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {classTypes && classTypes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <Palette className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-medium">Nenhuma modalidade encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || activeFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Adicione a primeira modalidade de dança'
                }
              </p>
            </div>
            {!searchTerm && activeFilter === 'all' && (
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Modalidade
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Formulário */}
      <ClassTypeFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedClassType(null);
        }}
        classType={selectedClassType}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['classTypes'] });
          setShowForm(false);
          setSelectedClassType(null);
        }}
      />
    </div>
  );
}