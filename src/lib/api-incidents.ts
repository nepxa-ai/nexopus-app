// usa el mismo patrón que api-webhooks: rutas relativas
export async function fetchIncidentByDialvox(id_dvx: number) {
  const r = await fetch(`/api/incidents/by-id_dialvox/${id_dvx}`, { cache: "no-store" })
  if (!r.ok) throw new Error("Error al obtener el incidente")
  return r.json()
}

export async function updateIncidentByDialvox(id_dvx: number, data: any) {
  const r = await fetch(`/api/incidents/by-id_dialvox/${id_dvx}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error("Error al actualizar el incidente")
  return r.json()
}

export async function sendIncidentToITSM(data: any) {
  // si Nginx ya expone este webhook con el mismo dominio, también puedes usar ruta relativa:
  // return fetch(`/webhook/crear-incidente-itsm`, { ... })
  const r = await fetch(`https://10.34.7.10:5678/webhook/crear-incidente-itsm`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error("Error al enviar al ITSM")
  return r.json()
}