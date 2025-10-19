
"use client";

import { SchedulerProvider } from "@/components/scheduler-provider";
import { SchedulerHeader } from "./scheduler-header";
import { SchedulerTable } from "./scheduler-table";
import { Card, CardContent } from "@/components/ui/card";
import { Item, Group } from "@/lib/types";
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { Button } from '@/components/ui/button';

// Improved fallback that logs and provides a retry button + dev details
function TableFallback({ error, resetErrorBoundary }: FallbackProps) {
  // Report to monitoring service (example)
  console.error('Scheduler table render error:', error);

  return (
    <div role="alert" className="p-6 text-center border rounded-lg m-4 bg-destructive/10">
      <h2 className="text-lg font-semibold text-destructive">Error al cargar la tabla de programación</h2>
      <p className="text-sm text-muted-foreground mt-1">Ha ocurrido un error inesperado que impide mostrar los datos.</p>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-4 text-left text-xs bg-muted p-2 rounded overflow-auto">{error?.stack}</pre>
      )}
      <Button onClick={resetErrorBoundary} className="mt-4">Intentar de nuevo</Button>
    </div>
  );
}

export function SchedulerClient({
  items,
  groups,
}: Readonly<{
  items: Item[];
  groups: Group[];
}>) {
  // Validación simple de entrada
  const hasData = Array.isArray(items) && items.length > 0 && Array.isArray(groups) && groups.length > 0;

  return (
    <SchedulerProvider items={items} groups={groups}>
      <div className="p-2 sm:p-4 lg:p-8 bg-background min-h-screen flex flex-col">
        <header className="bg-card/70 backdrop-blur-md rounded-xl shadow-lg p-4 sm:p-6 mb-8 sticky top-4 z-50">
          <SchedulerHeader />
        </header>
        <main className="flex-grow flex flex-col">
          <Card className="w-full flex-grow overflow-hidden shadow-2xl shadow-primary/10 rounded-2xl border-primary/10 bg-card/90 backdrop-blur-sm">
            <CardContent className="p-0 h-full">
              {hasData ? (
                <ErrorBoundary
                  FallbackComponent={TableFallback}
                  onError={(error, info) => {
                    // send to real monitoring if available
                    console.error('Captured error in SchedulerTable:', error, info);
                  }}
                >
                  <SchedulerTable />
                </ErrorBoundary>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-lg font-semibold">Sin datos para mostrar</p>
                  <p className="text-sm text-muted-foreground mt-1">Asegúrate de que existen items y grupos configurados.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </SchedulerProvider>
  );
}
