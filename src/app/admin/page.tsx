"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { UsersTable } from "@/components/admin/user-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    // (opcional) podrías llamar /auth/me y validar rol === 'admin'
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Administración de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersTable />
        </CardContent>
      </Card>
    </div>
  );
}