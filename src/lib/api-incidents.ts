function authHeaders() {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("access_token")
  return token ? { Authorization: `Bearer ${token}`, "content-type": "application/json" } : { "content-type": "application/json" }
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

// Si tu webhook está detrás del mismo Nginx y no requiere auth, puede ir sin token.
// Si prefieres, también puedes exponerlo vía /api/... y que Nginx lo proxyee.
export async function sendIncidentToITSM(data: any) {
  const r = await fetch(`https://10.34.7.10:5678/webhook/crear-incidente-itsm`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error(`Error al enviar al ITSM (HTTP ${r.status})`)
  return r.json()
}