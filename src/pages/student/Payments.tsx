import { StudentPayments } from '@/components/student/StudentPayments';

export default function StudentPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pagamentos</h1>
        <p className="text-muted-foreground">
          Acompanhe seus pagamentos e mantenha sua conta em dia.
        </p>
      </div>
      <StudentPayments />
    </div>
  );
}