"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { opcionesIncidente } from "./opciones"
// Si quieres tipar estrictamente el item, ajusta este tipo con tu schema real del backend
type Props = { item: any; onSubmit?: (payload: any) => void }

export default function FormIncidente({ item, onSubmit }: Props) {
  // ==================== ESTADO LOCAL ====================
  const [v, setV] = React.useState({
    // Cliente
    contacto: "Andrea Herrera",
    telefono: "3209928178",
    correo: "aherrera@elpais.com.co",
    vip: false,
    organizacion: "EL PAIS SA",
    nit: "890301752",
    direccion: "",
    // Servicio
    servicio: "Comunicaciones Avanzadas",
    categoria: "IPPBX",
    subcategoria: "IPPBX",
    detalle: "Correo electrónico principal",
    estado: "Cerrado",
    equipo: "Gestores Nivel 1",
    propietario: "jcastillo@opengroupsa.com",
    urgencia: "Medio",
    impacto: "Medio",
    prioridad: "2",
    // Incidente
    resumen: "Solicitud referente a la telefonía",
    descripcion:
      "1. Requerimos realizar un backup del servidor asterisk tanto de la aplicación como la base de datos...",
  })

  // ==================== HELPERS DE NORMALIZACIÓN ====================
  const toTitle = (s?: string | null) =>
    (s ?? "").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase())

  // Busca (case-insensitive) dentro de una lista y devuelve el valor normalizado o fallback
  function normalizeToOption(value: string | undefined, options: string[], fallback: string) {
    if (!value) return fallback
    const idx = options.findIndex((o) => o.toLowerCase() === value.toLowerCase())
    return idx >= 0 ? options[idx] : fallback
  }

  // Mapa status backend -> select estado local
  function mapStatusToEstado(status?: string | null) {
    const v = (status ?? "").toLowerCase()
    if (v.includes("active") || v.includes("open") || v.includes("abierto")) return "Abierto"
    if (v.includes("progress") || v.includes("en progreso")) return "En Progreso"
    if (v.includes("closed") || v.includes("cerrado")) return "Cerrado"
    return "Abierto"
  }

  // Si quieres usar prioridad numérica como "urgencia"
  function mapPriorityToUrgency(p?: string | number | null) {
    const n = typeof p === "string" ? parseInt(p, 10) : (p ?? 0)
    if (n === 1) return "Alto"
    if (n === 2) return "Medio"
    if (n === 3) return "Bajo"
    return "Medio"
  }

  // ==================== HIDRATAR FORM CON DATOS DEL BACKEND ====================
  React.useEffect(() => {
    if (!item) return
    // Ejemplo real del backend (curl):
    // {
    //  status_system, ticket, service, category, subcategory, detalle, profile_link,
    //  symptom, subject, owner_team, priority, status, source, is_vip,
    //  nombre_cliente, correo_cliente, empresa_cliente, id_dialvox_, ...
    // }
    const {
      service,
      category,
      subcategory,
      detalle,
      subject,
      symptom,
      owner_team,
      priority,
      status,
      is_vip,
      nombre_cliente,
      correo_cliente,
      empresa_cliente,
    } = item as any

    const servicio = normalizeToOption(toTitle(service), opcionesIncidente.servicio, opcionesIncidente.servicio[0])
    const categoria = normalizeToOption(toTitle(category), opcionesIncidente.categoria, opcionesIncidente.categoria[0])
    const subcategoria = normalizeToOption(
      toTitle(subcategory),
      opcionesIncidente.subcategoria,
      opcionesIncidente.subcategoria[0]
    )
    const estado = normalizeToOption(mapStatusToEstado(status), opcionesIncidente.estado, "Abierto")
    const equipo = normalizeToOption(toTitle(owner_team), opcionesIncidente.equipo, opcionesIncidente.equipo[0])
    const urgencia = normalizeToOption(mapPriorityToUrgency(priority), opcionesIncidente.urgencia, "Medio")
    const impacto = normalizeToOption("Medio", opcionesIncidente.impacto, "Medio") // si no viene del backend

    setV((prev) => ({
      ...prev,
      // Cliente
      contacto: nombre_cliente ?? prev.contacto,
      telefono: prev.telefono, // no viene en API: conserva default o integra cuando esté disponible
      correo: correo_cliente ?? prev.correo,
      vip: (is_vip ?? prev.vip) as boolean,
      organizacion: empresa_cliente ?? prev.organizacion,
      nit: prev.nit, // no viene en API
      direccion: prev.direccion, // no viene en API
      // Servicio
      servicio,
      categoria,
      subcategoria,
      detalle: detalle ?? prev.detalle,
      estado,
      equipo,
      propietario: prev.propietario, // mapea cuando lo exponga el backend
      urgencia,
      impacto,
      prioridad: String(priority ?? prev.prioridad),
      // Incidente
      resumen: subject ?? prev.resumen,
      descripcion: symptom ?? prev.descripcion,
    }))
  }, [item])

  // ==================== UI FORM ====================
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.({ ...item, ...v })
      }}
    >
      {/* ==================== INFORMACIÓN CLIENTE ==================== */}
      <h3 className="font-semibold">Información Cliente</h3>

      <div className="grid gap-4 md:grid-cols-1">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Contacto</Label>
          <Input value={v.contacto} onChange={(e) => setV((s) => ({ ...s, contacto: e.target.value }))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Teléfono</Label>
          <Input value={v.telefono} onChange={(e) => setV((s) => ({ ...s, telefono: e.target.value }))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Correo</Label>
          <Input type="email" value={v.correo} onChange={(e) => setV((s) => ({ ...s, correo: e.target.value }))} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">VIP</Label>
          <Switch checked={v.vip} onCheckedChange={(chk) => setV((s) => ({ ...s, vip: chk }))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Organización</Label>
          <Input value={v.organizacion} onChange={(e) => setV((s) => ({ ...s, organizacion: e.target.value }))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">NIT</Label>
          <Input value={v.nit} onChange={(e) => setV((s) => ({ ...s, nit: e.target.value }))} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground">Dirección</Label>
        <Input value={v.direccion} onChange={(e) => setV((s) => ({ ...s, direccion: e.target.value }))} />
      </div>

      <Separator />

      {/* ==================== INFORMACIÓN SERVICIO ==================== */}
      <h3 className="font-semibold">Información Servicio</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Servicio</Label>
          <Select value={v.servicio} onValueChange={(x) => setV((s) => ({ ...s, servicio: x }))}>
            <SelectTrigger><SelectValue placeholder="Servicio" /></SelectTrigger>
            <SelectContent>
              {opcionesIncidente.servicio.map((x) => (
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Categoría</Label>
          <Select value={v.categoria} onValueChange={(x) => setV((s) => ({ ...s, categoria: x }))}>
            <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              {opcionesIncidente.categoria.map((x) => (
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Subcategoría</Label>
          <Select value={v.subcategoria} onValueChange={(x) => setV((s) => ({ ...s, subcategoria: x }))}>
            <SelectTrigger><SelectValue placeholder="Subcategoría" /></SelectTrigger>
            <SelectContent>
              {opcionesIncidente.subcategoria.map((x) => (
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Detalle</Label>
          <Input value={v.detalle} onChange={(e) => setV((s) => ({ ...s, detalle: e.target.value }))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select value={v.estado} onValueChange={(x) => setV((s) => ({ ...s, estado: x }))}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              {opcionesIncidente.estado.map((x) => (
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Equipo</Label>
          <Select value={v.equipo} onValueChange={(x) => setV((s) => ({ ...s, equipo: x }))}>
            <SelectTrigger><SelectValue placeholder="Equipo" /></SelectTrigger>
            <SelectContent>
              {opcionesIncidente.equipo.map((x) => (
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Propietario</Label>
          <Input value={v.propietario} onChange={(e) => setV((s) => ({ ...s, propietario: e.target.value }))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Urgencia</Label>
          <Select value={v.urgencia} onValueChange={(x) => setV((s) => ({ ...s, urgencia: x }))}>
            <SelectTrigger><SelectValue placeholder="Urgencia" /></SelectTrigger>
            <SelectContent>
              {opcionesIncidente.urgencia.map((x) => (
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Impacto</Label>
          <Select value={v.impacto} onValueChange={(x) => setV((s) => ({ ...s, impacto: x }))}>
            <SelectTrigger><SelectValue placeholder="Impacto" /></SelectTrigger>
            <SelectContent>
              {opcionesIncidente.impacto.map((x) => (
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Prioridad</Label>
          <Input value={v.prioridad} onChange={(e) => setV((s) => ({ ...s, prioridad: e.target.value }))} />
        </div>

        <div className="md:col-span-2 flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Resumen</Label>
          <Input value={v.resumen} onChange={(e) => setV((s) => ({ ...s, resumen: e.target.value }))} />
        </div>
      </div>

      <Separator />

      {/* ==================== INFORMACIÓN INCIDENTE ==================== */}
      <h3 className="font-semibold">Información Incidente</h3>

      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground">Descripción</Label>
        <Textarea
          className="min-h-28"
          value={v.descripcion}
          onChange={(e) => setV((s) => ({ ...s, descripcion: e.target.value }))}
        />
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button type="submit" variant="default">
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}
