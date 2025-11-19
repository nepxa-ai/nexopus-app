import { authHeaders, authJsonHeaders } from "./api-auth"

export async function fetchIncidentByDialvox(id_dvx: number | string) {
  const r = await fetch(`/api/incidents/by-id_dialvox/${id_dvx}`, {
    headers: authHeaders(),
    cache: "no-store",
  })
  if (!r.ok) throw new Error(`Error al obtener el incidente (HTTP ${r.status})`)
  return r.json()
}

export async function updateIncidentByDialvox(
  id_dvx: number | string,
  data: unknown
) {
  const r = await fetch(`/api/incidents/by-id_dialvox/${id_dvx}`, {
    method: "PATCH",
    headers: authJsonHeaders(),
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error(`Error al actualizar el incidente (HTTP ${r.status})`)
  return r.json()
}

export async function sendIncidentToITSM(data: unknown) {
  const r = await fetch(
    `https://10.34.7.10:5678/n8n/webhook/actualizar-incidente-ivanti`,
    {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify(data),
    }
  )
  if (!r.ok) throw new Error(`Error al enviar al ITSM (HTTP ${r.status})`)
  return r.json()
}
