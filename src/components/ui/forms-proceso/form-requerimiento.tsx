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
  item?: any
  onSubmit?: (payload: any) => void
  readOnly?: boolean
  hideSubmit?: boolean
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

/** Deriva estado local conservando la estructura del formulario de Requerimiento */
function deriveLocalStateFromItem(it: any) {
  // Serv/Clasificación (acepta service|r_service para compat)
  const servicioRaw   = it?.r_service ?? it?.service
  const categoriaRaw  = it?.category
  const subcatRaw     = it?.subcategory
  const estadoRaw     = it?.status
  const equipoRaw     = it?.owner_team
  const urgenciaRaw   = it?.urgency ?? it?.priority

  // Solicitud
  const asuntoRaw     = it?.asunto ?? it?.subject
  const descRaw       = it?.descripcion ?? it?.symptom

  // Cliente y propietario
  const cliente       = it?.nombre_cliente ?? it?.cliente
  const correoCliente = it?.correo_cliente ?? it?.correoCliente
  const telefono      = it?.telefono
  const vip           = Boolean(it?.is_vip ?? it?.vip ?? false)
  const organizacion  = it?.empresa_cliente ?? it?.organizacion
  const nit           = it?.nit
  const ciudad        = it?.ciudad
  const direccion     = it?.direccion
  const propietario   = it?.propietario

  // Normalizaciones
  const servicio   = normalizeToOption(toTitle(servicioRaw),  opcionesITSM.servicio, opcionesITSM.servicio[0])
  const categoria  = normalizeToOption(toTitle(categoriaRaw), opcionesITSM.categoria, opcionesITSM.categoria[0])
  const subcategoria = normalizeToOption(toTitle(subcatRaw),  opcionesITSM.subcategoria, opcionesITSM.subcategoria[0])
  const estado     = normalizeToOption(mapStatusToEstado(estadoRaw), opcionesITSM.estado, "Abierto")
  const equipo     = normalizeToOption(toTitle(equipoRaw),   opcionesITSM.equipo, opcionesITSM.equipo[0])
  const urgencia   = normalizeToOption(String(urgenciaRaw ?? "Medio"), opcionesITSM.urgencia, "Medio")


  return {
    // Cliente y Propietario
    cliente,
    correoCliente,
    telefono,
    vip,
    organizacion,
    nit,
    ciudad,
    direccion,
    propietario,
    // Servicio
    servicio,
    categoria,
    subcategoria,
    estado,
    equipo,
    urgencia,
    // Solicitud
    asunto: asuntoRaw,
    descripcion: descRaw,
    // Adjuntos (si vienen, los preservamos fuera de la UI)
    adjuntos: Array.isArray(it?.adjuntos) ? it?.adjuntos : [],
  }
}

/** Arma el payload alineado con el backend (similar a Incidente) */
function buildPatchPayload(item: any, v: ReturnType<typeof deriveLocalStateFromItem>) {
  return {
    ...item,
    // Modelo estandarizado
    r_service: v.servicio,
    category: v.categoria,
    subcategory: v.subcategoria,
    status: v.estado,
    owner_team: v.equipo,
    urgency: v.urgencia,

    // Texto/campos de solicitud
    asunto: v.asunto,
    symptom: v.descripcion,

    // Cliente
    is_vip: v.vip,
    nombre_cliente: v.cliente || item?.nombre_cliente,
    correo_cliente: v.correoCliente || item?.correo_cliente,
    empresa_cliente: v.organizacion || item?.empresa_cliente,

    // Propietario/otros
    propietario: v.propietario,

    // Extras informativos sin romper el esquema
    extra: {
      ...(item?.extra ?? {}),
      nit: v.nit,
      ciudad: v.ciudad,
      direccion: v.direccion,
      telefono: v.telefono,
    },
  }
}

