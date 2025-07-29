import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dance-text-gradient">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Configure parâmetros gerais do sistema
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Em Desenvolvimento</CardTitle>
          <CardDescription>
            Área de configurações será implementada em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configurações do sistema, modalidades, e parâmetros gerais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}