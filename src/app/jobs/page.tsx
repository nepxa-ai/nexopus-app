"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { fetchAuthMe } from "@/lib/api-auth";
import { getExecutions, type ExecutionItem } from "@/lib/api-jobs";
import { AuditLogByDialvox } from "@/components/jobs/jobs-by-dialvox";

export default function JobsPage() {
  const router = useRouter();

  const [ready, setReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<ExecutionItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  // 1️⃣ Verificar rol admin
  React.useEffect(() => {
    fetchAuthMe()
      .then((me) => {
        if (me?.rol !== "admin") {
          router.replace("/");
          return;
        }
        setReady(true);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  // 2️⃣ Cargar ejecuciones cuando ya sabemos que es admin
  React.useEffect(() => {
    if (!ready) return;

    setLoading(true);
    getExecutions({ limit: 200 })
      .then((data) => {
        setItems(data);
        setError(null);
      })
      .catch((err) => {
        console.error("JobsPage: error en getExecutions", err);
        setError("No se pudo cargar el historial de jobs.");
      })
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready) return null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Jobs (n8n) por ID Dialvox</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && (
                <p className="text-sm text-muted-foreground mb-2">
                  Cargando registros…
                </p>
              )}

              {error && (
                <p className="text-sm text-red-500 mb-2">{error}</p>
              )}

              {!loading && !error && <AuditLogByDialvox items={items} />}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
