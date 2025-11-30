"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { fetchAuthMe } from "@/lib/api-auth";

import ITSMAdminTabs from "@/components/itsm-catalog/itsm-catalog";

export default function CatalogPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {

    fetchAuthMe()
      .then((me) => {
        // si quieres limitar al rol admin, deja esta validación:
        if (me?.rol !== "admin") {
          router.replace("/");
          return;
        }
        setReady(true);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Catálogo ITSM</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ITSMAdminTabs />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}