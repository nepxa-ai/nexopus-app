"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

type FormUser = {
  email: string;
  nombres: string;
  apellidos: string;
  password?: string; // requerido solo en creación
  rol: "admin" | "user";
  extension?: number; // -1 por defecto si no se envía
};

export function UserFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  mode = "create",
  submitting = false,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormUser) => Promise<void>;
  initial?: Partial<FormUser>;
  mode?: "create" | "edit";
  submitting?: boolean;
}) {
  const [form, setForm] = React.useState<FormUser>({
    email: "",
    nombres: "",
    apellidos: "",
    password: "",
    rol: "user",
    extension: -1,
  } as FormUser);

  React.useEffect(() => {
    if (open) {
      setForm({
        email: initial?.email || "",
        nombres: initial?.nombres || "",
        apellidos: initial?.apellidos || "",
        password: "", // nunca precargar
        rol: (initial?.rol as FormUser["rol"]) || "user",
        extension: typeof initial?.extension === "number" ? initial.extension : -1,
      });
    }
  }, [open, initial]);

  function set<K extends keyof FormUser>(key: K, value: FormUser[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // normaliza extension
    if (typeof form.extension !== "number" || Number.isNaN(form.extension)) {
      form.extension = -1;
    }
    await onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Agregar usuario" : "Editar usuario"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Nombres</Label>
            <Input value={form.nombres} onChange={(e) => set("nombres", e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>Apellidos</Label>
            <Input value={form.apellidos} onChange={(e) => set("apellidos", e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>

          {mode === "create" && (
            <div className="grid gap-2">
              <Label>Contraseña</Label>
              <Input type="password" value={form.password || ""} onChange={(e) => set("password", e.target.value)} required />
            </div>
          )}

          <div className="grid gap-2">
            <Label>Rol</Label>
            <Select value={form.rol} onValueChange={(v) => set("rol", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="user">user</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Extensión (−1 = sin extensión)</Label>
            <Input
              type="number"
              min={-1}
              max={9999}
              step={1}
              value={typeof form.extension === "number" ? form.extension : -1}
              onChange={(e) => set("extension", e.target.value === "" ? -1 : Number(e.target.value))}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : mode === "create" ? "Crear" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