export default function FormRequerimiento({ item, onSubmit, readOnly, hideSubmit }: Props) {
  const initial = React.useMemo(() => deriveLocalStateFromItem(item ?? {}), [item])
  const [v, setV] = React.useState(initial)

  const [saving,setSaving] = React.useState(false)
  const [msg,setMsg] = React.useState<string|null>(null)

  React.useEffect(() => {
    setV(deriveLocalStateFromItem(item ?? {}))
  }, [item])

  const disabled = !!readOnly

  return (
    <form className="flex flex-col gap-6" onSubmit={async (e) => {
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

      {/* ==================== CLIENTE Y PROPIETARIO ==================== */}
      <h3 className="font-semibold">Información cliente</h3>
      
      <div className="grid gap-4 md:grid-cols-1">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cliente" className="text-xs text-muted-foreground">Cliente/Contacto</Label>
          <Input id="cliente" disabled={disabled} value={v.cliente} onChange={(e)=>setV(s=>({...s, cliente:e.target.value}))} />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Correo</Label>
          <Input disabled={disabled} type="email" value={v.correoCliente} onChange={(e) => setV((s) => ({ ...s, correo: e.target.value }))} />
        </div>
      </div>

      
      <div className="grid gap-4 md:grid-cols-3">


        {/*}
        <div className="flex flex-col gap-2">
          <Label htmlFor="telefono" className="text-xs text-muted-foreground">Teléfono</Label>
          <Input id="telefono" disabled={disabled} type="tel" inputMode="tel" value={v.telefono}
            onChange={(e)=>setV(s=>({...s, telefono:e.target.value}))} />
        </div> */}

        <div className="flex flex-col gap-2">
          <Label htmlFor="organizacion" className="text-xs text-muted-foreground">Organización</Label>
          <Input id="organizacion" disabled={disabled} value={v.organizacion} onChange={(e)=>setV(s=>({...s, organizacion:e.target.value}))} />
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">VIP</Label>
          <Switch disabled={disabled} checked={v.vip} onCheckedChange={(vip)=>setV(s=>({...s, vip}))} />
        </div>
        
        {/*
        <div className="flex flex-col gap-2">
          <Label htmlFor="nit" className="text-xs text-muted-foreground">NIT</Label>
          <Input id="nit" disabled={disabled} value={v.nit} onChange={(e)=>setV(s=>({...s, nit:e.target.value}))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="ciudad" className="text-xs text-muted-foreground">Ciudad</Label>
          <Input id="ciudad" disabled={disabled} value={v.ciudad} onChange={(e)=>setV(s=>({...s, ciudad:e.target.value}))} />
        </div>

        <div className="md:col-span-2 flex flex-col gap-2">
          <Label htmlFor="direccion" className="text-xs text-muted-foreground">Dirección</Label>
          <Input id="direccion" disabled={disabled} value={v.direccion}
            onChange={(e)=>setV(s=>({...s, direccion:e.target.value}))} />
        </div>
        */}

      </div>

      <Separator />

      {/* ==================== INFORMACIÓN SERVICIO ==================== */}
      <h3 className="font-semibold">Información Servicio</h3>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Servicio */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Servicio</Label>
          <Select value={v.servicio} onValueChange={(servicio)=>setV(s=>({...s, servicio}))} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Seleccione servicio" /></SelectTrigger>
            <SelectContent className="z-[60]">
              {opcionesITSM.servicio.map((x)=>(<SelectItem key={x} value={x}>{x}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {/* Categoría */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Categoría</Label>
          <Select value={v.categoria} onValueChange={(categoria)=>setV(s=>({...s, categoria}))} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent className="z-[60]">
              {opcionesITSM.categoria.map((x)=>(<SelectItem key={x} value={x}>{x}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {/* SubCategoría */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">SubCategoría</Label>
          <Select value={v.subcategoria} onValueChange={(subcategoria)=>setV(s=>({...s, subcategoria}))} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="SubCategoría" /></SelectTrigger>
            <SelectContent>
              {opcionesITSM.subcategoria.map((x)=>(<SelectItem key={x} value={x}>{x}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      
      </div>

      <div className="grid gap-4 md:grid-cols-2">

        {/* Estado */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select value={v.estado} onValueChange={(estado)=>setV(s=>({...s, estado}))} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              {opcionesITSM.estado.map((x)=>(<SelectItem key={x} value={x}>{x}</SelectItem>))}
            </SelectContent>
          </Select>
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

        {/* Equipo */}
        

      </div>
      
      <div className="grid gap-4 md:grid-cols-2">

        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Equipo</Label>
          <Select value={v.equipo} onValueChange={(equipo)=>setV(s=>({...s, equipo}))} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Equipo" /></SelectTrigger>
            <SelectContent>
              {opcionesITSM.equipo.map((x)=>(<SelectItem key={x} value={x}>{x}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="propietario" className="text-xs text-muted-foreground">Propietario</Label>
          <Input id="propietario" disabled={disabled} value={v.propietario}
            onChange={(e)=>setV(s=>({...s, propietario:e.target.value}))} />
        </div>
      </div>

      <Separator />

      {/* ==================== INFORMACIÓN SOLICITUD ==================== */}
      <h3 className="font-semibold">Información Solicitud</h3>

      <div className="md:col-span-2 flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="asunto" className="text-xs text-muted-foreground">Asunto</Label>
          <Input id="asunto" disabled={disabled} value={v.asunto} onChange={(e)=>setV(s=>({...s, asunto:e.target.value}))} />
        </div>

        <div className="md:col-span-2 flex flex-col gap-2">
          <Label htmlFor="descripcion" className="text-xs text-muted-foreground">Descripción</Label>
          <Textarea id="descripcion" className="min-h-40" disabled={disabled}
            value={v.descripcion}
            onChange={(e)=>setV(s=>({...s, descripcion:e.target.value}))} />
        </div>
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