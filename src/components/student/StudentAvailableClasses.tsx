import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Users, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Class {
  id: string;
  modalidade: string;
  nivel: string;
  tipo: string;
  data_inicio: string;
  data_termino: string | null;
  horario_inicio: string;
  horario_fim: string;
  dias_semana: string[];
  valor_aula: number;
  valor_matricula: number;
  ativa: boolean;
}

export function StudentAvailableClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableClasses();
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('ativa', true)
        .order('modalidade', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as turmas disponíveis.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDaysOfWeek = (days: string[]) => {
    const daysMap: { [key: string]: string } = {
      'segunda': 'Seg',
      'terca': 'Ter',
      'quarta': 'Qua',
      'quinta': 'Qui',
      'sexta': 'Sex',
      'sabado': 'Sáb',
      'domingo': 'Dom'
    };
    return days.map(day => daysMap[day] || day).join(', ');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const handleInterestClick = (classItem: Class) => {
    toast({
      title: 'Interesse registrado!',
      description: `Entraremos em contato sobre a turma de ${classItem.modalidade}.`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando turmas disponíveis...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Turmas Disponíveis</h2>
        <p className="text-muted-foreground">
          Descubra novas modalidades e expanda seus conhecimentos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{classItem.modalidade}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="secondary">{classItem.nivel}</Badge>
                    <Badge variant="outline">{classItem.tipo}</Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDaysOfWeek(classItem.dias_semana)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {formatTime(classItem.horario_inicio)} - {formatTime(classItem.horario_fim)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Início: {new Date(classItem.data_inicio).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Valor da aula</div>
                    <div className="font-semibold">{formatCurrency(classItem.valor_aula)}</div>
                  </div>
                  {classItem.valor_matricula > 0 && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Matrícula</div>
                      <div className="font-semibold">{formatCurrency(classItem.valor_matricula)}</div>
                    </div>
                  )}
                </div>
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleInterestClick(classItem)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Tenho Interesse
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma turma disponível no momento.</p>
        </div>
      )}
    </div>
  );
}