import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonalDataTab } from './PersonalDataTab';
import { EnrollmentsTab } from './EnrollmentsTab';
import { FinanceTab } from './FinanceTab';
import { AttendanceTab } from './AttendanceTab';
import { NotesTab } from './NotesTab';
import { User, GraduationCap, DollarSign, Calendar, FileText } from 'lucide-react';

interface StudentDetails {
  id: string;
  nome_completo: string;
  email: string;
  whatsapp: string;
  cpf: string;
  status: 'ativo' | 'inativo';
  sexo: 'masculino' | 'feminino' | 'outro';
  data_nascimento: string | null;
  endereco_completo: string | null;
  cep: string | null;
  email_confirmed: boolean;
}

interface StudentDetailTabsProps {
  student: StudentDetails;
  onStudentUpdate: () => void;
}

export function StudentDetailTabs({ student, onStudentUpdate }: StudentDetailTabsProps) {
  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="personal" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Dados Pessoais</span>
        </TabsTrigger>
        <TabsTrigger value="enrollments" className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          <span className="hidden sm:inline">Matrículas</span>
        </TabsTrigger>
        <TabsTrigger value="finance" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <span className="hidden sm:inline">Financeiro</span>
        </TabsTrigger>
        <TabsTrigger value="attendance" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Presença</span>
        </TabsTrigger>
        <TabsTrigger value="notes" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Observações</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="personal" className="mt-6">
        <PersonalDataTab student={student} onStudentUpdate={onStudentUpdate} />
      </TabsContent>

      <TabsContent value="enrollments" className="mt-6">
        <EnrollmentsTab studentId={student.id} />
      </TabsContent>

      <TabsContent value="finance" className="mt-6">
        <FinanceTab studentId={student.id} />
      </TabsContent>

      <TabsContent value="attendance" className="mt-6">
        <AttendanceTab studentId={student.id} />
      </TabsContent>

      <TabsContent value="notes" className="mt-6">
        <NotesTab studentId={student.id} />
      </TabsContent>
    </Tabs>
  );
}