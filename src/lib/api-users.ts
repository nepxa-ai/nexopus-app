// src/lib/api-users.ts
export type UserLite = {
  id: number
  nombres: string
  apellidos: string
  extension: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function fetchUserByExtensionLite(ext: number): Promise<UserLite | null> {
  if (ext === -1) return { id: 0, nombres: "No asignado", apellidos: "", extension: -1 }
  if (ext == null || ext <= 0) return null

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  // 👇 Llama al backend FastAPI directo
  const res = await fetch(`${API_URL}/users/by-extension/${ext}/lite`, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
    cache: "no-store",
  })

  if (!res.ok) return null
  return res.json() as Promise<UserLite>
}
