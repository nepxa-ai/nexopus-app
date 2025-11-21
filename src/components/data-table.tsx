"use client"
import * as React from "react"
import { z } from "zod"
import { toast } from "sonner"

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"

import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconRobot,
  IconUser,
  IconX
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"


import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Tabs, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription, 
  DialogClose
} from "@/components/ui/dialog"

import { fetchWebhookEvents, type PaginatedWebhooks } from "@/lib/api-webhooks"
import { fetchUserByExtensionLite } from "@/lib/api-users"
import { fetchIncidentByDialvox, updateIncidentByDialvox, sendIncidentToITSM } from "@/lib/api-incidents"
import { fetchRequestByDialvox, updateRequestByDialvox, sendRequestToITSM } from "@/lib/api-requirements"
import { fetchFPQRSByDialvox, updateFPQRSByDialvox, sendFPQRSToITSM} from "@/lib/api-fpqrs"
import { postFinLlamadaDirect } from "@/lib/api-webhooks-flujos";

import FormIncidente, {
  type IncidentItem,
} from "@/components/ui/forms-proceso/form-incidente"
import FormRequerimiento, {
  type ServiceRequestItem,
} from "@/components/ui/forms-proceso/form-requerimiento"
import FormFPQRS, {
  type FpqrsItem,
} from "@/components/ui/forms-proceso/form-fpqrs"


// ============================
// Utils
// ============================

export type TipoSolicitud = 
  | "Incidente"
  | "Requerimiento"
  | "Consulta de caso"
  | "fpqrs"
  | "none";


const TZ = "America/Bogota"
const dtf = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: TZ,
})

function fmtDT(value?: string | null) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return dtf.format(d)
}

function secondsToHMS(total?: number | null) {
  const s = Math.max(0, Number(total ?? 0) | 0)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${m}:${pad(ss)}`
}

function fmtTimecode(msFromStart: number) {
  const totalSeconds = msFromStart / 1000
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  const d = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 10)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(m)}:${pad(s)}.${d}`
}

function toMs(ts: number | string | undefined) {
  const n = Number(ts ?? NaN)
  if (!Number.isFinite(n)) return NaN
  return n > 1e12 ? n : n * 1000
}


function normalizeTipoSolicitudRaw(t?: string | null): TipoSolicitud {
  const s = (t ?? "").toLowerCase().trim()
  if (s === "-" || s === "" || s === "na" || s === "n/a") return "none"
  if (s.includes("inc")) return "Incidente"
  if (s.includes("req")) return "Requerimiento"
  if (s.includes("consult")) return "Consulta de caso"
  if (s.includes("fpqrs")) return "fpqrs"
  return "none"
}


