"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { fetchUsers, toggleActive, updateUser, createUser, deleteUser } from "@/lib/admin-api";
import { UserFormModal, type FormUser } from "./user-form-modal";
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

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const p = await fetchUsers(token, page, 20);
      setData(p.items);
      setTotal(p.total);
      setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  React.useEffect(() => {
  load();
}, [load]);

  async function onToggleActive(u: User, v: boolean) {
    if (!token) return;
    const updated = await toggleActive(token, u.id, v);
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

async function handleSubmitForm(payload: FormUser) {
  if (!token) return;
  setSubmitting(true);

  try {
    if (formMode === "create") {
      // aseguramos que haya password
      if (!payload.password) {
        setError("La contraseña es obligatoria para crear un usuario");
        return;
      }

      await createUser(token, {
        email: payload.email,
        password: payload.password, // aquí ya es string, no undefined
        nombres: payload.nombres,
        apellidos: payload.apellidos,
        rol: payload.rol,
        extension: payload.extension,
      });
    } else if (selected) {
      await updateUser(token, selected.id, {
        email: payload.email,
        nombres: payload.nombres,
        apellidos: payload.apellidos,
        rol: payload.rol,
        extension: payload.extension,
        // no mandas password si no quieres cambiarla
      });
    }

    // cerrar modal y refrescar tabla
    setOpenForm(false);
    setSelected(null);
    await load();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al guardar";
    alert(msg);
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al eliminar";
      alert(msg);
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
              <th className="p-3 text-left">Extensión</th>
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
                <td className="p-3">{u.extension === -1 ? "—" : u.extension}</td>
                <td className="p-3 text-center">
                  <Switch checked={u.activo} onCheckedChange={(v)=>onToggleActive(u, v)} />
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

      {/* modal form */}
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
