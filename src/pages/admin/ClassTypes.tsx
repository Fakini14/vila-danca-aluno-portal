import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Palette, 
  Plus, 
  Edit, 
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { ClassTypeFormModal } from '@/components/admin/forms/ClassTypeFormModal';
import { useToast } from '@/hooks/use-toast';

interface ClassType {
  id: string;
  name: string;
  color: string;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const useClassTypes = () => {
  return useQuery({
    queryKey: ['classTypes'],
    queryFn: async (): Promise<ClassType[]> => {
      const { data, error } = await supabase
        .from('class_types')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
};

export default function ClassTypes() {
  const [showForm, setShowForm] = useState(false);
  const [selectedClassType, setSelectedClassType] = useState<ClassType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: classTypes, isLoading, error } = useClassTypes();


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
    onError: (error: Error) => {
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

  const handleBack = () => {
    navigate('/admin/classes');
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Modalidade
          </Button>
        </div>
      </div>

      {/* Lista de Modalidades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modalidades</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {classTypes && classTypes.length > 0 ? (
            <div className="divide-y">
              {classTypes.map((classType) => (
                <div key={classType.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Círculo colorido */}
                    <div 
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: classType.color }}
                    />
                    {/* Nome da modalidade */}
                    <span className="font-medium">{classType.name}</span>
                  </div>
                  
                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedClassType(classType);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(classType.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Palette className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-medium">Nenhuma modalidade encontrada</h3>
                <p className="text-muted-foreground">
                  Adicione a primeira modalidade de dança
                </p>
              </div>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Modalidade
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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