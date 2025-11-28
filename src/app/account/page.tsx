// src/app/account/page.tsx
"use client"

import * as React from "react"
import type { CSSProperties } from "react"
import { useRouter } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { fetchMe, patchMe, Me } from "@/lib/api-users"
import { fetchAuthMe } from "@/lib/api-auth"
import { toast } from "sonner"

type UpdateMePayload = {
  nombres: string
  apellidos: string
  password?: string
}

export default function AccountPage() {
  const router = useRouter()

  const [layoutReady, setLayoutReady] = React.useState(false)
  const [me, setMe] = React.useState<Me | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [nombres, setNombres] = React.useState("")
  const [apellidos, setApellidos] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [password2, setPassword2] = React.useState("")

  // 1) Verificar que haya sesión (cualquier rol)
  React.useEffect(() => {
    fetchAuthMe()
      .then(() => setLayoutReady(true))
      .catch(() => router.replace("/login"))
  }, [router])

  // 2) Cargar datos de perfil cuando el layout ya está listo
  React.useEffect(() => {
    if (!layoutReady) return

    fetchMe()
      .then((data) => {
        setMe(data)
        setNombres(data.nombres ?? "")
        setApellidos(data.apellidos ?? "")
        setError(null)
      })
      .catch((err) => {
        console.error("Error en fetchMe:", err)
        setError("No se pudo cargar tu perfil. Verifica que hayas iniciado sesión.")
        toast.error("No se pudo cargar tu perfil")
      })
  }, [layoutReady])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password && password !== password2) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    setSaving(true)
    try {
      const payload: UpdateMePayload = { nombres, apellidos }
      if (password) payload.password = password
      const updated = await patchMe(payload)
      setMe(updated)
      setPassword("")
      setPassword2("")
      toast.success("Perfil actualizado")
    } catch (err) {
      console.error("Error en patchMe:", err)
      toast.error("Error al actualizar")
    } finally {
      setSaving(false)
    }
  }

  // Mientras validamos sesión, no mostramos nada (igual que en AdminPage)
  if (!layoutReady) return null

  // Error al cargar perfil
  if (error) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Mi cuenta</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-red-500">{error}</p>
                        <Button variant="outline" onClick={() => location.reload()}>
                          Reintentar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Perfil aún cargando
  if (!me) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Mi cuenta</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-6">Cargando…</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Render normal con layout + formulario dentro de Card
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mi cuenta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={onSubmit} className="space-y-6">
                      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nombre</Label>
                          <Input
                            value={nombres}
                            onChange={(e) => setNombres(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Apellido</Label>
                          <Input
                            value={apellidos}
                            onChange={(e) => setApellidos(e.target.value)}
                          />
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
                          <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Confirmar contraseña</Label>
                          <Input
                            type="password"
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
                          />
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
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
