function authHeaders() {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("access_token")
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" }
}

export async function fetchIncidentByDialvox(id_dvx: number | string) {
  const r = await fetch(`/api/incidents/by-id_dialvox/${id_dvx}`, {
    headers: authHeaders(),
    cache: "no-store",
  })
  if (!r.ok) throw new Error(`Error al obtener el incidente (HTTP ${r.status})`)
  return r.json()
}

export async function updateIncidentByDialvox(id_dvx: number | string, data: any) {
  const r = await fetch(`/api/incidents/by-id_dialvox/${id_dvx}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error(`Error al actualizar el incidente (HTTP ${r.status})`)
  return r.json()
}

export async function sendIncidentToITSM(data: any) {
  const r = await fetch(`/webhook/crear-incidente-itsm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error(`Error al enviar al ITSM (HTTP ${r.status})`)
  return r.json()
}
