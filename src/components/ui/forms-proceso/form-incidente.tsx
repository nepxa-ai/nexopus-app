"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { CaseItem } from "./types"
import { opcionesIncidente } from "./opciones"

type Props = { item: CaseItem; onSubmit?: (payload: any) => void }

export default function FormIncidente({ item, onSubmit }: Props) {
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
