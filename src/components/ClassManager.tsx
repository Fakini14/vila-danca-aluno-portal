import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Calendar, Clock, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreateClassModal } from '@/components/forms/CreateClassModal';

interface Class {
  id: string;
  modalidade: string;
  nivel: 'basico' | 'intermediario' | 'avancado';
  tipo: 'regular' | 'workshop' | 'particular' | 'outra';
  data_inicio: string;
  data_termino?: string;
  horario_inicio: string;
  horario_fim: string;
  dias_semana: string[];
  tempo_total_minutos: number;
  valor_aula: number;
  valor_matricula?: number;
  ativa: boolean;
}

export function ClassManager() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchClasses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de turmas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const filteredClasses = classes.filter(cls =>
    cls.modalidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDaysOfWeek = (days: string[]) => {
    const dayMap: { [key: string]: string } = {
      'segunda': 'Seg',
      'terca': 'Ter',
      'quarta': 'Qua',
      'quinta': 'Qui',
      'sexta': 'Sex',
      'sabado': 'Sáb',
      'domingo': 'Dom'
    };
    return days.map(day => dayMap[day] || day).join(', ');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
          <h2 className="text-2xl font-bold">Gestão de Turmas</h2>
          <p className="text-muted-foreground">
            Gerencie as turmas e aulas do sistema
          </p>
        </div>
        <Button 
          className="dance-gradient"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Turma
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por modalidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {filteredClasses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhuma turma encontrada' : 'Nenhuma turma cadastrada'}
                </p>
              </div>
            ) : (
              filteredClasses.map((cls) => (
                <Card key={cls.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{cls.modalidade}</h3>
                          <Badge variant="outline" className="capitalize">
                            {cls.nivel}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">
                            {cls.tipo}
                          </Badge>
                          <Badge variant={cls.ativa ? 'default' : 'secondary'}>
                            {cls.ativa ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(cls.data_inicio).toLocaleDateString('pt-BR')}
                              {cls.data_termino && ` - ${new Date(cls.data_termino).toLocaleDateString('pt-BR')}`}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {cls.horario_inicio} - {cls.horario_fim}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>{formatDaysOfWeek(cls.dias_semana)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-3 text-sm">
                          <span className="font-medium">
                            Aula: {formatCurrency(cls.valor_aula)}
                          </span>
                          {cls.valor_matricula && cls.valor_matricula > 0 && (
                            <span className="font-medium">
                              Matrícula: {formatCurrency(cls.valor_matricula)}
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            {cls.tempo_total_minutos} min
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Ver Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Turma</DialogTitle>
                              <DialogDescription>
                                Informações completas da turma de {cls.modalidade}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Modalidade</Label>
                                  <p className="font-medium">{cls.modalidade}</p>
                                </div>
                                <div>
                                  <Label>Nível</Label>
                                  <p className="font-medium capitalize">{cls.nivel}</p>
                                </div>
                                <div>
                                  <Label>Tipo</Label>
                                  <p className="font-medium capitalize">{cls.tipo}</p>
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <Badge variant={cls.ativa ? 'default' : 'secondary'}>
                                    {cls.ativa ? 'Ativa' : 'Inativa'}
                                  </Badge>
                                </div>
                                <div>
                                  <Label>Data de Início</Label>
                                  <p className="font-medium">
                                    {new Date(cls.data_inicio).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                {cls.data_termino && (
                                  <div>
                                    <Label>Data de Término</Label>
                                    <p className="font-medium">
                                      {new Date(cls.data_termino).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <Label>Horário</Label>
                                  <p className="font-medium">
                                    {cls.horario_inicio} - {cls.horario_fim}
                                  </p>
                                </div>
                                <div>
                                  <Label>Duração</Label>
                                  <p className="font-medium">{cls.tempo_total_minutos} minutos</p>
                                </div>
                                <div>
                                  <Label>Dias da Semana</Label>
                                  <p className="font-medium">{formatDaysOfWeek(cls.dias_semana)}</p>
                                </div>
                                <div>
                                  <Label>Valor da Aula</Label>
                                  <p className="font-medium">{formatCurrency(cls.valor_aula)}</p>
                                </div>
                                {cls.valor_matricula && cls.valor_matricula > 0 && (
                                  <div>
                                    <Label>Valor da Matrícula</Label>
                                    <p className="font-medium">{formatCurrency(cls.valor_matricula)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CreateClassModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchClasses}
      />
    </div>
  );
}