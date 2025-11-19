"use client";
import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";


import {
  CatalogServicios,
  CatalogCategorias,
  CatalogSubcategorias,
  type Servicio,
  type Categoria,
  type Subcategoria,
} from "@/lib/api-catalog";

// ------------------------------------------------------------
// CRUD genérico que se conecta a api-catalog
// ------------------------------------------------------------
function useCrud<T extends { id: number }>(
  listFn: (
    page?: number,
    size?: number,
    q?: string,
    filterId?: number
  ) => Promise<{ items: T[]; total: number; page: number; size: number }>,
  createFn: (payload: Partial<T>) => Promise<T>,
  updateFn: (id: number, payload: Partial<T>) => Promise<T>,
  removeFn: (id: number) => Promise<void>,
  opts?: { defaultSize?: number; q?: string; filterId?: number }
) {
  const [items, setItems] = React.useState<T[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [size] = React.useState(opts?.defaultSize ?? 20);
  const [q, setQ] = React.useState(opts?.q ?? "");
  const [filterId, setFilterId] = React.useState<number | undefined>(
    opts?.filterId
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

    const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFn(page, size, q, filterId);
      setItems(data.items);
      setTotal(data.total);
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [listFn, page, size, q, filterId]);


  React.useEffect(() => {
    load();
  }, [load]);

  return {
    items,
    total,
    page,
    setPage,
    totalPages: Math.max(1, Math.ceil(total / size)),
    q,
    setQ,
    filterId,
    setFilterId,
    loading,
    error,
    reload: load,
    async create(payload: Partial<T>) {
      await createFn(payload);
      await load();
    },
    async update(id: number, payload: Partial<T>) {
      await updateFn(id, payload);
      await load();
    },
    async remove(id: number) {
      await removeFn(id);
      await load();
    },
  };
}

// ------------------------------------------------------------
// Formularios modales
// ------------------------------------------------------------
function ServicioFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  submitting,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Servicio>) => Promise<void>;
  initial?: Partial<Servicio>;
  submitting?: boolean;
  mode: "create" | "edit";
}) {
  const [form, setForm] = React.useState<Partial<Servicio>>({
    nombre: "",
    descripcion: "",
  });
  React.useEffect(() => {
    if (open)
      setForm({
        nombre: initial?.nombre || "",
        descripcion: initial?.descripcion || "",
      });
  }, [open, initial]);
  function set<K extends keyof Servicio>(k: K, v: Servicio[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nuevo servicio" : "Editar servicio"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Nombre</Label>
            <Input
              value={form.nombre || ""}
              onChange={(e) => set("nombre", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Descripción</Label>
            <Input
              value={form.descripcion || ""}
              onChange={(e) => set("descripcion", e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={!!submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!!submitting}>
              {submitting ? "Guardando…" : mode === "create" ? "Crear" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoriaFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  servicios,
  submitting,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Categoria>) => Promise<void>;
  initial?: Partial<Categoria>;
  servicios: Servicio[];
  submitting?: boolean;
  mode: "create" | "edit";
}) {
  const [form, setForm] = React.useState<Partial<Categoria>>({
    nombre: "",
    descripcion: "",
    id_servicio: 0,
  });
  React.useEffect(() => {
    if (open)
      setForm({
        nombre: initial?.nombre || "",
        descripcion: initial?.descripcion || "",
        id_servicio: initial?.id_servicio ?? (servicios[0]?.id || 0),
      });
  }, [open, initial, servicios]);
  function set<K extends keyof Categoria>(k: K, v: Categoria[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nueva categoría" : "Editar categoría"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Servicio</Label>
            <Select
              value={(form.id_servicio || 0).toString()}
              onValueChange={(v) => set("id_servicio", Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona servicio" />
              </SelectTrigger>
              <SelectContent>
                {servicios.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Nombre</Label>
            <Input
              value={form.nombre || ""}
              onChange={(e) => set("nombre", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Descripción</Label>
            <Input
              value={form.descripcion || ""}
              onChange={(e) => set("descripcion", e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={!!submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!!submitting}>
              {submitting ? "Guardando…" : mode === "create" ? "Crear" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubcategoriaFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  categorias,
  submitting,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Subcategoria>) => Promise<void>;
  initial?: Partial<Subcategoria>;
  categorias: Categoria[];
  submitting?: boolean;
  mode: "create" | "edit";
}) {
  const [form, setForm] = React.useState<Partial<Subcategoria>>({
    nombre: "",
    descripcion: "",
    id_categoria: 0,
  });
  React.useEffect(() => {
    if (open)
      setForm({
        nombre: initial?.nombre || "",
        descripcion: initial?.descripcion || "",
        id_categoria: initial?.id_categoria ?? (categorias[0]?.id || 0),
      });
  }, [open, initial, categorias]);
  function set<K extends keyof Subcategoria>(k: K, v: Subcategoria[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nueva subcategoría" : "Editar subcategoría"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Categoría</Label>
            <Select
              value={(form.id_categoria || 0).toString()}
              onValueChange={(v) => set("id_categoria", Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Nombre</Label>
            <Input
              value={form.nombre || ""}
              onChange={(e) => set("nombre", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Descripción</Label>
            <Input
              value={form.descripcion || ""}
              onChange={(e) => set("descripcion", e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={!!submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!!submitting}>
              {submitting ? "Guardando…" : mode === "create" ? "Crear" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// Tabla reutilizable simple
// ------------------------------------------------------------
function SimpleTable<T extends { id: number }>({
  columns,
  rows,
  loading,
  error,
  page,
  totalPages,
  onPrev,
  onNext,
  onEdit,
  onDelete,
}: {
  columns: {
    key: keyof T | string;
    header: string;
    render?: (row: T) => React.ReactNode;
    className?: string;
  }[];
  rows: T[];
  loading?: boolean;
  error?: string | null;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
}) {
  if (loading) return <div className="p-4">Cargando…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((c, i) => (
                <th key={i} className={`p-3 text-left ${c.className || ""}`}>
                  {c.header}
                </th>
              ))}
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                {columns.map((c, i) => {
                    const rec = r as Record<string, unknown>

                    let content: React.ReactNode

                    if (c.render) {
                      content = c.render(r)
                    } else {
                      const raw = rec[c.key as string]
                      // Si solo esperas texto/número, mejor lo normalizas a string
                      content =
                        raw === null || raw === undefined
                          ? ""
                          : (raw as React.ReactNode)
                    }

                    return (
                      <td key={i} className={`p-3 ${c.className || ""}`}>
                        {content}
                      </td>
                    )
                  })}
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(r)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(r)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={page <= 1} onClick={onPrev}>
          Anterior
        </Button>
        <div className="text-sm">
          Página {page} de {totalPages}
        </div>
        <Button variant="outline" disabled={page >= totalPages} onClick={onNext}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Vista principal con Tabs
// ------------------------------------------------------------
export default function ITSMAdminTabs() {
  // Servicios (CRUD desde catálogo)
  const svc = useCrud<Servicio>(
  CatalogServicios.listPage,
  (p) =>
    CatalogServicios.create(
      p as Parameters<typeof CatalogServicios.create>[0]
    ),
  (id, p) =>
    CatalogServicios.update(
      id,
      p as Parameters<typeof CatalogServicios.update>[1]
    ),
  CatalogServicios.remove
);
  const [openSvc, setOpenSvc] = React.useState(false);
  const [svcMode, setSvcMode] = React.useState<"create" | "edit">("create");
  const [svcSel, setSvcSel] = React.useState<Servicio | undefined>(undefined);
  const [submittingSvc, setSubmittingSvc] = React.useState(false);

  // Categorías
  const cat = useCrud<Categoria>(
  CatalogCategorias.listPage,
  (p) =>
    CatalogCategorias.create(
      p as Parameters<typeof CatalogCategorias.create>[0]
    ),
  (id, p) =>
    CatalogCategorias.update(
      id,
      p as Parameters<typeof CatalogCategorias.update>[1]
    ),
  CatalogCategorias.remove
);

  const [openCat, setOpenCat] = React.useState(false);
  const [catMode, setCatMode] = React.useState<"create" | "edit">("create");
  const [catSel, setCatSel] = React.useState<Categoria | undefined>(undefined);
  const [submittingCat, setSubmittingCat] = React.useState(false);

  // Subcategorías
  const sub = useCrud<Subcategoria>(
    CatalogSubcategorias.listPage,
    (p) =>
      CatalogSubcategorias.create(
        p as Parameters<typeof CatalogSubcategorias.create>[0]
      ),
    (id, p) =>
      CatalogSubcategorias.update(
        id,
        p as Parameters<typeof CatalogSubcategorias.update>[1]
      ),
    CatalogSubcategorias.remove
  );

  const [openSub, setOpenSub] = React.useState(false);
  const [subMode, setSubMode] = React.useState<"create" | "edit">("create");
  const [subSel, setSubSel] = React.useState<Subcategoria | undefined>(
    undefined
  );
  const [submittingSub, setSubmittingSub] = React.useState(false);

  // Delete dialog compartido
  const [toDelete, setToDelete] = React.useState<{
    type: "svc" | "cat" | "sub";
    id: number;
    label: string;
  } | null>(null);

  // Helpers submit
  async function submitServicio(data: Partial<Servicio>) {
    setSubmittingSvc(true);
    try {
      if (svcMode === "create") {
        await svc.create({
          nombre: data.nombre,
          descripcion: data.descripcion,
        });
      } else if (svcSel) {
        await svc.update(svcSel.id, {
          nombre: data.nombre,
          descripcion: data.descripcion,
        });
      }
      setOpenSvc(false);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Error al guardar servicio";
      alert(msg);
    } finally {
      setSubmittingSvc(false);
    }
  }


  async function submitCategoria(data: Partial<Categoria>) {
    setSubmittingCat(true);
    try {
      if (catMode === "create") {
        await cat.create({
          nombre: data.nombre,
          descripcion: data.descripcion,
          id_servicio: data.id_servicio,
        });
      } else if (catSel) {
        await cat.update(catSel.id, {
          nombre: data.nombre,
          descripcion: data.descripcion,
          id_servicio: data.id_servicio,
        });
      }
      setOpenCat(false);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Error al guardar categoría";
      alert(msg);
    } finally {
      setSubmittingCat(false);
    }
  }


  async function submitSubcategoria(data: Partial<Subcategoria>) {
    setSubmittingSub(true);
    try {
      if (subMode === "create") {
        await sub.create({
          nombre: data.nombre,
          descripcion: data.descripcion,
          id_categoria: data.id_categoria,
        });
      } else if (subSel) {
        await sub.update(subSel.id, {
          nombre: data.nombre,
          descripcion: data.descripcion,
          id_categoria: data.id_categoria,
        });
      }
      setOpenSub(false);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Error al guardar subcategoría";
      alert(msg);
    } finally {
      setSubmittingSub(false);
    }
  }

  // Precarga combos (servicios para categorías; categorías para subcategorías)
  React.useEffect(() => {
    if (svc.items.length === 0) svc.reload();
  });
  React.useEffect(() => {
    if (cat.items.length === 0) cat.reload();
  });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Administración ITSM</h1>
      <Tabs defaultValue="servicios">
        <TabsList>
          <TabsTrigger value="servicios">Servicios</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
          <TabsTrigger value="subcategorias">Subcategorías</TabsTrigger>
        </TabsList>

        {/* Servicios */}
        <TabsContent value="servicios" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Total: {svc.total}</div>
            <Button
              onClick={() => {
                setSvcMode("create");
                setSvcSel(undefined);
                setOpenSvc(true);
              }}
            >
              Agregar servicio
            </Button>
          </div>
          <SimpleTable<Servicio>
            columns={[
              { key: "nombre", header: "Nombre" },
              { key: "descripcion", header: "Descripción" },
              {
                key: "updated_at",
                header: "Actualizado",
                render: (r) => (
                  <Badge variant="secondary">
                    {new Date(r.updated_at).toLocaleString()}
                  </Badge>
                ),
                className: "text-right",
              },
            ]}
            rows={svc.items}
            loading={svc.loading}
            error={svc.error}
            page={svc.page}
            totalPages={svc.totalPages}
            onPrev={() => svc.setPage((p) => p - 1)}
            onNext={() => svc.setPage((p) => p + 1)}
            onEdit={(r) => {
              setSvcMode("edit");
              setSvcSel(r);
              setOpenSvc(true);
            }}
            onDelete={(r) =>
              setToDelete({ type: "svc", id: r.id, label: r.nombre })
            }
          />
          <ServicioFormModal
            open={openSvc}
            onClose={() => setOpenSvc(false)}
            onSubmit={submitServicio}
            initial={svcSel}
            submitting={submittingSvc}
            mode={svcMode}
          />
        </TabsContent>

        {/* Categorías */}
        <TabsContent value="categorias" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Total: {cat.total}</div>
            <Button
              onClick={() => {
                setCatMode("create");
                setCatSel(undefined);
                setOpenCat(true);
              }}
            >
              Agregar categoría
            </Button>
          </div>
          <SimpleTable<Categoria>
            columns={[
              {
                key: "id_servicio",
                header: "Servicio",
                render: (r) =>
                  svc.items.find((s) => s.id === r.id_servicio)?.nombre ||
                  r.id_servicio,
              },
              { key: "nombre", header: "Nombre" },
              { key: "descripcion", header: "Descripción" },
              {
                key: "updated_at",
                header: "Actualizado",
                render: (r) => (
                  <Badge variant="secondary">
                    {new Date(r.updated_at).toLocaleString()}
                  </Badge>
                ),
                className: "text-right",
              },
            ]}
            rows={cat.items}
            loading={cat.loading}
            error={cat.error}
            page={cat.page}
            totalPages={cat.totalPages}
            onPrev={() => cat.setPage((p) => p - 1)}
            onNext={() => cat.setPage((p) => p + 1)}
            onEdit={(r) => {
              setCatMode("edit");
              setCatSel(r);
              setOpenCat(true);
            }}
            onDelete={(r) =>
              setToDelete({ type: "cat", id: r.id, label: r.nombre })
            }
          />
          <CategoriaFormModal
            open={openCat}
            onClose={() => setOpenCat(false)}
            onSubmit={submitCategoria}
            initial={catSel}
            servicios={svc.items}
            submitting={submittingCat}
            mode={catMode}
          />
        </TabsContent>

        {/* Subcategorías */}
        <TabsContent value="subcategorias" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Total: {sub.total}</div>
            <Button
              onClick={() => {
                setSubMode("create");
                setSubSel(undefined);
                setOpenSub(true);
              }}
            >
              Agregar subcategoría
            </Button>
          </div>
          <SimpleTable<Subcategoria>
            columns={[
              {
                key: "id_categoria",
                header: "Categoría",
                render: (r) =>
                  cat.items.find((c) => c.id === r.id_categoria)?.nombre ||
                  r.id_categoria,
              },
              { key: "nombre", header: "Nombre" },
              { key: "descripcion", header: "Descripción" },
              {
                key: "updated_at",
                header: "Actualizado",
                render: (r) => (
                  <Badge variant="secondary">
                    {new Date(r.updated_at).toLocaleString()}
                  </Badge>
                ),
                className: "text-right",
              },
            ]}
            rows={sub.items}
            loading={sub.loading}
            error={sub.error}
            page={sub.page}
            totalPages={sub.totalPages}
            onPrev={() => sub.setPage((p) => p - 1)}
            onNext={() => sub.setPage((p) => p + 1)}
            onEdit={(r) => {
              setSubMode("edit");
              setSubSel(r);
              setOpenSub(true);
            }}
            onDelete={(r) =>
              setToDelete({ type: "sub", id: r.id, label: r.nombre })
            }
          />
          <SubcategoriaFormModal
            open={openSub}
            onClose={() => setOpenSub(false)}
            onSubmit={submitSubcategoria}
            initial={subSel}
            categorias={cat.items}
            submitting={submittingSub}
            mode={subMode}
          />
        </TabsContent>
      </Tabs>

      {/* Confirmación global de borrado */}
      <AlertDialog
        open={!!toDelete}
        onOpenChange={(v) => {
          if (!v) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar{" "}
              {toDelete?.type === "svc"
                ? "servicio"
                : toDelete?.type === "cat"
                ? "categoría"
                : "subcategoría"}
              ?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acción no se puede deshacer. Se eliminará{" "}
            <b>{toDelete?.label}</b>.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!toDelete) return;
                try {
                  if (toDelete.type === "svc") await svc.remove(toDelete.id);
                  else if (toDelete.type === "cat") await cat.remove(toDelete.id);
                  else await sub.remove(toDelete.id);
                  setToDelete(null);
                } catch (e: unknown) {
                  const msg =
                    e instanceof Error ? e.message : "Error al eliminar";
                  alert(msg);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
