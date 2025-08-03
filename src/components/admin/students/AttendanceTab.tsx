import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CheckCircle, XCircle, Minus, TrendingUp, Users, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AttendanceRecord {
  id: string;
  data_aula: string;
  presente: boolean;
  observacao: string | null;
  enrollment: {
    id: string;
    class: {
      id: string;
      nome: string;
      class_type: {
        nome: string;
        color: string;
      };
    };
  };
}

interface AttendanceStats {
  classId: string;
  className: string;
  classType: string;
  color: string;
  totalClasses: number;
  attendedClasses: number;
  attendanceRate: number;
}

interface AttendanceTabProps {
  studentId: string;
}

export function AttendanceTab({ studentId }: AttendanceTabProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [filterClass, setFilterClass] = useState<string>('all');
  const { toast } = useToast();

  const fetchAttendanceData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get attendance records for the selected month
      const startDate = startOfMonth(new Date(filterMonth));
      const endDate = endOfMonth(new Date(filterMonth));
      
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          enrollments!attendance_enrollment_id_fkey(
            id,
            classes!enrollments_class_id_fkey(
              id,
              nome,
              class_types(
                nome,
                color
              )
            )
          )
        `)
        .eq('student_id', studentId)
        .gte('data_aula', startDate.toISOString())
        .lte('data_aula', endDate.toISOString())
        .order('data_aula', { ascending: false });

      if (attendanceError) throw attendanceError;

      const processedAttendance: AttendanceRecord[] = attendanceData?.map(record => ({
        id: record.id,
        data_aula: record.data_aula,
        presente: record.presente,
        observacao: record.observacao,
        enrollment: {
          id: record.enrollments?.id || '',
          class: {
            id: record.enrollments?.classes?.id || '',
            nome: record.enrollments?.classes?.nome || '',
            class_type: {
              nome: record.enrollments?.classes?.class_types?.nome || '',
              color: record.enrollments?.classes?.class_types?.color || '#6366f1',
            },
          },
        },
      })) || [];

      setAttendanceRecords(processedAttendance);

      // Calculate attendance statistics by class
      const classAttendance = processedAttendance.reduce((acc, record) => {
        const classId = record.enrollment.class.id;
        if (!acc[classId]) {
          acc[classId] = {
            classId,
            className: record.enrollment.class.nome,
            classType: record.enrollment.class.class_type.nome,
            color: record.enrollment.class.class_type.color,
            totalClasses: 0,
            attendedClasses: 0,
            attendanceRate: 0,
          };
        }
        
        acc[classId].totalClasses++;
        if (record.presente) {
          acc[classId].attendedClasses++;
        }
        
        return acc;
      }, {} as Record<string, AttendanceStats>);

      // Calculate attendance rates
      const statsArray = Object.values(classAttendance).map(stat => ({
        ...stat,
        attendanceRate: stat.totalClasses > 0 ? (stat.attendedClasses / stat.totalClasses) * 100 : 0,
      }));

      setAttendanceStats(statsArray);
    } catch (error) {
      console.error('Erro ao buscar dados de presença:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de presença',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [studentId, filterMonth, toast]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const getAttendanceIcon = (presente: boolean) => {
    return presente ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getAttendanceVariant = (presente: boolean) => {
    return presente ? 'default' : 'destructive';
  };

  const getAttendanceLabel = (presente: boolean) => {
    return presente ? 'Presente' : 'Ausente';
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesClass = filterClass === 'all' || record.enrollment.class.id === filterClass;
    return matchesClass;
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatDateWithDay = (dateString: string) => {
    return format(new Date(dateString), "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  // Get unique classes for filter
  const availableClasses = Array.from(new Set(attendanceRecords.map(r => r.enrollment.class.id)))
    .map(classId => {
      const record = attendanceRecords.find(r => r.enrollment.class.id === classId);
      return record ? {
        id: classId,
        name: record.enrollment.class.nome,
        type: record.enrollment.class.class_type.nome,
      } : null;
    })
    .filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const totalClasses = attendanceRecords.length;
  const totalPresent = attendanceRecords.filter(r => r.presente).length;
  const overallAttendanceRate = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Aulas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presenças</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPresent}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faltas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalClasses - totalPresent}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getAttendanceRateColor(overallAttendanceRate)}`}>
              {overallAttendanceRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance by Class */}
      {attendanceStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Presença por Turma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendanceStats.map((stat) => (
                <div key={stat.classId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stat.color }}
                    />
                    <div>
                      <p className="font-medium">{stat.className}</p>
                      <p className="text-sm text-muted-foreground">{stat.classType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getAttendanceRateColor(stat.attendanceRate)}`}>
                      {stat.attendanceRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stat.attendedClasses}/{stat.totalClasses} aulas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por mês" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const date = subMonths(new Date(), i);
              const value = format(date, 'yyyy-MM');
              const label = format(date, 'MMMM yyyy', { locale: ptBR });
              return (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as turmas</SelectItem>
            {availableClasses.map((cls) => (
              <SelectItem key={cls?.id} value={cls?.id || ''}>
                {cls?.name} ({cls?.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registro de Presença ({filteredRecords.length} aulas)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {filterClass !== 'all' 
                ? 'Nenhum registro de presença encontrado para a turma selecionada'
                : 'Nenhum registro de presença encontrado para este período'
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">Data</th>
                    <th className="p-4 font-medium">Turma</th>
                    <th className="p-4 font-medium">Presença</th>
                    <th className="p-4 font-medium">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{formatDate(record.data_aula)}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {formatDateWithDay(record.data_aula)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: record.enrollment.class.class_type.color }}
                          />
                          <div>
                            <p className="font-medium">{record.enrollment.class.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {record.enrollment.class.class_type.nome}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getAttendanceIcon(record.presente)}
                          <Badge variant={getAttendanceVariant(record.presente)}>
                            {getAttendanceLabel(record.presente)}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">
                          {record.observacao || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}