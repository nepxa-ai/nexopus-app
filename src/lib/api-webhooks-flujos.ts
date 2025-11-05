// src/lib/api-webhooks-flujo.ts
export type FinLlamadaItem = {
  uniqueid: string;
  dialvox_id: string;
  tipo_solicitud: "incidente" | "requerimiento" | "consulta" | "fpqrs";
};

export async function sendFinLlamadaGestor(
  items: FinLlamadaItem[],
  opts?: { signal?: AbortSignal }
) {
  const res = await fetch("https://10.34.7.10:5678/webhook/fin-llamada-gestor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(items),
    signal: opts?.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Webhook fin-llamada HTTP ${res.status} ${text || ""}`.trim());
  }

  // El webhook podría no retornar JSON; si falla el parseo, regresamos {}.
  try { return await res.json(); } catch { return {}; }
}

/**
 * Alternativa recomendada si hay CORS/SSL interno:
 * Crea un endpoint backend (ej. /api/forward/fin-llamada-gestor) 
 * y reenvía allí el POST, para evitar CORS y certificados self-signed.
 */
export async function sendFinLlamadaGestorViaApi(
  items: FinLlamadaItem[],
  opts?: { signal?: AbortSignal }
) {
  const res = await fetch("/api/forward/fin-llamada-gestor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(items),
    signal: opts?.signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Forward fin-llamada HTTP ${res.status} ${text || ""}`.trim());
  }
  try { return await res.json(); } catch { return {}; }
}
