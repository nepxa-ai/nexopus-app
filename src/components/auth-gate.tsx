"use client";

import * as React from "react"
import { useRouter } from "next/navigation"; 

export function AuthGate({children}:{children: React.ReactNode}){
    const router = useRouter();
    const [ok, setOk] = React.useState(false);

    React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    // valida token llamando a /auth/me
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then(() => setOk(true))
    .catch(() => router.replace("/login"));
  }, [router]);

  if (!ok) return <div className="p-6">Cargando…</div>;
  return <>{children}</>;
}
