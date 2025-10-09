// src/lib/api-users.ts
export type UserLite = {
  id: number
  nombres: string
  apellidos: string
  extension: number
}

export async function fetchUserByExtensionLite(ext: number): Promise<UserLite | null> {
  // Placeholders y validaciones rápidas (evitan llamadas innecesarias)
  if (ext === -1) return { id: 0, nombres: "No asignado", apellidos: "", extension: -1 }
  if (ext == null || ext <= 0) return null

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  // 🔧 Ruta relativa -> Nginx la reescribe a tu FastAPI (/api/users/...)
  const res = await fetch(`api/users/by-extension/${ext}/lite`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  }).catch(() => null)

  if (!res || !res.ok) return null
  return res.json() as Promise<UserLite>
}
