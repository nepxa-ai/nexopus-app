export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiLogin(data: { username: string; password: string }) {
  const body = new URLSearchParams();
  body.set("username", data.username);
  body.set("password", data.password);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error de autenticación");
  }
  return (await res.json()) as { access_token: string; token_type: "bearer" };
}

export async function fetchMe(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("No autorizado");
  return res.json();
}