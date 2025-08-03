import { StudentAvailableClasses } from '@/components/student/StudentAvailableClasses';

export default function StudentClassesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Turmas</h1>
        <p className="text-muted-foreground">
          Encontre e matricule-se em novas turmas disponíveis.
        </p>
      </div>
      <StudentAvailableClasses />
    </div>
  );
}