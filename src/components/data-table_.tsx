"use client"

import * as React from "react"
import { z } from "zod"
import { toast } from "sonner"

import { fetchWebhookEvents, type PaginatedWebhooks, type WebhookEvent } from "@/lib/api-webhooks"
import { fetchUserByExtensionLite } from "@/lib/api-users"

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

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
  IconGripVertical,
  IconLayoutColumns,
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

// ============================
// Utils: formato fechas y duración
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

// ============================
//
// Schema alineado con tu API
//
// ============================
const schema = z.object({
  id: z.number(),
  id_dialvox_: z.number().nullable(),
  id_llamada: z.string().nullable(),
  phone: z.string().nullable(),
  duration_sec: z.number().nullable(),
  extension: z.coerce.number().nullable(),
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
  recording_url: z.string().nullable(),
  transcript_url: z.string().nullable(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
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
// Drag handle
// ============================
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id })
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
      title="Arrastrar para reordenar"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

// ============================
// Drawer simple de detalle
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
            <div className="text-xs text-muted-foreground">Transcript</div>
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

const gestorCache = new Map<number, string>() // ext -> "Nombre Apellido"

function GestorCell({ ext }: { ext: number | null }) {
  const [name, setName] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    let abort = false
    async function run() {
      if (ext == null) return
      const cached = gestorCache.get(ext)
      if (cached) { setName(cached); return }
      setLoading(true)
      try {
        const u = await fetchUserByExtensionLite(ext)
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

  // Sin dato
  if (ext == null) return <span className="text-muted-foreground">—</span>
  // Loading inicial
  if (loading && !name) return <span className="text-muted-foreground">cargando…</span>
  // Placeholder -1
  if (ext === -1) return <span className="text-muted-foreground">No asignado</span>

  // Con nombre resuelto
  return name ? (
    <span className="whitespace-nowrap">
      {name} <span className="text-muted-foreground">(ext. {ext})</span>
    </span>
  ) : (
    // Sin match en backend: muestra solo la extensión
    <span className="whitespace-nowrap">
      <span className="text-muted-foreground">Ext.</span> {ext}
    </span>
  )
}


// ============================
// Columnas (orden solicitado)
// ============================
const columns: ColumnDef<RowType>[] = [
  // Drag
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
    enableHiding: false,
    enableSorting: false,
  },

  // Checkbox selección
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

  // 1) Id atención (id_dialvox_)
  {
    id: "id_atencion",
    header: "Id atención",
    accessorFn: (row) => (row.id_dialvox_ != null ? String(row.id_dialvox_) : "—"),
    cell: ({ row }) => <IdAtencionCell item={row.original} />,
    enableHiding: false,
  },

  // 2) Tipo de solictud
  {
    accessorKey: "tipo_solicitud",
    header: "Tipo de solictud",
    cell: ({ row }) => {
      const t = row.original.tipo_solicitud ?? "—"
      return (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {t}
        </Badge>
      )
    },
  },

  // 3) Estado (en blanco)
  {
    id: "estado",
    header: "Estado",
    cell: () => <span className="text-muted-foreground">—</span>,
  },

  // 4) Gestor Asignado (en blanco)
{
  id: "gestor_asignado",
  header: "Gestor asignado",
  accessorKey: "extension",
  cell: ({ row }) => {
    const v = row.getValue("extension") as unknown
    // normalización segura a number | null
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
  { accessorKey: "phone", header: "phone" },
  {
    accessorKey: "duration_sec",
    header: "duration_sec",
    cell: ({ row }) => <span>{secondsToHMS(row.original.duration_sec)}</span>,
  },
  { accessorKey: "nombre_cliente", header: "nombre_cliente" },
  { accessorKey: "empresa_cliente", header: "empresa_cliente" },
  {
    accessorKey: "es_vip",
    header: "es_vip",
    filterFn: "booleanTri",
    cell: ({ row }) =>
      row.original.es_vip ? (
        <Badge variant="secondary">VIP</Badge>
      ) : (
        <span className="text-muted-foreground">No</span>
      ),
  },
  {
    accessorKey: "en_horario",
    header: "en_horario",
    filterFn: "booleanTri",
    cell: ({ row }) =>
      row.original.en_horario ? (
        <Badge variant="outline">En horario</Badge>
      ) : (
        <span className="text-muted-foreground">Fuera de horario</span>
      ),
  },
  {
    accessorKey: "extracted_variables",
    header: "extracted_variables",
    cell: ({ row }) => {
      const v = row.original.extracted_variables
      const text =
        v == null
          ? "—"
          : typeof v === "string"
          ? v
          : (() => {
              try {
                return JSON.stringify(v)
              } catch {
                return String(v)
              }
            })()
      return <span className="line-clamp-2 break-all text-xs">{text}</span>
    },
  },
  {
    accessorKey: "transcript_text",
    header: "transcript_text",
    cell: ({ row }) => (
      <span className="line-clamp-2 text-xs text-muted-foreground">
        {row.original.transcript_text ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "recording_url",
    header: "recording_url",
    cell: ({ row }) =>
      row.original.recording_url ? (
        <a
          href={row.original.recording_url}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4"
        >
          abrir
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "transcript_url",
    header: "transcript_url",
    cell: ({ row }) =>
      row.original.transcript_url ? (
        <a
          href={row.original.transcript_url}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4"
        >
          abrir
        </a>
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
    header: "created_at",
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
        typeof row.extracted_variables === "string"
          ? row.extracted_variables
          : JSON.stringify(row.extracted_variables ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    filterFn: "includesString",
    enableSorting: false,
  },
]

// ============================
// Toolbar (filtros locales + filtros API opcionales)
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
              .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ============================
// Fila draggable
// ============================
function DraggableRow({ row }: { row: Row<RowType> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id as UniqueIdentifier,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
      ))}
    </TableRow>
  )
}

// ============================
// Componente principal (default)
// ============================
export default function DataTable() {
  const [pageIndex, setPageIndex] = React.useState(0) // 0-based
  const [pageSize, setPageSize] = React.useState(10)

  // filtros que van al backend (opcionales)
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
          page: pageIndex + 1, // backend 1-based
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
    return () => {
      abort = true
    }
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

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => items?.map(({ id }) => id) || [],
    [items]
  )

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
      const next =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater
      setPageIndex(next.pageIndex)
      setPageSize(next.pageSize)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // locales
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
    manualPagination: true, // usamos paginación del servidor
    pageCount: page ? Math.ceil(page.total / page.page_size) : -1,
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      const oldIndex = dataIds.indexOf(active.id)
      const newIndex = dataIds.indexOf(over.id)
      const newOrder = arrayMove(items, oldIndex, newIndex)
      toast.success("Reordenado localmente")
      // refresca la tabla con el nuevo orden local (no persistimos)
      table.options.data = newOrder as any
      table.resetRowSelection()
    }
  }

  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      {/* Toolbar con filtros locales y filtros API */}
      <Toolbar
        table={table}
        serverFilters={serverFilters}
        onServerFilters={setServerFilters}
        showServerFilters
      />

      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Cargando…
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-red-600">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Sin resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} filas(s) seleccionadas.
          </div>

          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Filas por página
              </Label>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((ps) => (
                    <SelectItem key={ps} value={`${ps}`}>
                      {ps}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Página {pageIndex + 1} de {table.getPageCount() || 1}
            </div>

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => setPageIndex(0)}
                disabled={pageIndex === 0}
              >
                <span className="sr-only">Primera página</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0}
              >
                <span className="sr-only">Página anterior</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => setPageIndex((p) => p + 1)}
                disabled={!!page && (page.page * page.page_size >= page.total)}
              >
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
