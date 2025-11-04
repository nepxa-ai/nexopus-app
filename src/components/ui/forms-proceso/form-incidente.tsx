"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, 
        SelectContent, 
        SelectItem, 
        SelectTrigger, 
        SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { opcionesITSM } from "@/components/ui/forms-proceso/opciones"

type Props = {
  item: any
  onSubmit?: (payload: any) => void
  readOnly?: boolean          // deshabilita inputs
  hideSubmit?: boolean        // oculta botón interno
}

/** ===== Helpers de normalización ===== */
const toTitle = (s?: string | null) =>
  (s ?? "").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase())

function normalizeToOption(value: string | undefined | null, options: string[], fallback: string) {
  if (!value || !String(value).trim()) return fallback
  const idx = options.findIndex((o) => o.toLowerCase() === String(value).toLowerCase())
  return idx >= 0 ? options[idx] : fallback
}

function mapStatusToEstado(status?: string | null) {
  const v = (status ?? "").toLowerCase()
  if (v.includes("active") || v.includes("open") || v.includes("abierto")) return "Abierto"
  if (v.includes("progress") || v.includes("en progreso")) return "En Progreso"
  if (v.includes("closed") || v.includes("cerrado")) return "Cerrado"
  return "Abierto"
}

/** Deriva el estado local desde el item del backend */
function deriveLocalStateFromItem(it: any) {
  // Soporta 'service' o 'r_service' (según tu API previa vs modelo SQLAlchemy)
  const servicioRaw = it?.r_service ?? it?.service
  const categoriaRaw = it?.category
  const subcatRaw   = it?.subcategory
  const detalleRaw  = it?.detalle
  const estadoRaw   = it?.status
  const equipoRaw   = it?.owner_team
  const urgenciaRaw = it?.urgency ?? it?.priority    // compatibilidad con respuestas previas
  const impactoRaw  = it?.impact ?? "Medio"          // si algún flujo lo envía
  const resumenRaw  = it?.asunto ?? it?.subject
  const descRaw     = it?.symptom

  // Cliente
  const nombre      = it?.nombre_cliente
  const correo      = it?.correo_cliente
  const empresa     = it?.empresa_cliente
  const vip         = Boolean(it?.is_vip)

  // Normalizaciones contra listas
  const servicio   = normalizeToOption(toTitle(servicioRaw),  opcionesITSM.servicio,   opcionesITSM.servicio[0])
  const categoria  = normalizeToOption(toTitle(categoriaRaw), opcionesITSM.categoria,  opcionesITSM.categoria[0])
  const subcategoria = normalizeToOption(toTitle(subcatRaw),  opcionesITSM.subcategoria, opcionesITSM.subcategoria[0])
  const estado     = normalizeToOption(mapStatusToEstado(estadoRaw), opcionesITSM.estado, "Abierto")
  const equipo     = normalizeToOption(toTitle(equipoRaw),   opcionesITSM.equipo,    opcionesITSM.equipo[0])
  const urgencia   = normalizeToOption(String(urgenciaRaw ?? "Medio"), opcionesITSM.urgencia, "Medio")
  const impacto    = normalizeToOption(String(impactoRaw ?? "Medio"),  opcionesITSM.impacto,  "Medio")

  // Prioridad visible (texto). El modelo usa urgency (string). Mantenemos prioridad como campo de UI.
  const prioridad  = String(it?.priority ?? it?.prioridad ?? (urgencia === "Alto" ? 1 : urgencia === "Medio" ? 2 : 3))

  return {
    // Cliente
    contacto: nombre ?? "",
    telefono: it?.telefono ?? "",
    correo: correo ?? "",
    vip,
    organizacion: empresa ?? "",
    nit: it?.nit ?? "",
    direccion: it?.direccion ?? "",
    // Servicio
    servicio,
    categoria,
    subcategoria,
    detalle: detalleRaw ?? "",
    estado,
    equipo,
    propietario: it?.propietario ?? "",
    urgencia,
    impacto,
    prioridad,
    // Incidente
    resumen: resumenRaw ?? "",
    descripcion: descRaw ?? "",
  }
}

/** Arma el payload para PATCH con las llaves del backend */
function buildPatchPayload(item: any, v: ReturnType<typeof deriveLocalStateFromItem>) {
  const payload ={
    // Conserva todo lo que venga del backend
    ...item,

    // Campos del modelo:
    service: v.servicio,      // (a.k.a service)
    category: v.categoria,
    subcategory: v.subcategoria,
    detalle: v.detalle,
    status: v.estado,
    owner_team: v.equipo,
    urgency: v.urgencia,
    // Si manejas priority paralelo, puedes incluirlo:
    priority: v.prioridad,

    // Texto incidente
    subject: v.resumen,
    symptom: v.descripcion,

    // Cliente
    is_vip: v.vip,
    nombre_cliente: v.contacto || item?.nombre_cliente,
    correo_cliente: v.correo || item?.correo_cliente,
    empresa_cliente: v.organizacion || item?.empresa_cliente,

    // Extras informativos (si decides persistirlos)
    //extra: {
    //  ...(item?.extra ?? {}),
    //  direccion: v.direccion,
    //  telefono: v.telefono,
    //  propietario: v.propietario,
   // },
  }

  console.log("PATCH payload incidente->", payload)

  return payload

}

