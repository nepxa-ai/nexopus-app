export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type WebhookEvent = {
  id: number
  id_dialvox_: number | null
  id_llamada: string | null
  phone: string | null
  duration_sec: number | null
  nombre_cliente: string | null
  numero_caso: string | null
  estado_caso: string | null
  tipo_solicitud: string | null
  es_vip: boolean | null
  empresa_cliente: string | null
  correo_cliente: string | null
  producto: string | null
  servicio: string | null
  prioridad: number | null
  en_horario: boolean | null
  extracted_variables: any | null
  contratos_empresa: any | null
  transcript_text: string | null
  recording_url: string | null
  transcript_url: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
  updated_at: string
}

export type PaginatedWebhooks = {
  total: number
  page: number
  page_size: number
  items: WebhookEvent[]
}

export async function fetchWebhookEvents(params?: { page?: number; page_size?: number; phone?: string; id_llamada?: string }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  const qs = new URLSearchParams()
  if (params?.page) qs.set("page", String(params.page))
  if (params?.page_size) qs.set("page_size", String(params.page_size))
  if (params?.phone) qs.set("phone", params.phone)
  if (params?.id_llamada) qs.set("id_llamada", params.id_llamada)

  const res = await fetch(`${API_URL}/webhooks/events?${qs.toString()}`, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
    cache: "no-store",
  })
  if (!res.ok) throw new Error("No se pudo cargar eventos")
  return res.json() as Promise<PaginatedWebhooks>
}