import { StudentList } from '@/components/admin/students/StudentList';

export default function Students() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dance-text-gradient">
          Gestão de Alunos
        </h1>
        <p className="text-muted-foreground">
          Gerencie todos os alunos matriculados na escola
        </p>
      </div>
      <StudentList />
    </div>
  );
}