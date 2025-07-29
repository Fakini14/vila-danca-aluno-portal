import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Download,
  FileText,
  PieChart,
  Activity,
  Target,
  Award,
  Clock,
  BookOpen
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data for reports
const mockReportData = {
  performance: {
    totalClasses: 85,
    attendanceRate: 87.5,
    averageStudents: 9.2,
    satisfaction: 4.7,
    retention: 92.3
  },
  monthlyData: [
    { month: 'Jan', classes: 16, students: 8, attendance: 85 },
    { month: 'Fev', classes: 18, students: 9, attendance: 88 },
    { month: 'Mar', classes: 20, students: 10, attendance: 90 },
    { month: 'Abr', classes: 19, students: 9, attendance: 87 },
    { month: 'Mai', classes: 17, students: 8, attendance: 83 },
    { month: 'Jun', classes: 21, students: 11, attendance: 92 },
    { month: 'Jul', classes: 19, students: 10, attendance: 89 }
  ],
  classesByModality: [
    { modality: 'Ballet', classes: 35, percentage: 41.2 },
    { modality: 'Jazz', classes: 28, percentage: 32.9 },
    { modality: 'Contemporâneo', classes: 22, percentage: 25.9 }
  ],
  topStudents: [
    { name: 'Ana Silva', attendance: 98, classes: 'Ballet, Jazz' },
    { name: 'Carlos Santos', attendance: 95, classes: 'Contemporâneo' },
    { name: 'Maria Oliveira', attendance: 92, classes: 'Ballet' },
    { name: 'Pedro Lima', attendance: 90, classes: 'Jazz' }
  ]
};

export default function TeacherReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('7months');
  const [selectedReport, setSelectedReport] = useState('performance');

  const periodOptions = [
    { value: '1month', label: 'Último mês' },
    { value: '3months', label: 'Últimos 3 meses' },
    { value: '6months', label: 'Últimos 6 meses' },
    { value: '7months', label: 'Últimos 7 meses' },
    { value: '1year', label: 'Último ano' }
  ];

  const reportOptions = [
    { value: 'performance', label: 'Performance Geral' },
    { value: 'attendance', label: 'Frequência dos Alunos' },
    { value: 'classes', label: 'Análise de Turmas' },
    { value: 'earnings', label: 'Relatório Financeiro' }
  ];

  const getPerformanceColor = (value: number, type: 'percentage' | 'rating') => {
    if (type === 'percentage') {
      if (value >= 90) return 'text-green-600';
      if (value >= 75) return 'text-blue-600';
      if (value >= 60) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value >= 4.5) return 'text-green-600';
      if (value >= 4.0) return 'text-blue-600';
      if (value >= 3.5) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dance-text-gradient">Relatórios</h1>
          <p className="text-muted-foreground">
            Analise seu desempenho e estatísticas de ensino
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            Período: {periodOptions.find(p => p.value === selectedPeriod)?.label}
          </Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurações do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Tipo de Relatório</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px]">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores Principais */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{mockReportData.performance.totalClasses}</p>
                <p className="text-xs text-muted-foreground">Aulas Ministradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <div>
                <p className={`text-2xl font-bold ${getPerformanceColor(mockReportData.performance.attendanceRate, 'percentage')}`}>
                  {mockReportData.performance.attendanceRate}%
                </p>
                <p className="text-xs text-muted-foreground">Taxa de Presença</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{mockReportData.performance.averageStudents}</p>
                <p className="text-xs text-muted-foreground">Média de Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <div>
                <p className={`text-2xl font-bold ${getPerformanceColor(mockReportData.performance.satisfaction, 'rating')}`}>
                  {mockReportData.performance.satisfaction}
                </p>
                <p className="text-xs text-muted-foreground">Satisfação</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <div>
                <p className={`text-2xl font-bold ${getPerformanceColor(mockReportData.performance.retention, 'percentage')}`}>
                  {mockReportData.performance.retention}%
                </p>
                <p className="text-xs text-muted-foreground">Retenção</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Performance Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Mensal
            </CardTitle>
            <CardDescription>
              Evolução de aulas e frequência ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockReportData.monthlyData.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-sm font-medium">{month.month}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="h-3 w-3" />
                        {month.classes} aulas
                        <Users className="h-3 w-3 ml-2" />
                        {month.students} alunos
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-secondary rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${month.attendance}%`,
                          backgroundColor: 
                            month.attendance >= 90 ? '#22c55e' :
                            month.attendance >= 75 ? '#3b82f6' : '#eab308'
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-10">{month.attendance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Modalidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Aulas por Modalidade
            </CardTitle>
            <CardDescription>
              Distribuição das suas aulas por tipo de dança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockReportData.classesByModality.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{
                        backgroundColor: 
                          index === 0 ? '#3b82f6' :
                          index === 1 ? '#8b5cf6' : '#06b6d4'
                      }}
                    />
                    <span className="font-medium">{item.modality}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.classes} aulas</span>
                    <Badge variant="secondary">{item.percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Total: {mockReportData.classesByModality.reduce((sum, item) => sum + item.classes, 0)} aulas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Top Alunos por Frequência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Melhores Alunos (Frequência)
            </CardTitle>
            <CardDescription>
              Alunos com maior taxa de presença
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockReportData.topStudents.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.classes}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-secondary rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{
                          width: `${student.attendance}%`,
                          backgroundColor: '#22c55e'
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{student.attendance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resumo de Horários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horários de Pico
            </CardTitle>
            <CardDescription>
              Distribuição das suas aulas por horário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">08:00 - 12:00</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-secondary rounded-full h-2">
                    <div className="w-3/4 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-sm">12 aulas</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">14:00 - 18:00</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-secondary rounded-full h-2">
                    <div className="w-full h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-sm">25 aulas</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">18:00 - 22:00</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-secondary rounded-full h-2">
                    <div className="w-2/3 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                  <span className="text-sm">18 aulas</span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <strong>Horário mais produtivo:</strong> 14:00 - 18:00 com 25 aulas ministradas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Insights e Recomendações
          </CardTitle>
          <CardDescription>
            Análises baseadas no seu desempenho
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Ponto Forte</span>
              </div>
              <p className="text-sm text-green-800">
                Sua taxa de retenção de alunos (92.3%) está excelente! Continue mantendo o engajamento alto nas suas aulas.
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Oportunidade</span>
              </div>
              <p className="text-sm text-blue-800">
                Considere expandir suas aulas de Jazz - há alta demanda e você tem ótima avaliação nesta modalidade.
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-900">Sugestão</span>
              </div>
              <p className="text-sm text-yellow-800">
                Seus horários vespertinos (14-18h) são os mais produtivos. Considere concentrar mais aulas neste período.
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-900">Meta</span>
              </div>
              <p className="text-sm text-purple-800">
                Para alcançar 90% de frequência média, foque em estratégias de engajamento para as turmas com menor presença.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}