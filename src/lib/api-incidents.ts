import { API_URL } from "./api-webhooks"

export async function fetchIncidentByDialvox(id_dvx: number) {
  const res = await fetch(`${API_URL}/incidents/by-id_dialvox/${id_dvx}`)
  if (!res.ok) throw new Error("Error al obtener el incidente")
  return await res.json()
}

export async function updateIncidentByDialvox(id_dvx: number, data: any) {
  const res = await fetch(`${API_URL}/incidents/by-id_dialvox/${id_dvx}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Error al actualizar el incidente")
  return await res.json()
}

export async function sendIncidentToITSM(data: any) {
  const webhookUrl = "https://10.34.7.10:5678/webhook/crear-incidente-itsm"
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Error al enviar al ITSM")
  return await res.json()
}
