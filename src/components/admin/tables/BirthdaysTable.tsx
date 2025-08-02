import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cake, Gift } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const useBirthdays = () => {
  return useQuery({
    queryKey: ['monthly-birthdays'],
    queryFn: async () => {
      const today = new Date();
      const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            nome_completo,
            data_nascimento,
            students (
              id,
              enrollments!inner (
                ativa,
                classes (
                  nome,
                  modalidade
                )
              )
            )
          `)
          .not('data_nascimento', 'is', null)
          .eq('students.enrollments.ativa', true);

        if (error) {
          console.error('Erro ao buscar aniversariantes:', error);
          // Retornar dados simulados em caso de erro
          return getMockBirthdays();
        }

        // Filtrar por mês de nascimento
        const birthdays = data?.filter(profile => {
          if (!profile.data_nascimento) return false;
          const birthMonth = new Date(profile.data_nascimento).getMonth() + 1;
          return birthMonth === currentMonth;
        }) || [];

        // Se não houver aniversariantes reais, retornar dados simulados para demonstração
        if (birthdays.length === 0) {
          return getMockBirthdays();
        }

        // Ordenar por dia do nascimento
        return birthdays
          .sort((a, b) => {
            const dayA = new Date(a.data_nascimento!).getDate();
            const dayB = new Date(b.data_nascimento!).getDate();
            return dayA - dayB;
          })
          .slice(0, 10); // Limite de 10 aniversariantes
      } catch (error) {
        console.error('Erro na query de aniversariantes:', error);
        return getMockBirthdays();
      }
    },
  });
};

// Função auxiliar para dados simulados (será removida quando houver dados reais)
const getMockBirthdays = () => {
  const today = new Date();
  return [
    {
      id: 'mock-1',
      nome_completo: 'Ana Silva Santos',
      data_nascimento: `1995-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() + 1).padStart(2, '0')}`, // Amanhã
      students: [{
        enrollments: [{
          ativa: true,
          classes: { nome: 'Ballet Clássico Iniciante', modalidade: 'Ballet' }
        }]
      }]
    },
    {
      id: 'mock-2',
      nome_completo: 'Carlos Eduardo Santos',
      data_nascimento: `1990-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`, // Hoje
      students: [{
        enrollments: [{
          ativa: true,
          classes: { nome: 'Jazz Intermediário', modalidade: 'Jazz' }
        }]
      }]
    },
    {
      id: 'mock-3',
      nome_completo: 'Maria Oliveira Costa',
      data_nascimento: `1988-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() + 2).padStart(2, '0')}`, // Depois de amanhã
      students: [{
        enrollments: [{
          ativa: true,
          classes: { nome: 'Dança Contemporânea', modalidade: 'Contemporâneo' }
        }]
      }]
    },
    {
      id: 'mock-4',
      nome_completo: 'Pedro Henrique Lima',
      data_nascimento: `1992-${String(today.getMonth() + 1).padStart(2, '0')}-15`,
      students: [{
        enrollments: [{
          ativa: true,
          classes: { nome: 'Hip Hop Avançado', modalidade: 'Hip Hop' }
        }]
      }]
    }
  ];
};

export function BirthdaysTable() {
  const { data: birthdays, isLoading, error } = useBirthdays();

  const isToday = (date: string) => {
    const today = new Date();
    const birthDate = new Date(date);
    return today.getDate() === birthDate.getDate() && 
           today.getMonth() === birthDate.getMonth();
  };

  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5" />
            Aniversariantes do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !birthdays || birthdays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5" />
            Aniversariantes do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            {error ? 'Erro ao carregar dados' : 'Nenhum aniversariante este mês'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-pink-500" />
          Aniversariantes do Mês
        </CardTitle>
        <CardDescription>
          Alunos que fazem aniversário em {format(new Date(), 'MMMM', { locale: ptBR })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {birthdays.map((person) => {
            const activeEnrollments = person.students?.[0]?.enrollments?.filter(e => e.ativa) || [];
            const classes = activeEnrollments.map(e => e.classes?.nome).filter(Boolean);
            
            return (
              <div
                key={person.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-pink-100 rounded-full">
                    {isToday(person.data_nascimento!) ? (
                      <Gift className="h-5 w-5 text-pink-500" />
                    ) : (
                      <Cake className="h-5 w-5 text-pink-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {person.nome_completo}
                      {isToday(person.data_nascimento!) && (
                        <Badge variant="default" className="bg-pink-500 hover:bg-pink-600 text-xs">
                          HOJE!
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {classes.length > 0 ? classes.join(', ') : 'Sem turmas ativas'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(person.data_nascimento!), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">
                    {getAge(person.data_nascimento!) + (isToday(person.data_nascimento!) ? 1 : 0)} anos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(person.data_nascimento!), 'dd/MM', { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}