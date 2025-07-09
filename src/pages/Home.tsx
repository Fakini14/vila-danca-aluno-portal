import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Clock, Calendar, Users, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ClassData {
  id: string;
  modalidade: string;
  nivel: string;
  tipo: string;
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
  valor_aula: number;
  valor_matricula: number | null;
}

export default function Home() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveClasses = async () => {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('ativa', true)
          .order('modalidade');

        if (error) {
          console.error('Erro ao buscar turmas:', error);
        } else {
          setClasses(data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar turmas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveClasses();
  }, []);

  const formatDaysOfWeek = (days: string[]) => {
    const dayNames: { [key: string]: string } = {
      'segunda': 'Seg',
      'terca': 'Ter',
      'quarta': 'Qua',
      'quinta': 'Qui',
      'sexta': 'Sex',
      'sabado': 'Sab',
      'domingo': 'Dom'
    };
    
    return days.map(day => dayNames[day] || day).join(', ');
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'basico':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediario':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'avancado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold dance-text-gradient">
                  Espaço Vila Dança & Arte
                </h1>
                <p className="text-sm text-muted-foreground">
                  Descubra sua paixão pela dança
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" asChild>
                <Link to="/auth">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
              <Button asChild>
                <Link to="/auth">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastre-se
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4 dance-text-gradient">
            Transforme sua vida através da dança
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Oferecemos uma variedade de modalidades de dança para todos os níveis. 
            Venha fazer parte da nossa família!
          </p>
          <Button size="lg" asChild>
            <Link to="/auth">
              Comece Agora
            </Link>
          </Button>
        </div>
      </section>

      {/* Classes Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold mb-4">Nossas Turmas Ativas</h3>
            <p className="text-muted-foreground">
              Conheça as modalidades disponíveis e encontre a perfeita para você
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">Nenhuma turma ativa no momento</h4>
              <p className="text-muted-foreground">
                Entre em contato conosco para mais informações sobre próximas turmas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((classItem) => (
                <Card key={classItem.id} className="dance-shadow hover:scale-105 transition-transform duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{classItem.modalidade}</CardTitle>
                      <Badge className={getNivelColor(classItem.nivel)}>
                        {classItem.nivel.charAt(0).toUpperCase() + classItem.nivel.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{classItem.tipo}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDaysOfWeek(classItem.dias_semana)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatTime(classItem.horario_inicio)} - {formatTime(classItem.horario_fim)}
                      </span>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Valor da aula:</span>
                        <span className="font-bold text-primary">
                          {formatPrice(classItem.valor_aula)}
                        </span>
                      </div>
                      {classItem.valor_matricula && classItem.valor_matricula > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Matrícula:</span>
                          <span className="font-bold text-primary">
                            {formatPrice(classItem.valor_matricula)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Button size="lg" asChild>
              <Link to="/auth">
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastre-se como Aluno
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2024 Espaço Vila Dança & Arte. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}