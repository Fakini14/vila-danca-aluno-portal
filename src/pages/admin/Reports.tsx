import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dance-text-gradient">
          Relatórios
        </h1>
        <p className="text-muted-foreground">
          Visualize relatórios detalhados e estatísticas da escola
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Em Desenvolvimento</CardTitle>
          <CardDescription>
            Sistema de relatórios será expandido em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Relatórios detalhados serão implementados junto com o sistema financeiro.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}