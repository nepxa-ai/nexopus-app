// src/app/account/page.tsx
"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { fetchMe, patchMe, Me } from "@/lib/api-users"
import { toast } from "sonner"

export default function AccountPage() {
  const [me, setMe] = React.useState<Me | null>(null)
  const [saving, setSaving] = React.useState(false)

  const [nombres, setNombres] = React.useState("")
  const [apellidos, setApellidos] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [password2, setPassword2] = React.useState("")

  React.useEffect(() => {
    fetchMe()
      .then((data) => {
        setMe(data)
        setNombres(data.nombres ?? "")
        setApellidos(data.apellidos ?? "")
      })
      .catch(() => toast.error("No se pudo cargar tu perfil"))
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password && password !== password2) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    setSaving(true)
    try {
      const payload: any = { nombres, apellidos }
      if (password) payload.password = password
      const updated = await patchMe(payload)
      setMe(updated)
      setPassword(""); setPassword2("")
      toast.success("Perfil actualizado")
    } catch {
      toast.error("Error al actualizar")
    } finally {
      setSaving(false)
    }
  }

  if (!me) return <div className="p-6">Cargando…</div>

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Mi cuenta</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nombre</Label>
            <Input value={nombres} onChange={(e) => setNombres(e.target.value)} />
          </div>
          <div>
            <Label>Apellido</Label>
            <Input value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
          </div>
        </section>

        <Separator />

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Email (solo lectura)</Label>
            <Input value={me.email} disabled />
          </div>
          <div>
            <Label>Rol (solo lectura)</Label>
            <Input value={me.rol} disabled />
          </div>
          <div>
            <Label>Extensión (solo lectura)</Label>
            <Input value={me.extension ?? "—"} disabled />
          </div>
          <div>
            <Label>Activo (solo lectura)</Label>
            <Input value={me.activo ? "Sí" : "No"} disabled />
          </div>
        </section>

        <Separator />

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nueva contraseña</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label>Confirmar contraseña</Label>
            <Input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
          </div>
          <p className="text-sm text-muted-foreground md:col-span-2">
            Déjalo en blanco si no deseas cambiar la contraseña.
          </p>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  )
}
