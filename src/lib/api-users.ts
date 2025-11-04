// src/lib/api-users.ts
export type UserLite = {
  id: number
  nombres: string
  apellidos: string
  extension: number
}

export async function fetchUserByExtensionLite(ext: number): Promise<UserLite | null> {
  console.log("[DEBUG] fetchUserByExtensionLite called with ext:", ext)

  if (ext === -1) return { id: 0, nombres: "No asignado", apellidos: "", extension: -1 }
  if (ext == null || ext <= 0) return null

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  const res = await fetch(`api/users/by-extension/${ext}/lite`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  }).catch(err => {
    console.error("[DEBUG] Fetch error:", err)
    return null
  })

  if (!res || !res.ok) {
    console.warn("[DEBUG] Response not OK for ext:", ext, res?.status)
    return null
  }

  const data = await res.json()
  console.log("[DEBUG] Response OK:", data)
  return data
}

/* ---------- NUEVO: perfil propio ---------- */
export type Me = {
  id: number
  nombres: string
  apellidos: string
  email: string
  rol: "admin" | "user"
  extension: number | null
  activo: boolean
  created_at?: string
  updated_at?: string
}

export type MeUpdatePayload = {
  nombres?: string
  apellidos?: string
  password?: string
}

export async function fetchMe(): Promise<Me> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  const res = await fetch(`/api/users/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
    credentials: "include",
  })
  if (!res.ok) throw new Error("No se pudo obtener el perfil")
  return res.json()
}

export async function patchMe(payload: MeUpdatePayload): Promise<Me> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  const res = await fetch(`/api/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("No se pudo actualizar el perfil")
  return res.json()
}