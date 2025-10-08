export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type User = {
  id: number;
  email: string;
  nombres: string;
  apellidos: string;
  rol: "admin" | "user" | "viewer";
  activo: boolean;
  extension: number; // -1 = sin extensión
  fecha_creado: string;
  fecha_ultimo_acceso?: string | null;
  fecha_actualizacion?: string | null;
};

export type Paginated<T> = {
  total: number;
  page: number;
  page_size: number;
  items: T[];
};

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function fetchUsers(
  token: string,
  page = 1,
  pageSize = 20
): Promise<Paginated<User>> {
  const res = await fetch(`${API_URL}/users?page=${page}&page_size=${pageSize}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); if (j?.detail) msg += ` - ${j.detail}`; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function updateUser(
  token: string,
  id: number,
  data: Partial<Pick<User, "nombres"|"apellidos"|"email"|"rol"|"activo"|"extension">>
): Promise<User> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function toggleActive(token: string, id: number, activo: boolean): Promise<User> {
  return updateUser(token, id, { activo });
}

export async function createUser(
  token: string,
  data: {
    email: string;
    password: string;
    nombres: string;
    apellidos: string;
    rol?: "admin" | "user" | "viewer";
    extension?: number;
  }
): Promise<User> {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ ...data, rol: data.rol || "user", extension: data.extension ?? -1 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteUser(token: string, id: number) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return true;
}
