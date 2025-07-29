import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Finance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dance-text-gradient">
          Sistema Financeiro
        </h1>
        <p className="text-muted-foreground">
          Gerencie mensalidades, pagamentos e relatórios financeiros
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Em Desenvolvimento</CardTitle>
          <CardDescription>
            Sistema financeiro será implementado nos próximos dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidade será desenvolvida conforme o cronograma dos Dias 13-14.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}