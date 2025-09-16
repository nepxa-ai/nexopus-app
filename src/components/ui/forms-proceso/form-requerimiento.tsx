"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

type Props = { onSubmit?: (payload: any) => void }

const opciones = {
  servicio: ["Configuraciones NGFW", "Soporte Endpoints", "Redes", "Comunicaciones Avanzadas"],
  categoria: ["Configuraciones NGFW", "IPS/IDS", "VPN", "Políticas UTM"],
  subcategoria: ["Alta disponibilidad", "Reglas", "NAT", "Reportes"],
  estado: ["Abierto", "En progreso", "Cerrado", "Pendiente"],
  equipo: ["Gestores Nivel 1", "Gestores Nivel 2", "Seguridad", "Redes"],
  urgencia: ["Bajo", "Medio", "Alto", "Crítico"],
} as const

export default function FormPeticionServicio({ onSubmit }: Props) {
  const [v, setV] = React.useState({
    // Cliente y Propietario
    cliente: "Jamer Espitia",
    correoCliente: "heespitia@centroaguas.com",
    telefono: "3167012795",
    vip: false,
    organizacion: "CENTRO AGUAS SA ESP",
    nit: "821002115-6",
    ciudad: "",
    direccion: "",
    // Servicio
    servicio: "none",        // <-- antes era ""
    categoria: "Configuraciones NGFW",
    subcategoria: "none",    // <-- antes era ""
    estado: "Cerrado",
    equipo: "Gestores Nivel 1",
    propietario: "nportilla@opengroupsa.com",
    urgencia: "Bajo",
    // Solicitud
    asunto: "",
    descripcion:
      "Realice sus solicitudes de servicios, información, nuevas configuraciones o cambios en sus dispositivos de Firewall de Nueva Generación NGFW-UTM.",
    // Adjuntos (mock)
    adjuntos: [
      { name: "CAguasYoutube3.jpg", by: "nportilla@opengroupsa..." },
      { name: "CAguasYoutube2.jpg", by: "nportilla@opengroupsa..." },
    ],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(v)
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {/* HEADER */}

      {/* ==================== INFORMACIÓN CLIENTE ==================== */}
      <h3 className="font-semibold">Cliente y Propietario</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cliente" className="text-xs text-muted-foreground">Cliente</Label>
          <Input id="cliente" value={v.cliente} onChange={(e)=>setV(s=>({...s, cliente:e.target.value}))} />
          <div className="text-xs text-muted-foreground">{v.correoCliente}</div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="telefono" className="text-xs text-muted-foreground">Teléfono</Label>
          <Input id="telefono" type="tel" inputMode="tel" value={v.telefono}
            onChange={(e)=>setV(s=>({...s, telefono:e.target.value}))} />
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">VIP</Label>
          <Switch checked={v.vip} onCheckedChange={(vip)=>setV(s=>({...s, vip}))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="organizacion" className="text-xs text-muted-foreground">Organización</Label>
          <Input id="organizacion" value={v.organizacion}
            onChange={(e)=>setV(s=>({...s, organizacion:e.target.value}))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="nit" className="text-xs text-muted-foreground">NIT</Label>
          <Input id="nit" value={v.nit} onChange={(e)=>setV(s=>({...s, nit:e.target.value}))} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="ciudad" className="text-xs text-muted-foreground">Ciudad</Label>
          <Input id="ciudad" value={v.ciudad} onChange={(e)=>setV(s=>({...s, ciudad:e.target.value}))} />
        </div>

        <div className="md:col-span-2 flex flex-col gap-2">
          <Label htmlFor="direccion" className="text-xs text-muted-foreground">Dirección</Label>
          <Input id="direccion" value={v.direccion}
            onChange={(e)=>setV(s=>({...s, direccion:e.target.value}))} />
        </div>
      </div>

      <Separator />

      {/* ==================== INFORMACIÓN SERVICIO ==================== */}
      <h3 className="font-semibold">Información Servicio</h3>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Servicio */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Servicio</Label>
          <Select value={v.servicio} onValueChange={(servicio)=>setV(s=>({...s, servicio}))}>
            <SelectTrigger><SelectValue placeholder="Seleccione servicio" /></SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
              <SelectItem value="none">—</SelectItem>
              {opciones.servicio.map((x)=>(
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categoría */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Categoría</Label>
          <Select value={v.categoria} onValueChange={(categoria)=>setV(s=>({...s, categoria}))}>
            <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
              {opciones.categoria.map((x)=>(
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* SubCategoría */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">SubCategoría</Label>
          <Select value={v.subcategoria} onValueChange={(subcategoria)=>setV(s=>({...s, subcategoria}))}>
            <SelectTrigger><SelectValue placeholder="SubCategoría" /></SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
              <SelectItem value="none">—</SelectItem>
              {opciones.subcategoria.map((x)=>(
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estado */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select value={v.estado} onValueChange={(estado)=>setV(s=>({...s, estado}))}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
              {opciones.estado.map((x)=>(
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Equipo */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Equipo</Label>
          <Select value={v.equipo} onValueChange={(equipo)=>setV(s=>({...s, equipo}))}>
            <SelectTrigger><SelectValue placeholder="Equipo" /></SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
              {opciones.equipo.map((x)=>(
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Propietario */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="propietario" className="text-xs text-muted-foreground">Propietario</Label>
          <Input id="propietario" value={v.propietario}
            onChange={(e)=>setV(s=>({...s, propietario:e.target.value}))} />
        </div>

        {/* Urgencia */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Urgencia</Label>
          <Select value={v.urgencia} onValueChange={(urgencia)=>setV(s=>({...s, urgencia}))}>
            <SelectTrigger><SelectValue placeholder="Urgencia" /></SelectTrigger>
            <SelectContent position="popper" className="z-[60]">
              {opciones.urgencia.map((x)=>(
                <SelectItem key={x} value={x}>{x}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* ==================== INFORMACIÓN SOLICITUD ==================== */}
      <h3 className="font-semibold">Información Solicitud</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="asunto" className="text-xs text-muted-foreground">Asunto</Label>
          <Input id="asunto" value={v.asunto} onChange={(e)=>setV(s=>({...s, asunto:e.target.value}))} />
        </div>

        <div className="md:col-span-2 flex flex-col gap-2">
          <Label htmlFor="descripcion" className="text-xs text-muted-foreground">Descripción</Label>
          <Textarea id="descripcion" className="min-h-40"
            value={v.descripcion}
            onChange={(e)=>setV(s=>({...s, descripcion:e.target.value}))} />
        </div>
      </div>

    </form>
  )
}
