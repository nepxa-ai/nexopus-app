export type UserLite = {
  id: number
  nombres: string
  apellidos: string
  extension: number
}

export async function fetchUserByExtensionLite(ext: number): Promise<UserLite | null> {
  // Soporta -1 igual que el backend
  if (ext === -1) return { id: 0, nombres: "No asignado", apellidos: "", extension: -1 }
  if (ext == null || ext <= 0) return null

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  // Usa el proxy Next.js como tus otros fetchers: /api/...
  const res = await fetch(`api/users/by-extension/${ext}/lite`, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
    cache: "no-store",
  })

  if (!res.ok) return null
  return res.json() as Promise<UserLite>
}