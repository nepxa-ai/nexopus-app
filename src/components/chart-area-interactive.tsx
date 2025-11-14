"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"


// Config de series para ChartContainer (labels y colores via CSS vars)
const chartConfig = {
  visitors: { label: "Casos atendidos e inyectados" },

  // Azul Nexopus – Incidentes
  incidentes: { 
    label: "Incidentes", 
    color: "var(--chart-1a)" 
  },

  // Verde éxito – Requerimientos
  requerimiento: { 
    label: "Requerimientos", 
    color: "var(--chart-2a)" 
  },

  // Amarillo suave – FPQRS / Otros
  fpqrs: { 
    label: "FPQRS", 
    color: "var(--chart-3a)" 
  },

  // Coral suave – Consulta Caso
  consulta_caso: { 
    label: "Consulta Caso", 
    color: "var(--chart-5a)" 
  },
} satisfies ChartConfig





type WindowKey = "7d" | "30d" | "90d"

type ApiItem = {
  day: string
  total: number
  vip_cnt: number
  non_vip_cnt: number
  series: {
    req_cnt: number
    inc_cnt: number
    consulta_cnt: number
    otros_cnt: number
  }
}

type ApiResponse = {
  window: string
  items: ApiItem[]
}

export function ChartBarStacked() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState<WindowKey>("90d")
  const [data, setData] = React.useState<
    { date: string; incidentes: number; requerimiento: number; fpqrs: number; consulta_caso: number }[]
  >([])

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/metrics/attentions/window?window=${timeRange}`, {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const payload: ApiResponse = await res.json()

        // mapear API -> datos del chart
        const mapped = (payload.items ?? []).map((it) => ({
          date: it.day, // 'YYYY-MM-DD'
          incidentes: it.series.inc_cnt ?? 0,
          requerimiento: it.series.req_cnt ?? 0,
          fpqrs: it.series.otros_cnt ?? 0,            // por ahora mapeamos "otros" a "fpqrs"
          consulta_caso: it.series.consulta_cnt ?? 0,
        }))
        if (!cancelled) setData(mapped)
      } catch (err) {
        console.error("Error cargando métricas:", err)
        if (!cancelled) setData([])
      }
    })()
    return () => { cancelled = true }
  }, [timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total atenciones Nexopus</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">Cantidad</span>
          <span className="@[540px]/card:hidden">
            {timeRange === "90d" ? "3 meses" : timeRange === "30d" ? "30 días" : "7 días"}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v as WindowKey)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 días</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 días</ToggleGroupItem>
          </ToggleGroup>

          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as WindowKey)}>
            <SelectTrigger className="flex w-40 @[767px]/card:hidden" size="sm" aria-label="Select a value">
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) => {
                const d = new Date(value + "T00:00:00")
                return d.toLocaleDateString("es-CO", { month: "short", day: "numeric" })
              }}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value: string) =>
                    new Date(value + "T00:00:00").toLocaleDateString("es-CO", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
              }
            />
            <Bar dataKey="incidentes" fill="var(--color-incidentes)" stackId="a" />
            <Bar dataKey="requerimiento" fill="var(--color-requerimiento)" stackId="a" />
            <Bar dataKey="fpqrs" fill="var(--color-fpqrs)" stackId="a" />
            <Bar dataKey="consulta_caso" fill="var(--color-consulta_caso)" stackId="a" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
