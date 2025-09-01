export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type User = {
  id: number;
  email: string;
  nombres: string;
  apellidos: string;
  rol: "admin" | "user" | "viewer";
  is_active: boolean;
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

export async function fetchUsers(token: string, page = 1, pageSize = 20): Promise<Paginated<User>> {
  const res = await fetch(`${API_URL}/users/?page=${page}&page_size=${pageSize}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo cargar usuarios");
  return res.json();
}

export async function updateUser(
  token: string,
  id: number,
  data: Partial<Pick<User, "nombres"|"apellidos"|"email"|"rol"|"is_active">>
): Promise<User> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("No se pudo actualizar el usuario");
  return res.json();
}

export async function toggleActive(token: string, id: number, is_active: boolean): Promise<User> {
  return updateUser(token, id, { is_active });
}


export async function createUser(
  token: string,
  data: {
    email: string;
    password: string;
    nombres: string;
    apellidos: string;
    rol?: "admin" | "user" | "viewer";
  }
) {
  const res = await fetch(`${API_URL}/users/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, rol: data.rol || "user" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "No se pudo crear el usuario");
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
    throw new Error(err.detail || "No se pudo eliminar el usuario");
  }
  // muchos backends devuelven 204; dejamos vacío
  return true;
}