export default function FormIncidente({ item, onSubmit, readOnly, hideSubmit }: Props) {
  // Estado inicial viene del item
  const initial = React.useMemo(() => deriveLocalStateFromItem(item ?? {}), [item])
  const [v, setV] = React.useState(initial)
  
  const [saving,setSaving] = React.useState(false)
  const [msg,setMsg] = React.useState<string|null>(null)

  // Rehidrata cuando cambie el item (GET nuevo)
  React.useEffect(() => {
    setV(deriveLocalStateFromItem(item ?? {}))
  }, [item])

  const disabled = !!readOnly

  return (
      <form className="flex flex-col gap-6" 
        onSubmit={async (e) => {
          e.preventDefault()
          const payload = buildPatchPayload(item, v)
          setSaving(true)
          setMsg(null)
          try {
            await Promise.resolve(onSubmit?.(payload))   // espera al submit real
            setMsg("Cambios guardados correctamente")
          } catch {
            setMsg("Error al guardar los cambios")
          } finally {
            setSaving(false)
          }
        }
        }
      >
      {/* ==================== INFORMACIÓN CLIENTE ==================== */}
      <h3 className="font-semibold">Información Cliente</h3>

      <div className="grid gap-4 md:grid-cols-1">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Contacto</Label>
          <Input disabled={disabled} value={v.contacto} onChange={(e) => setV((s) => ({ ...s, contacto: e.target.value }))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Teléfono</Label>
          <Input disabled={disabled} value={v.telefono} onChange={(e) => setV((s) => ({ ...s, telefono: e.target.value }))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Correo</Label>
          <Input disabled={disabled} type="email" value={v.correo} onChange={(e) => setV((s) => ({ ...s, correo: e.target.value }))} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">VIP</Label>
          <Switch disabled={disabled} checked={v.vip} onCheckedChange={(chk) => setV((s) => ({ ...s, vip: chk }))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Organización</Label>
          <Input disabled={disabled} value={v.organizacion} onChange={(e) => setV((s) => ({ ...s, organizacion: e.target.value }))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">NIT</Label>
          <Input disabled={disabled} value={v.nit} onChange={(e) => setV((s) => ({ ...s, nit: e.target.value }))} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground">Dirección</Label>
        <Input disabled={disabled} value={v.direccion} onChange={(e) => setV((s) => ({ ...s, direccion: e.target.value }))} />
      </div>

      <Separator />

      {/* ==================== INFORMACIÓN SERVICIO ==================== */}
      <h3 className="font-semibold">Información Servicio</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Servicio</Label>
          <Select value={v.servicio} onValueChange={(x) => setV((s) => ({ ...s, servicio: x }))} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Servicio" /></SelectTrigger>
            <SelectContent>
              {opcionesITSM.servicio.map((x) => (
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Categoría</Label>
          <Select value={v.categoria} onValueChange={(x) => setV((s) => ({ ...s, categoria: x }))} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              {opcionesITSM.categoria.map((x) => (<SelectItem key={x} value={x}>{x}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Subcategoría</Label>
          <Select value={v.subcategoria} onValueChange={(x) => setV((s) => ({ ...s, subcategoria: x }))} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Subcategoría" /></SelectTrigger>
            <SelectContent>
              {opcionesITSM.subcategoria.map((x) => (<SelectItem key={x} value={x}>{x}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Detalle</Label>
          <Input disabled={disabled} value={v.detalle} onChange={(e) => setV((s) => ({ ...s, detalle: e.target.value }))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select value={v.estado} onValueChange={(x) => setV((s) => ({ ...s, estado: x }))} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              {opcionesITSM.estado.map((x) => (
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Equipo</Label>
          <Select value={v.equipo} onValueChange={(x) => setV((s) => ({ ...s, equipo: x }))} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Equipo" /></SelectTrigger>
            <SelectContent>
              {opcionesITSM.equipo.map((x) => (
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Propietario</Label>
          <Input disabled={disabled} value={v.propietario} onChange={(e) => setV((s) => ({ ...s, propietario: e.target.value }))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Urgencia</Label>
          <Select value={v.urgencia} onValueChange={(x) => setV((s) => ({ ...s, urgencia: x }))} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Urgencia" /></SelectTrigger>
            <SelectContent>
              {opcionesITSM.urgencia.map((x) => (
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Impacto</Label>
          <Select value={v.impacto} onValueChange={(x) => setV((s) => ({ ...s, impacto: x }))} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Impacto" /></SelectTrigger>
            <SelectContent>
              {opcionesITSM.impacto.map((x) => (
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Prioridad</Label>
          <Input disabled={disabled} value={v.prioridad} onChange={(e) => setV((s) => ({ ...s, prioridad: e.target.value }))} />
        </div>

        <div className="md:col-span-2 flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Resumen</Label>
          <Input disabled={disabled} value={v.resumen} onChange={(e) => setV((s) => ({ ...s, resumen: e.target.value }))} />
        </div>
      </div>

      <Separator />

      {/* ==================== INFORMACIÓN INCIDENTE ==================== */}
      <h3 className="font-semibold">Información Incidente</h3>

      <div className="flex flex-col gap-2">
        <Label className="text-xs text-muted-foreground">Descripción</Label>
        <Textarea
          disabled={disabled}
          className="min-h-28"
          value={v.descripcion}
          onChange={(e) => setV((s) => ({ ...s, descripcion: e.target.value }))}
        />
      </div>

      {!hideSubmit && (
        <div className="flex justify-end gap-2 mt-6">
          <Button type="submit" variant="default" disabled={disabled || saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      )}
      {msg && <p className="text-sm text-green-600">{msg}</p>}
    </form>
  )
}
