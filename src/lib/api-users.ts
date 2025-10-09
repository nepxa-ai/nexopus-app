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