// ============================
// Schema (nota: extension -> coerce.number)
// ============================
const schema = z.object({
  id: z.number(),
  id_dialvox_: z.number().nullable(),
  id_llamada: z.string().nullable(),
  phone: z.string().nullable(),
  duration_sec: z.number().nullable(),
  extension: z.coerce.number().nullable(), // 👈 importante si llega "1234" como string
  ticket_ivanti: z.string().nullable(),
  nombre_cliente: z.string().nullable(),
  numero_caso: z.string().nullable(),
  estado_caso: z.string().nullable(),
  tipo_solicitud: z.string().nullable(),
  es_vip: z.boolean().nullable(),
  empresa_cliente: z.string().nullable(),
  correo_cliente: z.string().nullable(),
  producto: z.string().nullable(),
  servicio: z.string().nullable(),
  prioridad: z.number().nullable(),
  en_horario: z.boolean().nullable(),
  extracted_variables: z.any().nullable(),
  contratos_empresa: z.any().nullable(),
  transcript_text: z.string().nullable(),
  transcript_url: z.string().nullable(),
  recording_url: z.string().nullable(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  transcript: z.any().nullable(),
  body: z
    .object({
      transcript: z
        .object({
          transcript: z.any().optional(),
        })
        .optional(),
    })
    .optional(),
})
type RowType = z.infer<typeof schema>

// ============================
// Filtros custom
// ============================
type DateRange = { from?: string; to?: string }

const dateRangeFilter = (
  row: Row<RowType>,
  columnId: string,
  value?: DateRange
) => {
  if (!value || (!value.from && !value.to)) return true

  // Acceso tip-safe al valor de la celda
  const raw = (row.original as Record<string, unknown>)[columnId]

  let ts = NaN
  if (raw instanceof Date) {
    ts = raw.getTime()
  } else if (typeof raw === "string" || typeof raw === "number") {
    ts = new Date(raw).getTime()
  }

  if (Number.isNaN(ts)) return false

  const fromOk = value.from ? ts >= new Date(value.from).getTime() : true
  const toOk = value.to ? ts <= new Date(value.to).getTime() : true
  return fromOk && toOk
}

const booleanTriStateFilter = (
  row: Row<RowType>,
  columnId: string,
  value?: "all" | "true" | "false"
) => {
  if (!value || value === "all") return true

  const raw = (row.original as Record<string, unknown>)[columnId]
  const bool = Boolean(raw)

  return value === "true" ? bool : !bool
}

// ============================
// Drawer de detalle (Id atención)
// ============================
// 

type TicketRecord = {
  ticket?: string
  ticket_number?: string
  [key: string]: unknown
}


function IncidentDialog({ row, onAfterChange }: { row: RowType; onAfterChange?: () => void }){
  const [loading, setLoading] = React.useState(false)
  const [incident, setIncident] = React.useState<TicketRecord  | null>(null)
  const [editing, setEditing] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [ticket, setTicket] = React.useState<string | null>(null) // ← Nuevo estado

  const headerText = (row.id_dialvox_ != null ? String(row.id_dialvox_) : null) ?? row.id_llamada ?? "—"

  async function load() {
    if (!row.id_dialvox_) return
    setLoading(true)
    try {
      const res = await fetchIncidentByDialvox(row.id_dialvox_)
      setIncident(res)
      // si ya existe ticket en DB lo mostramos
      if (res.ticket || res.ticket_number) setTicket(res.ticket || res.ticket_number)
    } catch {
      toast.error("No se pudo cargar el incidente")
    } finally {
      setLoading(false)
    }
  }

  async function aprobar() {
    const id = row.id_dialvox_
    if (!id) {
      toast.error("No hay id_dialvox")
      return
    }
    try {
      const response = await sendIncidentToITSM({ id_dialvox_: String(id) })
      // Guarda el ticket si la API lo devuelve
      if (response.ticket || response.ticket_number)
        setTicket(response.ticket || response.ticket_number)
      toast.success("Incidente aprobado y enviado a n8n")
      onAfterChange?.()
    } catch {
      toast.error("Error enviando a n8n")
    }
  }

  async function guardarYEnviar(payload?: Record<string, unknown>) {
    if (!row.id_dialvox_) return
    try {
      if (!payload || Object.keys(payload).length === 0) {
        toast.error("No hay cambios para enviar")
        return
      }
      const patched = await updateIncidentByDialvox(row.id_dialvox_, payload)
      setIncident(patched)
      toast.success("Incidente actualizado")

      //const response = await sendIncidentToITSM(patched)
      //if (response.ticket || response.ticket_number)
      //  setTicket(response.ticket || response.ticket_number)

      //toast.success("Enviado a n8n")
      //setEditing(false)
      //onAfterChange?.()
    } catch {
      toast.error("Error al actualizar o enviar")
    }
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open && !incident && !loading) load()
        if (!open) { setEditing(false);setSaved(false) }
      }} 
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 rounded-full">
          <Badge variant="outline" className="px-1.5 text-muted-foreground">
            Incidente
          </Badge>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl p-0">
        {/* Cabecera */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4">
          <div className="relative flex items-center justify-between pr-10">
            {/* Título */}
            <DialogHeader className="p-0">
              <DialogTitle className="text-lg font-semibold">
                Incidente · {headerText}
              </DialogTitle>
            </DialogHeader>

            {/* Ticket a la derecha */}
            {ticket && (
              <a
                href="#"
                className="inline-flex items-center rounded-xl border bg-card px-3 py-1.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-accent hover:text-blue-700 transition-colors"
              >
                Ticket Ivanti {ticket}
              </a>
            )}

            {/* Botón cerrar */}
            <DialogClose asChild>
              <button
                className="absolute top-1/2 -translate-y-1/2 right-0 p-2 rounded-md opacity-70 hover:opacity-100 focus:outline-none"
                aria-label="Cerrar"
              >
                <IconX className="h-5 w-5" />
              </button>
            </DialogClose>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-h-[78vh] overflow-y-auto px-6 py-5">
          {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

          {!loading && incident && (
            <FormIncidente
              item={incident}
              readOnly={!editing}
              hideSubmit={false}
              onSubmit={async (payload) => {
                await guardarYEnviar(payload)
              }}
            />
          )}

          {!loading && !incident && (
            <div className="text-sm text-muted-foreground">
              No hay datos del incidente.
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          {!editing ? (
            <>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Editar
              </Button>
              <Button variant="default" onClick={aprobar}>
                Aprobar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cerrar edición
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


function RequestDialog( { row, onAfterChange }: { row: RowType; onAfterChange?: () => void }){
  const [loading, setLoading] = React.useState(false)
  const [request, setRequest] = React.useState<TicketRecord | null>(null)
  const [editing, setEditing] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [ticket, setTicket] = React.useState<string | null>(null) // ← Nuevo estado

  const headerText =
    (row.id_dialvox_ != null ? String(row.id_dialvox_) : null) ?? row.id_llamada ?? "—"

  async function load() {
    if (!row.id_dialvox_) return
    setLoading(true)
    try {
      const res = await fetchRequestByDialvox(row.id_dialvox_) //fetch (por id_dialvox)
      setRequest(res)
      // si ya existe ticket en DB lo mostramos
      if (res.ticket || res.ticket_number) setTicket(res.ticket || res.ticket_number)
    } catch {
      toast.error("No se pudo cargar el requerimiento")
    } finally {
      setLoading(false)
    }
  }

  async function aprobar() {
    const id = row.id_dialvox_
    if (!id) {
      toast.error("No hay id_dialvox_")
      return
    }
    try {
      await sendRequestToITSM({ id_dialvox_: String(id) }) // ← solo el ID
      toast.success("Requerimiento aprobado y enviado a n8n")
      onAfterChange?.()
    } catch {
      toast.error("Error enviando a n8n")
    }
  }

  async function guardarYEnviarRequest(payload?: Record<string, unknown>) {
    if (!row.id_dialvox_) return
    try {
      if (!payload || Object.keys(payload).length === 0) {
        toast.error("No hay cambios para enviar")
        return
      }
      const patched = await updateRequestByDialvox(row.id_dialvox_, payload) // ← mismo endpoint PATCH
      setRequest(patched)
      toast.success("Requerimiento actualizado")
      // (opcional) enviar a n8n aquí si corresponde:
      //await sendResquestToITSM(patched)
      // toast.success("Enviado a n8n")
      setSaved(true)              // si quieres mantener edición, usa saved + footer “Cerrar edición”
      //setEditing(false)        // si prefieres cerrar edición al guardar, usa esta línea y quita saved
      //onAfterChange?.()
    } catch {
      toast.error("Error al actualizar el requerimiento")
    }
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open && !request && !loading) load()
        if (!open) { setEditing(false); setSaved(false) }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 rounded-full">
          <Badge variant="outline" className="px-1.5 text-muted-foreground">
            Requerimiento
          </Badge>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl p-0">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4">
          <div className="relative flex items-center justify-between pr-10">
            {/* Título */}
            <DialogHeader className="p-0">
              <DialogTitle className="text-lg font-semibold">
                Requerimiento · {headerText}
              </DialogTitle>
            </DialogHeader>

            {/* Ticket a la derecha */}
            {ticket && (
              <a
                href="#"
                className="inline-flex items-center rounded-xl border bg-card px-3 py-1.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-accent hover:text-blue-700 transition-colors"
              >
                Ticket Ivanti {ticket}
              </a>
            )}

            {/* Botón cerrar */}
            <DialogClose asChild>
              <button
                className="absolute top-1/2 -translate-y-1/2 right-0 p-2 rounded-md opacity-70 hover:opacity-100 focus:outline-none"
                aria-label="Cerrar"
              >
                <IconX className="h-5 w-5" />
              </button>
            </DialogClose>
          </div>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-6 py-5">
          {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

          {!loading && request && (
            <FormRequerimiento
              item={request as unknown as ServiceRequestItem}
              readOnly={!editing}
              hideSubmit={false}
              onSubmit={async (payload) => {
                await guardarYEnviarRequest(payload)
              }}
            />
          )}

          {!loading && !request && (
            <div className="text-sm text-muted-foreground">No hay datos del requerimiento.</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          {!editing ? (
            <>
              <Button
                variant="secondary" onClick={() => setEditing(true)}>Editar
              </Button>
              <Button variant="default" onClick={aprobar}>Aprobar</Button>
            </>
          ) : (
            <>
              <Button
                variant="outline" onClick={() => setEditing(false)}>Cerrar edición
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FPQRSDialog( { row, onAfterChange }: { row: RowType; onAfterChange?: () => void }){
  const [loading, setLoading] = React.useState(false)
  const [request, setRequest] = React.useState<TicketRecord | null>(null)
  const [editing, setEditing] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [ticket, setTicket] = React.useState<string | null>(null) // ← Nuevo estado

  const headerText =
    (row.id_dialvox_ != null ? String(row.id_dialvox_) : null) ??
    row.id_llamada ?? "—"

  async function load() {
    if (!row.id_dialvox_) return
    setLoading(true)
    try {
      const res = await fetchFPQRSByDialvox(row.id_dialvox_) //fetch (por id_dialvox)
      setRequest(res)
      // si ya existe ticket en DB lo mostramos
      if (res.ticket || res.ticket_number) setTicket(res.ticket || res.ticket_number)
    } catch {
      toast.error("No se pudo cargar el fpqrs")
    } finally {
      setLoading(false)
    }
  }

  async function aprobar() {
    const id = row.id_dialvox_
    if (!id) {
      toast.error("No hay id_dialvox_")
      return
    }
    try {
      await sendFPQRSToITSM({ id_dialvox_: String(id) }) // ← solo el ID
      toast.success("FPQRS aprobado y enviado a n8n")
      onAfterChange?.()
    } catch {
      toast.error("Error enviando a n8n")
    }
  }

  async function guardarYEnviarRequest(payload?: Record<string, unknown>) {
    if (!row.id_dialvox_) return
    try {
      if (!payload || Object.keys(payload).length === 0) {
        toast.error("No hay cambios para enviar")
        return
      }
      const patched = await updateFPQRSByDialvox(row.id_dialvox_, payload) // ← mismo endpoint PATCH
      setRequest(patched)
      toast.success("FPQRS actualizado")
      // (opcional) enviar a n8n aquí si corresponde:
      //await sendResquestToITSM(patched)
      // toast.success("Enviado a n8n")
      setSaved(true)              // si quieres mantener edición, usa saved + footer “Cerrar edición”
      //setEditing(false)        // si prefieres cerrar edición al guardar, usa esta línea y quita saved
      //onAfterChange?.()
    } catch {
      toast.error("Error al actualizar el requerimiento")
    }
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open && !request && !loading) load()
        if (!open) { setEditing(false); setSaved(false) }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 rounded-full">
          <Badge variant="outline" className="px-1.5 text-muted-foreground">
            FPQRS
          </Badge>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl p-0">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4">
          <div className="relative flex items-center justify-between pr-10">
            {/* Título */}
            <DialogHeader className="p-0">
              <DialogTitle className="text-lg font-semibold">
                FPQRS · {headerText}
              </DialogTitle>
            </DialogHeader>

            {/* Ticket a la derecha */}
            {ticket && (
              <a
                href="#"
                className="inline-flex items-center rounded-xl border bg-card px-3 py-1.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-accent hover:text-blue-700 transition-colors"
              >
                Ticket Ivanti {ticket}
              </a>
            )}

            {/* Botón cerrar */}
            <DialogClose asChild>
              <button
                className="absolute top-1/2 -translate-y-1/2 right-0 p-2 rounded-md opacity-70 hover:opacity-100 focus:outline-none"
                aria-label="Cerrar"
              >
                <IconX className="h-5 w-5" />
              </button>
            </DialogClose>
          </div>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-6 py-5">
          {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

          {!loading && request && (
            <FormRequerimiento
              item={request as unknown as ServiceRequestItem}
              readOnly={!editing}
              hideSubmit={false}
              onSubmit={async (payload) => {
                await guardarYEnviarRequest(payload)
              }}
            />
          )}

          {!loading && !request && (
            <div className="text-sm text-muted-foreground">No hay datos del fpqrs.</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          {!editing ? (
            <>
              <Button
                variant="secondary" onClick={() => setEditing(true)}>Editar
              </Button>
              <Button variant="default" onClick={aprobar}>Aprobar</Button>
            </>
          ) : (
            <>
              <Button
                variant="outline" onClick={() => setEditing(false)}> Cerrar edición
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


// ============================
// Chat parsing & UI
// ============================
type TranscriptMsg = { text: string; sender?: string; timestamp?: number | string; type?: string }

function parseFlatTranscript(s: string): TranscriptMsg[] {
  if (!s) return []
  const re = /(bot|human)\s*:\s*([^]*?)(?=(?:\s*(?:bot|human)\s*:)|$)/gi
  const out: TranscriptMsg[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(s)) !== null) {
    const role = (m[1] || "").toLowerCase().trim()
    const text = (m[2] || "").trim()
    if (text) out.push({ sender: role, text })
  }
  if (!out.length) return [{ sender: "human", text: s }]
  return out
}

function normalizeTranscript(value: unknown, fallbackText?: string): TranscriptMsg[] {
  // Caso 1: ya es un arreglo de mensajes
  if (Array.isArray(value)) {
    return value as TranscriptMsg[]
  }

  // Caso 2: es texto plano (transcript_text o similar)
  if (typeof value === "string") {
    return parseFlatTranscript(value)
  }

  // Caso 3: no hay valor, pero tenemos texto de respaldo
  if (typeof fallbackText === "string") {
    return parseFlatTranscript(fallbackText)
  }

  return []
}

function TranscriptChat({ item }: { item: RowType }) {
  const raw =
    item.transcript ??
    item.body?.transcript?.transcript ??
    item.transcript_text

  const msgs = normalizeTranscript(raw, item.transcript_text || undefined)
  if (!msgs.length) return <span className="text-muted-foreground">—</span>

  const numbers = msgs.map(m => toMs(m.timestamp)).filter(Number.isFinite) as number[]
  const hasTimes = numbers.length > 0
  const firstMs = hasTimes ? Math.min(...numbers) : 0

  return (
    <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
      {msgs.map((m, i) => {
        const isBot = (m.sender ?? "").toLowerCase() === "bot" || (m.sender ?? "").toLowerCase() === "assistant"
        const ms = toMs(m.timestamp)
        const showTime = hasTimes && Number.isFinite(ms)
        const rel = showTime ? Math.max(0, (ms as number) - firstMs) : 0

        return (
          <div key={i} className={`flex ${isBot ? "justify-end" : "justify-start"}`}>
            <div className="flex items-start gap-2 max-w-[88%]">
              {!isBot && (
                <div className="mt-1 shrink-0">
                  <IconUser className="size-5" />
                </div>
              )}
              <div className="rounded-xl px-3 py-2 border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span className="font-medium">{isBot ? "Asistente" : "Cliente"}</span>
                  {showTime && <span>{fmtTimecode(rel)}</span>}
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</div>
              </div>
              {isBot && (
                <div className="mt-1 shrink-0">
                  <IconRobot className="size-5" />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TranscriptCell({ item }: { item: RowType }) {
  const hasTranscript =
    !!item.transcript ||
    !!item.body?.transcript?.transcript ||
    !!item.transcript_text

  if (!hasTranscript) return <span className="text-muted-foreground">—</span>

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="px-0">Transcripción</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transcripción</DialogTitle>
        </DialogHeader>
        <TranscriptChat item={item} />
      </DialogContent>
    </Dialog>
  )
}

// ============================
// Variables extraídas UI
// ============================
type Json = unknown

function toObjectOrNull(v: unknown): Record<string, Json> | null {
  if (!v) return null
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v)
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, Json>)
        : null
    } catch {
      return null
    }
  }
  if (typeof v === "object" && !Array.isArray(v)) return v as Record<string, Json>
  return null
}
const isEmpty = (o: Record<string, Json> | null) => !o || Object.keys(o).length === 0

function PrettyValue({ value }: { value: Json }) {
  if (value === null || typeof value === "undefined" || value === ""){
    return <span className="text-muted-foreground">—</span>
  }
  if (typeof value === "boolean") return value ? <span>Si</span> : <span>No</span>
  if (typeof value === "number") return <span>{value}</span>
  if (typeof value === "string") return <span className="whitespace-pre-wrap">{value}</span>
  if (Array.isArray(value)) return <span className="whitespace-pre-wrap text-sm">{value.map(String).join(", ")}</span>
  try {
    return <span className="whitespace-pre-wrap text-xs">{JSON.stringify(value, null, 2)}</span>
  } catch {
    return <span className="text-muted-foreground">[obj]</span>
  }
}

function ExtractedVarsDialog({ vars }: { vars: Record<string, Json> }) {
  const entries = Object.entries(vars)
  return (
    <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">
      {entries.map(([k, v]) => (
        <div key={k} className="rounded-lg border p-4 grid gap-2 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Variable name</div>
            <div className="font-mono text-sm break-all">{k}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Value</div>
            <div className="mt-1"><PrettyValue value={v} /></div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ExtractedVarsCell({ item }: { item: RowType }) {
  const vars = toObjectOrNull(item.extracted_variables)
  if (isEmpty(vars)) return <span className="text-muted-foreground">—</span>

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="px-0">Ver detalles</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Variables extraídas</DialogTitle>
        </DialogHeader>
        <ExtractedVarsDialog vars={vars as Record<string, Json>} />
      </DialogContent>
    </Dialog>
  )
}

// ============================
// Gestor por extensión (llama al backend)
// ============================
const gestorCache = new Map<number, string>() // ext -> "Nombre Apellido"

function GestorCell({ ext }: { ext: number | null }) {
  const [name, setName] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    let abort = false
    async function run() {
      if (ext == null) return
      console.log("[DEBUG] GestorCell effect ext:", ext)
      const cached = gestorCache.get(ext)
      if (cached) { setName(cached); return }
      setLoading(true)
      try {
        const u = await fetchUserByExtensionLite(ext) // ← /api/users/by-extension/:ext/lite
        if (!abort) {
          const full = u ? `${u.nombres} ${u.apellidos}`.trim() : ""
          if (full) {
            gestorCache.set(ext, full)
            setName(full)
          } else {
            setName(null)
          }
        }
      } finally {
        if (!abort) setLoading(false)
      }
    }
    run()
    return () => { abort = true }
  }, [ext])

  if (ext == null) return <span className="text-muted-foreground">—</span>
  if (loading && !name) return <span className="text-muted-foreground">cargando…</span>
  if (ext === -1) return <span className="text-muted-foreground">No asignado</span>

  return name ? (
    <span className="whitespace-nowrap">
      {name} <span className="text-muted-foreground">(ext. {ext})</span>
    </span>
  ) : (
    <span className="whitespace-nowrap">
      <span className="text-muted-foreground">Ext.</span> {ext}
    </span>
  )
}


// Debe retornar uno de los 4 valores válidos para el API
function normalizarTipoSolicitud(t?: string | null) {
  const s = (t ?? "").toLowerCase();
  if (s.includes("inc")) return "incidente" as const;
  if (s.includes("req")) return "requerimiento" as const;
  if (s.includes("consult")) return "consulta" as const;
  if (s.includes("fpqrs")) return "fpqrs" as const;
  return null;
}

export function FinalizarCellButton({
  row,
  useProxy = true, // si tienes /api/forward/..., déjalo true
}: {
  row: RowType;
  useProxy?: boolean;
}) {
  const [loading, setLoading] = React.useState(false);

  async function onClick() {
    // Construimos el payload desde la fila
    const uniqueid = row?.id_llamada != null ? String(row.id_llamada) : null;
    const dialvox  = row?.id_dialvox_ != null ? String(row.id_dialvox_) : null;
    const tipo     = normalizarTipoSolicitud(row?.tipo_solicitud);

    if (!uniqueid || !dialvox || !tipo) {
      toast.error("Faltan datos (uniqueid, dialvox_id o tipo_solicitud).");
      return;
    }

    setLoading(true);
    try {
      const payload = [{ uniqueid, dialvox_id: dialvox, tipo_solicitud: tipo }];
      if (useProxy) {
        await postFinLlamadaDirect(payload, 10000);
      } else {
        await postFinLlamadaDirect(payload, 10000);
      }
      toast.success("Webhook fin-llamada enviado");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error llamando al webhook"
      toast.error(msg)
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="default"
      onClick={onClick}
      disabled={loading}  // activo al cargar, solo se desactiva durante el envío
    >
      {loading ? "Enviando…" : "Post-procesar"}
    </Button>
  );
}


// ============================
// Columnas
// ============================
function getColumns(refetch: () => Promise<void>): ColumnDef<RowType>[] {
  const columns: ColumnDef<RowType>[] = [
    // Columna de selección
    { id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Seleccionar todos"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Seleccionar fila"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // 1) Id atención
    {
      id: "id_atencion",
      header: "Id atención",
      accessorFn: (row) => (row.id_dialvox_ != null ? String(row.id_dialvox_) : "—"),
      cell: ({ row }) => (
        <span className="font-mono">
          {row.original.id_dialvox_ != null ? String(row.original.id_dialvox_) : "—"}
        </span>
      ),
      enableHiding: false,
      enableSorting: false,
    },

    // 1.5) ticket_ivanti 
    { accessorKey:"ticket_ivanti", 
      header: "Ticket ITSM" 
    },


    //1.5 boton finalizar 
    {
      id: "post-procesar",
      header: "Post-procesar",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => <FinalizarCellButton row={row.original} useProxy={true} />,
    },

    // 2) Tipo de solicitud
    { accessorKey: "tipo_solicitud",
      header: "Tipo de solicitud",
      cell: ({ row }) => {
        const raw = row.original.tipo_solicitud ?? "—"
        const norm = normalizeTipoSolicitudRaw(raw)
        const label = raw === "-" || !raw ? "—" : raw

        if (norm === "Incidente") {
          //refetch ahora viene como argumento
          return <IncidentDialog row={row.original} onAfterChange={refetch} />
        }

        if (norm === "Requerimiento") {
          return <RequestDialog row={row.original} onAfterChange={refetch} />
        }

        if (norm === "fpqrs") {
          return <FPQRSDialog row={row.original} onAfterChange={refetch} />
        }

        return (
          <Badge variant="outline" className="px-1.5 text-muted-foreground"> — </Badge>
        )

      },
    },

    // 3) Estado (placeholder)
    { id: "estado", 
      header: "Estado", 
      cell: () => <span className="text-muted-foreground">—</span>
    },

    // 4) Extensión asignada
    { id: "extension",
      accessorKey: "extension",
      header: "Extensión Asignada",
      cell: ({ row }) => {
        const v = row.getValue<number | string | null>("extension")
        const ext =
          v == null
            ? null
            : typeof v === "number"
            ? v
            : (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)))
            ? Number(v)
            : null

        return (
          <span className={ext && ext > 0 ? "font-semibold" : "text-muted-foreground"}>
            {ext && ext > 0 ? ext : "—"}
          </span>
        )
      },
    },

    // 5) Id de la llamada {id_llamada} -> identificador de la grabación de la llamada.
    { accessorKey:"id_llamada", 
      header: "id_llamada" 
    },
    
    // 6) Teléfono de la llamda entrante
    { accessorKey: "phone", 
      header: "Teléfono"
    },
    
    // 7) Duracion llamada voicebot
    { id: "duracion",
      header: () => <span className="whitespace-pre-line leading-tight">{"Duración\nmm:ss"}</span>,
      cell: ({ row }) => <span>{secondsToHMS(row.original.duration_sec)}</span>,
    },
    
    //8) Nombre del Cliente
    { accessorKey: "nombre_cliente", 
      header: "Nombre cliente"
    },

    //9) Empresa
    { accessorKey: "empresa_cliente", 
      header: "Empresa"
    },
    //10) VIP
    { 
      accessorKey: "es_vip",
      header: "VIP",
      filterFn: booleanTriStateFilter,
      cell: ({ row }) =>
        row.original.es_vip
          ? <Badge variant="secondary">VIP</Badge>
          : <span className="text-muted-foreground">No</span>,
    },
    
    //11) En horario de llamada
    /*
    { accessorKey: "en_horario",
      header: "en_horario",
      filterFn: booleanTriStateFilter,
      cell: ({ row }) =>
        row.original.en_horario ? <Badge variant="outline">En horario</Badge> : <span className="text-muted-foreground">Fuera de horario</span>,
    },
    */
    //12) Variables extraidas del voicebot
    { accessorKey: "extracted_variables",
      header: "Variables extraídas", 
      cell: ({ row }) => <ExtractedVarsCell item={row.original} />
    },
    
    //13) Transcripcion del voicebot
    { id: "transcript_chat", 
      header: "Transcripción", 
      cell: ({ row }) => <TranscriptCell item={row.original} /> 
    },

    //14) En horario de llamada
    { accessorKey: "recording_url",
      header: "Grabación",
      cell: ({ row }) =>
        row.original.recording_url ? (
          <a href={row.original.recording_url} target="_blank" rel="noreferrer" className="underline underline-offset-4">abrir</a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },

    //15) started_at
    /*
    { accessorKey: "started_at",
      header: "started_at",
      cell: ({ row }) => <span className="whitespace-nowrap">{fmtDT(row.original.started_at)}</span>,
      sortingFn: (a, b) =>
        (new Date(a.original.started_at || 0).getTime() || 0) -
        (new Date(b.original.started_at || 0).getTime() || 0),
      filterFn: "dateRange",
    },
    
    //16 ended_at
    { accessorKey: "ended_at",
      header: "ended_at",
      cell: ({ row }) => <span className="whitespace-nowrap">{fmtDT(row.original.ended_at)}</span>,
      sortingFn: (a, b) =>
        (new Date(a.original.ended_at || 0).getTime() || 0) -
        (new Date(b.original.ended_at || 0).getTime() || 0),
    },
    */
   
    //17 fecha creación del registro
    { accessorKey: "created_at",
      header: "Creado",
      cell: ({ row }) => <span className="whitespace-nowrap">{fmtDT(row.original.created_at)}</span>,
      sortingFn: (a, b) =>
        (new Date(a.original.created_at || 0).getTime() || 0) -
        (new Date(b.original.created_at || 0).getTime() || 0),
    },

    // 18) Columna oculta para búsqueda global
    { id: "search",
      header: "search",
      accessorFn: (row) =>
        [
          row.id_dialvox_ != null ? String(row.id_dialvox_) : "",
          row.id_llamada,
          row.phone,
          row.nombre_cliente,
          row.tipo_solicitud,
          row.empresa_cliente,
          row.transcript_text,
          typeof row.extracted_variables === "string" ? row.extracted_variables : JSON.stringify(row.extracted_variables ?? ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      filterFn: "includesString",
      enableSorting: false,
    }
  ]


return columns
}

// ============================
// Toolbar
// ============================

function Toolbar({
  table,
  serverFilters,
  onServerFilters,
  showServerFilters,
  }:{
  table: ReturnType<typeof useReactTable<RowType>>
  serverFilters: { phone?: string; id_llamada?: string }
  onServerFilters: (v: { phone?: string; id_llamada?: string }) => void
  showServerFilters?: boolean
  }) {
  const searchCol = table.getColumn("search")
  const startedCol = table.getColumn("started_at")
  const vipCol = table.getColumn("es_vip")
  const horarioCol = table.getColumn("en_horario")

  return (
    <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-4 lg:px-6">
      <div className="flex flex-col gap-2 w-full lg:max-w-[760px]">
        <Input
          placeholder="Buscar (cliente, teléfono, transcript, id)… (local)"
          onChange={(e) => {
            const val = e.target.value?.toLowerCase()
            searchCol?.setFilterValue(val || undefined)
          }}
        />
        {showServerFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="Filtro API por phone (E.164)"
              value={serverFilters.phone ?? ""}
              onChange={(e) => onServerFilters({ ...serverFilters, phone: e.target.value || undefined })}
            />
            <Input
              placeholder="Filtro API por id_llamada"
              value={serverFilters.id_llamada ?? ""}
              onChange={(e) => onServerFilters({ ...serverFilters, id_llamada: e.target.value || undefined })}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="from" className="text-sm font-medium">Desde</Label>
          <Input
            id="from"
            type="datetime-local"
            className="h-8 w-48"
            onChange={(e) => {
              const prev = (startedCol?.getFilterValue() as DateRange) || {}
              startedCol?.setFilterValue({
                ...prev,
                from: e.target.value ? new Date(e.target.value).toISOString() : undefined,
              })
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="to" className="text-sm font-medium">Hasta</Label>
          <Input
            id="to"
            type="datetime-local"
            className="h-8 w-48"
            onChange={(e) => {
              const prev = (startedCol?.getFilterValue() as DateRange) || {}
              startedCol?.setFilterValue({
                ...prev,
                to: e.target.value ? new Date(e.target.value).toISOString() : undefined,
              })
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">VIP</Label>
          <Select defaultValue="all" onValueChange={(val) => vipCol?.setFilterValue(val as "all" | "true" | "false") } >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Solo VIP</SelectItem>
              <SelectItem value="false">No VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Horario</Label>
          <Select defaultValue="all" onValueChange={(val) => vipCol?.setFilterValue(val as "all" | "true" | "false") } >
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">En horario</SelectItem>
              <SelectItem value="false">Fuera de horario</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <IconLayoutColumns />
              <span className="hidden lg:inline">Vista Columnas</span>
              <span className="lg:hidden">Columnas</span>
              <IconChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide())
              .map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  className="capitalize"
                  checked={c.getIsVisible()}
                  onCheckedChange={(value) => c.toggleVisibility(!!value)}
                >
                  {c.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}



// ============================
// Componente principal
// ============================
export default function DataTable() {
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const [serverFilters, setServerFilters] = React.useState<{ phone?: string; id_llamada?: string }>({})

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState<PaginatedWebhooks | null>(null)

  // Refetch centralizado (lo usan el efecto de carga y el SSE)
const refetch = React.useCallback(async () => {
  try {
    setLoading(true)
    setError(null)
    const res = await fetchWebhookEvents({
      page: pageIndex + 1,
      page_size: pageSize,
      phone: serverFilters.phone,
      id_llamada: serverFilters.id_llamada,
    })
    setPage(res)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error cargando eventos"
    setError(msg)
    toast.error("No se pudo cargar eventos")
  } finally {
    setLoading(false)
  }
}, [pageIndex, pageSize, serverFilters])


React.useEffect(() => {
  refetch()
}, [refetch])

 // Suscripción SSE con reintento exponencial y refetch directo
React.useEffect(() => {
  let es: EventSource | null = null
  let retryMs = 2000

  const connect = () => {
    es = new EventSource('/api/stream/webhooks')

    es.onopen = () => {
      console.log('[SSE] conectado')
      retryMs = 2000
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[SSE] Evento:', data)
        if (data?.type === 'webhook_event_created' || data?.type === 'incident_updated') {
          refetch()  // ← recarga la tabla
        }
      } catch (err) {
        console.error('[SSE] Error parseando evento:', err)
      }
    }

    es.onerror = () => {
      console.warn('[SSE] error – reintentando en', retryMs, 'ms')
      es?.close()
      es = null
      setTimeout(connect, retryMs)
      retryMs = Math.min(retryMs * 2, 30000) // backoff máx 30s
    }
  }

  connect()
  return () => { es?.close(); es = null }
}, [refetch])



  const items: RowType[] = React.useMemo(() => {
    const src = page?.items ?? []
    return src.map((it) => {
      const parsed = schema.safeParse(it)
      if (parsed.success) return parsed.data
      return { ...it, id: Number(it.id) } as RowType
    })
  }, [page])

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ search: false })
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const columns = React.useMemo(() => getColumns(refetch), [refetch])
   
  const table = useReactTable({
    data: items,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: { pageIndex, pageSize },
    },
    getRowId: (row) => String(row.id),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater
      setPageIndex(next.pageIndex)
      setPageSize(next.pageSize)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    
    filterFns: {
      dateRange: dateRangeFilter,
      includesString: (row, columnId, filterValue) => {
        if (!filterValue) return true
        const v = String(row.getValue(columnId) ?? "").toLowerCase()
        return v.includes(String(filterValue).toLowerCase())
      },
    },
    manualPagination: true,
    pageCount: page ? Math.ceil(page.total / page.page_size) : -1,
  })

  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      {/*
      <Toolbar
        table={table}
        serverFilters={serverFilters}
        onServerFilters={setServerFilters}
        showServerFilters
      /> */}

      <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                {table.getFlatHeaders().map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">Cargando…</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-red-600">{error}</TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row: Row<RowType>) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">Sin resultados.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} filas(s) seleccionadas.
          </div>

          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">Filas por página</Label>
              <Select value={`${pageSize}`} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((ps) => (
                    <SelectItem key={ps} value={`${ps}`}>{ps}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Página {pageIndex + 1} de {table.getPageCount() || 1}
            </div>

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => setPageIndex(0)} disabled={pageIndex === 0}>
                <span className="sr-only">Primera página</span>
                <IconChevronsLeft />
              </Button>
              <Button variant="outline" className="size-8" size="icon" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={pageIndex === 0}>
                <span className="sr-only">Página anterior</span>
                <IconChevronLeft />
              </Button>
              <Button variant="outline" className="size-8" size="icon" onClick={() => setPageIndex((p) => p + 1)} disabled={!!page && page.page * page.page_size >= page.total}>
                <span className="sr-only">Página siguiente</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => {
                  if (!page) return
                  const last = Math.max(0, Math.ceil(page.total / page.page_size) - 1)
                  setPageIndex(last)
                }}
                disabled={!page || page.total === 0}
              >
                <span className="sr-only">Última página</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
