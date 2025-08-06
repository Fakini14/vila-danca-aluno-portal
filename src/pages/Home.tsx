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

  const handleLoginRedirect = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

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
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 dance-shadow">
                <Music className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold dance-text-gradient">
                  Espaço Vila Dança & Arte
                </h1>
                <p className="text-sm text-muted-foreground">
                  Descubra sua paixão pela dança
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={handleLoginRedirect} className="dance-gradient hover:scale-105 transition-transform">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-80 h-80 bg-primary/15 rounded-full blur-3xl opacity-25 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/8 rounded-full blur-3xl opacity-35 animate-pulse delay-1000"></div>
        
        <div className="relative container mx-auto px-6 text-center">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-bold mb-8 dance-text-gradient leading-tight tracking-tight">
              Transforme sua vida através da dança
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              Oferecemos uma variedade de modalidades de dança para todos os níveis. 
              Descubra a magia do movimento em um ambiente acolhedor e profissional!
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button size="lg" onClick={handleLoginRedirect} className="dance-gradient hover:scale-105 transition-all duration-300 text-lg px-10 py-7 dance-shadow rounded-xl">
                <LogIn className="h-5 w-5 mr-3" />
                Acessar Portal
              </Button>
              <Button variant="outline" size="lg" asChild className="text-lg px-10 py-7 hover:bg-primary/10 transition-all duration-300 rounded-xl border-2">
                <Link to="#turmas">
                  Ver Turmas Disponíveis
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Classes Section */}
      <section id="turmas" className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h3 className="text-4xl md:text-6xl font-bold mb-8 dance-text-gradient tracking-tight">Nossas Turmas Ativas</h3>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
              Conheça as modalidades disponíveis e encontre a perfeita para você. 
              Cada turma é cuidadosamente preparada para proporcionar a melhor experiência.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-muted/50 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Calendar className="h-10 w-10 text-muted-foreground" />
              </div>
              <h4 className="text-2xl font-medium mb-4">Nenhuma turma ativa no momento</h4>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Entre em contato conosco para mais informações sobre próximas turmas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {classes.map((classItem) => (
                <Card key={classItem.id} className="group relative overflow-hidden border-0 dance-shadow hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 bg-gradient-to-br from-card to-card/80 rounded-2xl">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-300">
                        {classItem.modalidade}
                      </CardTitle>
                      <Badge className={`${getNivelColor(classItem.nivel)} font-medium px-3 py-1`}>
                        {classItem.nivel.charAt(0).toUpperCase() + classItem.nivel.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center space-x-2 text-base">
                      <Users className="h-4 w-4" />
                      <span>{classItem.tipo}</span>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="relative space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{formatDaysOfWeek(classItem.dias_semana)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">
                          {formatTime(classItem.horario_inicio)} - {formatTime(classItem.horario_fim)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-muted-foreground">Valor da aula:</span>
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(classItem.valor_aula)}
                          </span>
                        </div>
                        {classItem.valor_matricula && classItem.valor_matricula > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-muted-foreground">Matrícula:</span>
                            <span className="text-lg font-bold text-primary">
                              {formatPrice(classItem.valor_matricula)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-16">
            <div className="max-w-lg mx-auto">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <h4 className="text-2xl font-bold mb-4 dance-text-gradient">
                  Interessado em se inscrever?
                </h4>
                <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                  Entre em contato conosco para mais informações sobre matrículas, horários e valores. Nossa equipe está pronta para ajudar você a encontrar a modalidade perfeita!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" size="lg" className="text-lg px-6 py-3">
                    <span className="font-medium">📞 Contato</span>
                  </Button>
                  <Button variant="outline" size="lg" className="text-lg px-6 py-3">
                    <span className="font-medium">📧 WhatsApp</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-t from-muted/50 to-background py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 dance-shadow">
                <Music className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h4 className="text-xl font-bold dance-text-gradient mb-2">
              Espaço Vila Dança & Arte
            </h4>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Transformando vidas através da dança há anos. Venha fazer parte da nossa família!
            </p>
            <div className="border-t border-border/50 pt-6">
              <p className="text-sm text-muted-foreground">
                © 2024 Espaço Vila Dança & Arte. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}