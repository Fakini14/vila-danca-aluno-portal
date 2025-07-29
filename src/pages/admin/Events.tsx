import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Events() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dance-text-gradient">
          Gestão de Eventos
        </h1>
        <p className="text-muted-foreground">
          Gerencie eventos, apresentações e vendas de ingressos
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Em Desenvolvimento</CardTitle>
          <CardDescription>
            Sistema de eventos será implementado na Fase 5
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidade será desenvolvida conforme o cronograma dos Dias 24-28.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}