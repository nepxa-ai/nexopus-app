"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api"; 

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const run = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("unauthorized");

        if (alive) setOk(true);
      } catch {
        if (alive) router.replace("/login");
      }
    };

    run();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [router]);

  if (!ok) return <div className="p-6">Cargando…</div>;
  return <>{children}</>;
}
