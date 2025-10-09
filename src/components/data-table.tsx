"use client"

import * as React from "react"
import { z } from "zod"
import { toast } from "sonner"

import { fetchWebhookEvents, type PaginatedWebhooks } from "@/lib/api-webhooks"
import { fetchUserByExtensionLite } from "@/lib/api-users"

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
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
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
import { Separator } from "@/components/ui/separator"
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
} from "@/components/ui/dialog"

import CaseFormRouter from "@/components/ui/forms-proceso/case-form-router"
import type { CaseItem } from "@/components/ui/forms-proceso/types"

// ============================
// Utils
// ============================
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

type CaseType = CaseItem["type"]

function normalizeTipoSolicitudRaw(t?: string | null): CaseType | "none" {
  const s = (t ?? "").toLowerCase().trim()
  if (s === "-" || s === "" || s === "na" || s === "n/a") return "none"
  if (s.includes("inc")) return "Incidente"
  if (s.includes("req")) return "Requerimiento"
  if (s.includes("consult")) return "Consulta de caso"
  return "none"
}

function rowToCaseItem(row: RowType): CaseItem {
  return {
    id: row.id,
    header: row.id_dialvox_ != null ? String(row.id_dialvox_) : (row.id_llamada ?? "—"),
    type: normalizeTipoSolicitudRaw(row.tipo_solicitud) as CaseType,
    status: row.estado_caso ?? "Not Started",
    target: row.phone ?? "",
    limit: row.numero_caso ?? "",
    reviewer: row.empresa_cliente ?? "Assign reviewer",
  }
}

function TipoSolicitudModalFallback({ item }: { item: RowType }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">
        Este registro no tiene un tipo de solicitud asignado{" "}
        (<span className="font-mono">{item.tipo_solicitud ?? "-"}</span>).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Id atención</div>
          <div className="font-medium">
            {item.id_dialvox_ ?? item.id_llamada ?? "—"}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Cliente</div>
          <div className="font-medium">{item.nombre_cliente ?? "—"}</div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Teléfono</div>
          <div className="font-medium">{item.phone ?? "—"}</div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground">Empresa</div>
          <div className="font-medium">{item.empresa_cliente ?? "—"}</div>
        </div>
      </div>
    </div>
  )
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

const dateRangeFilter = (row: any, columnId: string, value?: DateRange) => {
  if (!value || (!value.from && !value.to)) return true
  const cell = row.original?.[columnId]
  const ts = cell ? new Date(cell).getTime() : NaN
  if (Number.isNaN(ts)) return false
  const fromOk = value.from ? ts >= new Date(value.from).getTime() : true
  const toOk = value.to ? ts <= new Date(value.to).getTime() : true
  return fromOk && toOk
}

const booleanTriStateFilter = (
  row: any,
  columnId: string,
  value?: "all" | "true" | "false"
) => {
  if (!value || value === "all") return true
  const cell = row.original?.[columnId]
  const bool = Boolean(cell)
  return value === "true" ? bool : !bool
}

