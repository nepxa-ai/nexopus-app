// lib/api-auth.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api" || "http://localhost:8000";


export function authHeaders(json: boolean = false): HeadersInit {
  // En SSR / build no hay localStorage
  if (typeof window === "undefined") {
    const base: Record<string, string> = {}
    if (json) base["Content-Type"] = "application/json"
    return base
  }

  const token = localStorage.getItem("access_token")
  const headers: Record<string, string> = {}

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  if (json) {
    headers["Content-Type"] = "application/json"
  }

  return headers
}

/**
 * Atajo para JSON (para POST/PATCH)
 */
export function authJsonHeaders(): HeadersInit {
  return authHeaders(true)
}

/**
 * Login contra /auth/login
 */
export async function apiLogin(email: string, password: string) {
  const body = new URLSearchParams()
  body.set("username", email.trim().toLowerCase())
  body.set("password", password)

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  if (!res.ok) {
    throw new Error("Credenciales inválidas")
  }

  const data: { access_token: string; token_type: string } = await res.json()

  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", data.access_token)
  }

  return data
}

/**
 * GET /auth/me  → usuario actual
 */
export async function fetchMe() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("No se pudo obtener el usuario actual")
  }

  return res.json()
}