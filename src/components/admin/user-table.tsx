"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { fetchUsers, toggleActive, updateUser, createUser, deleteUser } from "@/lib/admin-api";
import { UserFormModal } from "./user-form-modal";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

type User = Awaited<ReturnType<typeof fetchUsers>>["items"][number];

export function UsersTable() {
  const [token, setToken] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<User[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // modales
  const [openForm, setOpenForm] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create"|"edit">("create");
  const [selected, setSelected] = React.useState<User | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // eliminar
  const [openDelete, setOpenDelete] = React.useState(false);

  React.useEffect(() => {
    const t = localStorage.getItem("access_token");
    setToken(t);
  }, []);

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const p = await fetchUsers(token, page, 20);
      setData(p.items);
      setTotal(p.total);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, [token, page]);

  async function onToggleActive(u: User, v: boolean) {
    if (!token) return;
    await toggleActive(token, u.id, v);
    setData(prev => prev.map(x => x.id === u.id ? { ...x, is_active: v } : x));
  }

  async function onInlineEdit(u: User, partial: Partial<Pick<User,"nombres"|"apellidos"|"email"|"rol">>) {
    if (!token) return;
    const updated = await updateUser(token, u.id, partial);
    setData(prev => prev.map(x => x.id === u.id ? updated : x));
  }

  function openCreate() {
    setFormMode("create");
    setSelected(null);
    setOpenForm(true);
  }
  function openEdit(u: User) {
    setFormMode("edit");
    setSelected(u);
    setOpenForm(true);
  }
  async function handleSubmitForm(payload: any) {
    if (!token) return;
    setSubmitting(true);
    try {
      if (formMode === "create") {
        await createUser(token, payload);
      } else if (selected) {
        await updateUser(token, selected.id, {
          email: payload.email,
          nombres: payload.nombres,
          apellidos: payload.apellidos,
          rol: payload.rol,
        });
      }
      setOpenForm(false);
      await load();
    } catch (e: any) {
      alert(e.message || "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  }

  function askDelete(u: User) {
    setSelected(u);
    setOpenDelete(true);
  }
  async function confirmDelete() {
    if (!token || !selected) return;
    try {
      await deleteUser(token, selected.id);
      setOpenDelete(false);
      await load();
    } catch (e: any) {
      alert(e.message || "Error al eliminar");
    }
  }

  if (loading) return <div className="p-4">Cargando…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-4">
      {/* barra superior */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Total usuarios: {total}</div>
        <Button onClick={openCreate}>Agregar usuario</Button>
      </div>

      {/* tabla */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Apellido</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Rol</th>
              <th className="p-3">Activo</th>
              <th className="p-3 text-right">Creado</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.nombres}</td>
                <td className="p-3">{u.apellidos}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.rol}</td>
                <td className="p-3 text-center">
                  <Switch checked={u.is_active} onCheckedChange={(v)=>onToggleActive(u, v)} />
                </td>
                <td className="p-3 text-right">
                  <Badge variant="secondary">{new Date(u.fecha_creado).toLocaleDateString()}</Badge>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={()=>openEdit(u)}>Editar</Button>
                    <Button size="sm" variant="destructive" onClick={()=>askDelete(u)}>Eliminar</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* paginación */}
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</Button>
        <div className="text-sm">Página {page} de {totalPages}</div>
        <Button variant="outline" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Siguiente</Button>
      </div>

      {/* modal form (crear/editar) */}
      <UserFormModal
        open={openForm}
        onClose={()=>setOpenForm(false)}
        onSubmit={handleSubmitForm}
        initial={selected ?? undefined}
        mode={formMode}
        submitting={submitting}
      />

      {/* confirm delete */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acción no se puede deshacer. Se eliminará el usuario <b>{selected?.email}</b>.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}