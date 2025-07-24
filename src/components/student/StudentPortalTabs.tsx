import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentDashboard } from './StudentDashboard';
import { StudentPayments } from './StudentPayments';
import { LayoutDashboard, CreditCard } from 'lucide-react';

export function StudentPortalTabs() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Portal do Aluno</h1>
        <p className="text-muted-foreground">
          Acompanhe suas aulas, pagamentos e comunicados em um só lugar.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <StudentDashboard />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <StudentPayments />
        </TabsContent>
      </Tabs>
    </div>
  );
}