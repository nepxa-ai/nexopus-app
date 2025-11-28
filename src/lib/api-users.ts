// src/lib/api-users.ts

//Funciones - responsable de :
//1. Manejar aquí todo lo relacionado a usuario y perfil de usuario (/users/me)
//2. La función utilitaria fetchUserByExtensionLite
//3. Importar la capa de auth

import { API_URL, authHeaders, authJsonHeaders } from "./api-auth"


export type UserLite = {
  id: number
  nombres: string
  apellidos: string
  extension: number
}

/**
 * Devuelve info básica de un usuario por extensión (para mostrar nombre, etc.).
 */
export async function fetchUserByExtensionLite(ext: number): Promise<UserLite | null> {
  console.log("[DEBUG] fetchUserByExtensionLite called with ext:", ext)

  if (ext === -1) return { id: 0, nombres: "No asignado", apellidos: "", extension: -1 }
  if (ext == null || ext <= 0) return null


  const res = await fetch(`api/users/by-extension/${ext}/lite`, {
    headers: authHeaders(),
    cache: "no-store",
  })

  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(
      `Error al buscar usuario por extensión (HTTP ${res.status})`
    )
  }
  return res.json()
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
  const res = await fetch(`/api/users/me`, {
    headers: authHeaders(),
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