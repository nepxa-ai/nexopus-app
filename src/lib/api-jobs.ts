// lib/api-job.ts
// Sigue el mismo patrón que api-catalog.ts:
// - Usa BASE = NEXT_PUBLIC_API_BASE (por defecto "/api")
// - El token se toma de localStorage dentro de api()
// - Las rutas del backend son /api/executions en FastAPI

export type Estado = "running" | "success" | "error" | "waiting" | "canceled";

export interface ExecutionItem {
  id: number;
  id_job: number;
  workflow_name: string;
  id_dialvox: number;
  estado: Estado;
  created_at?: string; // opcional
}

export interface ExecutionCreateInput {
  id_job: number;
  workflow_name: string;
  id_dialvox?: number;
  estado: Estado;
}

export interface ExecutionPatchInput {
  id_job?: number;
  workflow_name?: string;
  id_dialvox?: number;
  estado?: Estado;
}

// ---------- Base y fetch (igual que api-catalog) ----------
const BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "/api").replace(/\/$/, "");

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    let detail: string | null = null;
    if (txt && txt.startsWith("{")) {
      try {
        detail = JSON.parse(txt)?.detail ?? null;
      } catch {
        detail = null;
      }
    }
    const msg = detail || txt || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

// ---------- Funciones específicas para executions ----------

/** Traer lista de ejecuciones (array plano) */
export async function getExecutions(options?: {
  skip?: number;
  limit?: number;
  estado?: Estado;
  id_job?: number;
  id_dialvox?: number;
}): Promise<ExecutionItem[]> {
  const qs = new URLSearchParams();
  if (options?.skip !== undefined) qs.set("skip", String(options.skip));
  if (options?.limit !== undefined) qs.set("limit", String(options.limit));
  if (options?.estado) qs.set("estado", options.estado);
  if (options?.id_job !== undefined) qs.set("id_job", String(options.id_job));
  if (options?.id_dialvox !== undefined)
    qs.set("id_dialvox", String(options.id_dialvox));

  const query = qs.toString();
  const path = query ? `/executions?${query}` : `/executions`;

  // OJO: BASE="/api" => llama a /api/executions en tu FastAPI (el curl que sí funciona)
  return api<ExecutionItem[]>(path);
}

/** Traer ejecuciones de un Dialvox específico */
export async function getExecutionsByDialvox(
  id_dialvox: number,
  limit = 50
): Promise<ExecutionItem[]> {
  return getExecutions({ id_dialvox, limit });
}

/** Crear */
export async function createExecution(
  data: ExecutionCreateInput
): Promise<ExecutionItem> {
  return api<ExecutionItem>("/executions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Actualizar */
export async function updateExecution(
  id: number,
  data: ExecutionPatchInput
): Promise<ExecutionItem> {
  return api<ExecutionItem>(`/executions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** Borrar */
export async function deleteExecution(id: number): Promise<void> {
  await api<void>(`/executions/${id}`, {
    method: "DELETE",
  });
}
