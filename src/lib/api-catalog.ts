// lib/api-catalog.ts
// ✔ Usa NEXT_PUBLIC_API_BASE (ej. "/api") para no fallar en 404.
// ✔ Expone listPage (paginado), listAll (auto-pagina), get(id),
//   y filtros jerárquicos: listByServicio, listByCategoria.
// ✔ Maneja DELETE sin body y errores con mensaje claro.

export type PageResp<T> = { items: T[]; total: number; page: number; size: number };

export type Servicio = {
  id: number; nombre: string; descripcion?: string|null;
  creado_por?: string|null; created_at: string; updated_at: string;
};
export type Categoria = {
  id: number; nombre: string; descripcion?: string|null; id_servicio: number;
  creado_por?: string|null; created_at: string; updated_at: string;
};
export type Subcategoria = {
  id: number; nombre: string; descripcion?: string|null; id_categoria: number;
  creado_por?: string|null; created_at: string; updated_at: string;
};

// ---------- Base y fetch ----------
const BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "/api").replace(/\/$/, ""); // default: "/api"

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    // Intenta leer texto (por si viene HTML de error)
    const txt = await res.text();
    const detail = txt && txt.startsWith("{") ? (() => { try { return JSON.parse(txt)?.detail; } catch { return null; } })() : null;
    const msg = detail || txt || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // DELETE puede no traer body
  const body = await res.text();
  return (body ? JSON.parse(body) : undefined) as T;
}

// ---------- util auto-paginado ----------
async function listAll<T>(pager: (page: number, size: number) => Promise<PageResp<T>>, size = 200): Promise<T[]> {
  let page = 1;
  const out: T[] = [];
  while (true) {
    const resp = await pager(page, size);
    out.push(...resp.items);
    if (resp.items.length < size) break;
    page += 1;
  }
  return out;
}

// ====================== SERVICIOS ======================
export const CatalogServicios = {
  // GET /servicios?page=&size=&q=
  listPage: (page = 1, size = 20, q?: string) =>
    api<PageResp<Servicio>>(`/servicios?page=${page}&size=${size}${q ? `&q=${encodeURIComponent(q)}` : ""}`),

  // GET all (auto-pagina)
  listAll: (q?: string) => listAll<Servicio>((p, s) =>
    api<PageResp<Servicio>>(`/servicios?page=${p}&size=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`), 500),

  get: (id: number) => api<Servicio>(`/servicios/${id}`),

  create: (data: Pick<Servicio, "nombre" | "descripcion">) =>
    api<Servicio>("/servicios", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: Partial<Pick<Servicio, "nombre" | "descripcion">>) =>
    api<Servicio>(`/servicios/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) => api<void>(`/servicios/${id}`, { method: "DELETE" }),

  // árbol completo
  tree: (id: number) => api(`/servicios/${id}/tree`),
};

// ====================== CATEGORÍAS ======================
export const CatalogCategorias = {
  // GET /categorias?page=&size=&q=&id_servicio=
  listPage: (page = 1, size = 20, q?: string, id_servicio?: number) =>
    api<PageResp<Categoria>>(
      `/categorias?page=${page}&size=${size}`
      + (q ? `&q=${encodeURIComponent(q)}` : "")
      + (id_servicio ? `&id_servicio=${id_servicio}` : "")
    ),

  listAll: (q?: string, id_servicio?: number) => listAll<Categoria>((p, s) =>
    api<PageResp<Categoria>>(
      `/categorias?page=${p}&size=${s}`
      + (q ? `&q=${encodeURIComponent(q)}` : "")
      + (id_servicio ? `&id_servicio=${id_servicio}` : "")
    ), 500),

  get: (id: number) => api<Categoria>(`/categorias/${id}`),

  create: (data: Pick<Categoria, "nombre" | "descripcion" | "id_servicio">) =>
    api<Categoria>("/categorias", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: Partial<Pick<Categoria, "nombre" | "descripcion" | "id_servicio">>) =>
    api<Categoria>(`/categorias/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) => api<void>(`/categorias/${id}`, { method: "DELETE" }),

  // helpers de filtro
  listByServicioPage: (servicioId: number, page = 1, size = 20, q?: string) =>
    api<PageResp<Categoria>>(`/categorias?page=${page}&size=${size}&id_servicio=${servicioId}${q ? `&q=${encodeURIComponent(q)}` : ""}`),

  listByServicioAll: (servicioId: number, q?: string) => listAll<Categoria>((p, s) =>
    api<PageResp<Categoria>>(`/categorias?page=${p}&size=${s}&id_servicio=${servicioId}${q ? `&q=${encodeURIComponent(q)}` : ""}`), 500),
};

// ====================== SUBCATEGORÍAS ======================
export const CatalogSubcategorias = {
  // GET /subcategorias?page=&size=&q=&id_categoria=
  listPage: (page = 1, size = 20, q?: string, id_categoria?: number) =>
    api<PageResp<Subcategoria>>(
      `/subcategorias?page=${page}&size=${size}`
      + (q ? `&q=${encodeURIComponent(q)}` : "")
      + (id_categoria ? `&id_categoria=${id_categoria}` : "")
    ),

  listAll: (q?: string, id_categoria?: number) => listAll<Subcategoria>((p, s) =>
    api<PageResp<Subcategoria>>(
      `/subcategorias?page=${p}&size=${s}`
      + (q ? `&q=${encodeURIComponent(q)}` : "")
      + (id_categoria ? `&id_categoria=${id_categoria}` : "")
    ), 500),

  get: (id: number) => api<Subcategoria>(`/subcategorias/${id}`),

  create: (data: Pick<Subcategoria, "nombre" | "descripcion" | "id_categoria">) =>
    api<Subcategoria>("/subcategorias", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: Partial<Pick<Subcategoria, "nombre" | "descripcion" | "id_categoria">>) =>
    api<Subcategoria>(`/subcategorias/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) => api<void>(`/subcategorias/${id}`, { method: "DELETE" }),

  // helpers de filtro
  listByCategoriaPage: (categoriaId: number, page = 1, size = 20, q?: string) =>
    api<PageResp<Subcategoria>>(`/subcategorias?page=${page}&size=${size}&id_categoria=${categoriaId}${q ? `&q=${encodeURIComponent(q)}` : ""}`),

  listByCategoriaAll: (categoriaId: number, q?: string) => listAll<Subcategoria>((p, s) =>
    api<PageResp<Subcategoria>>(`/subcategorias?page=${p}&size=${s}&id_categoria=${categoriaId}${q ? `&q=${encodeURIComponent(q)}` : ""}`), 500),
};
