// src/lib/api-webhooks-flujos.ts

export type FinLlamadaItem = {
  uniqueid: string;
  dialvox_id: string;
  tipo_solicitud: "incidente" | "requerimiento" | "consulta" | "fpqrs";
};

// --- Opción A: llamada DIRECTA al webhook interno ---
export async function postFinLlamadaDirect(
  items: FinLlamadaItem[],
  timeoutMs = 10000
) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort("timeout"), timeoutMs);
  try {
    const res = await fetch("https://10.34.7.10:5678/webhook/fin-llamada-gestor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
      signal: ac.signal,
    });
    if (!res.ok) throw new Error(`fin-llamada HTTP ${res.status}`);
    try { return await res.json(); } catch { return {}; }
  } finally {
    clearTimeout(t);
  }
}

// --- Opción B: llamada VÍA PROXY de tu backend ---
export async function postFinLlamadaViaApi(
  items: FinLlamadaItem[],
  timeoutMs = 10000
) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort("timeout"), timeoutMs);
  try {
    const res = await fetch("/api/forward/fin-llamada-gestor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
      signal: ac.signal,
    });
    if (!res.ok) throw new Error(`forward fin-llamada HTTP ${res.status}`);
    try { return await res.json(); } catch { return {}; }
  } finally {
    clearTimeout(t);
  }
}