// ============================
// Drawer de detalle (Id atención)
// ============================
function IdAtencionCell({ item }: { item: RowType }) {
  const headerText =
    (item.id_dialvox_ != null ? String(item.id_dialvox_) : null) ??
    item.id_llamada ??
    "—"

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {headerText}
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{headerText}</DrawerTitle>
          <DrawerDescription>Detalle atención</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Inicio</span>
              <span className="font-medium">{fmtDT(item.started_at)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Fin</span>
              <span className="font-medium">{fmtDT(item.ended_at)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Duración</span>
              <span className="font-medium">{secondsToHMS(item.duration_sec)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Creado</span>
              <span className="font-medium">{fmtDT(item.created_at)}</span>
            </div>
          </div>

          {item.recording_url ? (
            <div className="mt-1">
              <a
                href={item.recording_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-4"
              >
                Ver/escuchar grabación
              </a>
            </div>
          ) : null}

          <Separator />
          <div className="grid gap-2">
            <div className="text-xs text-muted-foreground">Cliente</div>
            <div className="font-medium">{item.nombre_cliente ?? "—"}</div>
          </div>

          <Separator />
          <div className="grid gap-2">
            <div className="text-xs text-muted-foreground">Transcript (texto plano)</div>
            <div className="text-muted-foreground">{item.transcript_text ?? "—"}</div>
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
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

function normalizeTranscript(value: any, fallbackText?: string): TranscriptMsg[] {
  if (Array.isArray(value?.transcript)) return value.transcript as TranscriptMsg[]
  if (Array.isArray(value)) return value as TranscriptMsg[]
  if (typeof value === "string") return parseFlatTranscript(value)
  if (typeof fallbackText === "string") return parseFlatTranscript(fallbackText)
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
  if (value === null || typeof value === "undefined" || value === "") {
    return <span className="text-muted-foreground">—</span>
  }
  if (typeof value === "boolean") return value ? <span>Sí</span> : <span>No</span>
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

// ============================
// Columnas
// ============================
const columns: ColumnDef<RowType>[] = [
  {
    id: "select",
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
    cell: ({ row }) => <IdAtencionCell item={row.original} />,
    enableHiding: false,
  },

  // 2) Tipo de solicitud
  {
    accessorKey: "tipo_solicitud",
    header: "Tipo de solicitud",
    cell: ({ row }) => {
      const raw = row.original.tipo_solicitud ?? "—"
      const norm = normalizeTipoSolicitudRaw(raw)
      const label = raw === "-" || !raw ? "—" : raw

      const isLargeForm = norm === "Requerimiento" || norm === "Incidente"

      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 rounded-full">
              <Badge variant="outline" className="px-1.5 text-muted-foreground">
                {label}
              </Badge>
            </Button>
          </DialogTrigger>

          {norm === "none" ? (
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tipo de solicitud</DialogTitle>
              </DialogHeader>
              <TipoSolicitudModalFallback item={row.original} />
            </DialogContent>
          ) : isLargeForm ? (
            <DialogContent className="sm:max-w-3xl p-0">
              <DialogHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4">
                <DialogTitle>{norm}</DialogTitle>
              </DialogHeader>
              <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
                <CaseFormRouter
                  item={rowToCaseItem(row.original)}
                  onSubmit={(payload) => {
                    console.log("payload form:", payload)
                    toast.success("Formulario capturado")
                  }}
                />
              </div>
            </DialogContent>
          ) : (
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>{norm}</DialogTitle>
              </DialogHeader>
              <CaseFormRouter
                item={rowToCaseItem(row.original)}
                onSubmit={(payload) => {
                  console.log("payload form:", payload)
                  toast.success("Formulario capturado")
                }}
              />
            </DialogContent>
          )}
        </Dialog>
      )
    },
  },

  // 3) Estado (placeholder)
  { id: "estado", header: "Estado", cell: () => <span className="text-muted-foreground">—</span> },

  // 4) Gestor Asignado (resuelve por extensión)
  {
    id: "gestor_asignado",
    header: "Gestor asignado",
    accessorKey: "extension",
    cell: ({ row }) => {
      // Usa el valor de la celda para evitar depender de row.original si viene string
      const v = row.getValue("extension") as unknown
      const ext =
        v == null
          ? null
          : typeof v === "number"
          ? v
          : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))
          ? Number(v)
          : null
      return <GestorCell ext={ext} />
    },
  },

  // ——— Complementarias ———
  { accessorKey: "id_llamada", header: "id_llamada" },
  { accessorKey: "phone", header: "Teléfono" },
  {
    id: "duracion",
    header: () => <span className="whitespace-pre-line leading-tight">{"Duración\nmm:ss"}</span>,
    cell: ({ row }) => <span>{secondsToHMS(row.original.duration_sec)}</span>,
  },
  { accessorKey: "nombre_cliente", header: "Nombre cliente" },
  { accessorKey: "empresa_cliente", header: "Empresa" },

  {
    accessorKey: "es_vip",
    header: "VIP",
    filterFn: "booleanTri",
    cell: ({ row }) =>
      row.original.es_vip ? <Badge variant="secondary">VIP</Badge> : <span className="text-muted-foreground">No</span>,
  },

  {
    accessorKey: "en_horario",
    header: "en_horario",
    filterFn: "booleanTri",
    cell: ({ row }) =>
      row.original.en_horario ? <Badge variant="outline">En horario</Badge> : <span className="text-muted-foreground">Fuera de horario</span>,
  },

  { accessorKey: "extracted_variables", header: "Variables extraídas", cell: ({ row }) => <ExtractedVarsCell item={row.original} /> },
  { id: "transcript_chat", header: "Transcripción", cell: ({ row }) => <TranscriptCell item={row.original} /> },

  {
    accessorKey: "recording_url",
    header: "Grabación",
    cell: ({ row }) =>
      row.original.recording_url ? (
        <a href={row.original.recording_url} target="_blank" rel="noreferrer" className="underline underline-offset-4">abrir</a>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },

  {
    accessorKey: "started_at",
    header: "started_at",
    cell: ({ row }) => <span className="whitespace-nowrap">{fmtDT(row.original.started_at)}</span>,
    sortingFn: (a, b) =>
      (new Date(a.original.started_at || 0).getTime() || 0) -
      (new Date(b.original.started_at || 0).getTime() || 0),
    filterFn: "dateRange",
  },
  {
    accessorKey: "ended_at",
    header: "ended_at",
    cell: ({ row }) => <span className="whitespace-nowrap">{fmtDT(row.original.ended_at)}</span>,
    sortingFn: (a, b) =>
      (new Date(a.original.ended_at || 0).getTime() || 0) -
      (new Date(b.original.ended_at || 0).getTime() || 0),
  },
  {
    accessorKey: "created_at",
    header: "Creado",
    cell: ({ row }) => <span className="whitespace-nowrap">{fmtDT(row.original.created_at)}</span>,
    sortingFn: (a, b) =>
      (new Date(a.original.created_at || 0).getTime() || 0) -
      (new Date(b.original.created_at || 0).getTime() || 0),
  },

  // Columna oculta para búsqueda global
  {
    id: "search",
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
  },
]

// ============================
// Toolbar
// ============================
function Toolbar({
  table,
  serverFilters,
  onServerFilters,
  showServerFilters,
}: {
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
          <Select defaultValue="all" onValueChange={(val) => vipCol?.setFilterValue(val as any)}>
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
          <Select defaultValue="all" onValueChange={(val) => horarioCol?.setFilterValue(val as any)}>
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

  React.useEffect(() => {
    let abort = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetchWebhookEvents({
          page: pageIndex + 1,
          page_size: pageSize,
          phone: serverFilters.phone,
          id_llamada: serverFilters.id_llamada,
        })
        if (!abort) setPage(res)
      } catch (e: any) {
        if (!abort) {
          setError(e?.message ?? "Error cargando eventos")
          toast.error("No se pudo cargar eventos")
        }
      } finally {
        if (!abort) setLoading(false)
      }
    })()
    return () => { abort = true }
  }, [pageIndex, pageSize, serverFilters])

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
      booleanTri: booleanTriStateFilter,
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
      <Toolbar
        table={table}
        serverFilters={serverFilters}
        onServerFilters={setServerFilters}
        showServerFilters
      />

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
