
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

export const description = "Stacked bar chart interactivo"

const chartData = [
  { date: "2024-04-01", incidentes: 222, requerimiento: 150, fpqrs: 100, consulta_caso: 98 },
  { date: "2024-04-02", incidentes: 97,  requerimiento: 180, fpqrs: 44,  consulta_caso: 117 },
  { date: "2024-04-03", incidentes: 167, requerimiento: 120, fpqrs: 75,  consulta_caso: 78 },
  { date: "2024-04-04", incidentes: 242, requerimiento: 260, fpqrs: 109, consulta_caso: 169 },
  { date: "2024-04-05", incidentes: 373, requerimiento: 290, fpqrs: 168, consulta_caso: 189 },
  { date: "2024-04-06", incidentes: 301, requerimiento: 340, fpqrs: 135, consulta_caso: 221 },
  { date: "2024-04-07", incidentes: 245, requerimiento: 180, fpqrs: 110, consulta_caso: 117 },
  { date: "2024-04-08", incidentes: 409, requerimiento: 320, fpqrs: 184, consulta_caso: 208 },
  { date: "2024-04-09", incidentes: 59,  requerimiento: 110, fpqrs: 27,  consulta_caso: 72 },
  { date: "2024-04-10", incidentes: 261, requerimiento: 190, fpqrs: 117, consulta_caso: 124 },
  { date: "2024-04-11", incidentes: 327, requerimiento: 350, fpqrs: 147, consulta_caso: 228 },
  { date: "2024-04-12", incidentes: 292, requerimiento: 210, fpqrs: 131, consulta_caso: 137 },
  { date: "2024-04-13", incidentes: 342, requerimiento: 380, fpqrs: 154, consulta_caso: 247 },
  { date: "2024-04-14", incidentes: 137, requerimiento: 220, fpqrs: 62,  consulta_caso: 143 },
  { date: "2024-04-15", incidentes: 120, requerimiento: 170, fpqrs: 54,  consulta_caso: 111 },
  { date: "2024-04-16", incidentes: 138, requerimiento: 190, fpqrs: 62,  consulta_caso: 124 },
  { date: "2024-04-17", incidentes: 446, requerimiento: 360, fpqrs: 201, consulta_caso: 234 },
  { date: "2024-04-18", incidentes: 364, requerimiento: 410, fpqrs: 164, consulta_caso: 267 },
  { date: "2024-04-19", incidentes: 243, requerimiento: 180, fpqrs: 109, consulta_caso: 117 },
  { date: "2024-04-20", incidentes: 89,  requerimiento: 150, fpqrs: 40,  consulta_caso: 98 },
  { date: "2024-04-21", incidentes: 137, requerimiento: 200, fpqrs: 62,  consulta_caso: 130 },
  { date: "2024-04-22", incidentes: 224, requerimiento: 170, fpqrs: 101, consulta_caso: 111 },
  { date: "2024-04-23", incidentes: 138, requerimiento: 230, fpqrs: 62,  consulta_caso: 150 },
  { date: "2024-04-24", incidentes: 387, requerimiento: 290, fpqrs: 174, consulta_caso: 189 },
  { date: "2024-04-25", incidentes: 215, requerimiento: 250, fpqrs: 97,  consulta_caso: 163 },
  { date: "2024-04-26", incidentes: 75,  requerimiento: 130, fpqrs: 34,  consulta_caso: 85 },
  { date: "2024-04-27", incidentes: 383, requerimiento: 420, fpqrs: 172, consulta_caso: 273 },
  { date: "2024-04-28", incidentes: 122, requerimiento: 180, fpqrs: 55,  consulta_caso: 117 },
  { date: "2024-04-29", incidentes: 315, requerimiento: 240, fpqrs: 142, consulta_caso: 156 },
  { date: "2024-04-30", incidentes: 454, requerimiento: 380, fpqrs: 204, consulta_caso: 247 },

  { date: "2024-05-01", incidentes: 165, requerimiento: 220, fpqrs: 74,  consulta_caso: 143 },
  { date: "2024-05-02", incidentes: 293, requerimiento: 310, fpqrs: 132, consulta_caso: 202 },
  { date: "2024-05-03", incidentes: 247, requerimiento: 190, fpqrs: 111, consulta_caso: 124 },
  { date: "2024-05-04", incidentes: 385, requerimiento: 420, fpqrs: 173, consulta_caso: 273 },
  { date: "2024-05-05", incidentes: 481, requerimiento: 390, fpqrs: 216, consulta_caso: 254 },
  { date: "2024-05-06", incidentes: 498, requerimiento: 520, fpqrs: 224, consulta_caso: 338 },
  { date: "2024-05-07", incidentes: 388, requerimiento: 300, fpqrs: 175, consulta_caso: 195 },
  { date: "2024-05-08", incidentes: 149, requerimiento: 210, fpqrs: 67,  consulta_caso: 137 },
  { date: "2024-05-09", incidentes: 227, requerimiento: 180, fpqrs: 102, consulta_caso: 117 },
  { date: "2024-05-10", incidentes: 293, requerimiento: 330, fpqrs: 132, consulta_caso: 215 },
  { date: "2024-05-11", incidentes: 335, requerimiento: 270, fpqrs: 151, consulta_caso: 176 },
  { date: "2024-05-12", incidentes: 197, requerimiento: 240, fpqrs: 89,  consulta_caso: 156 },
  { date: "2024-05-13", incidentes: 197, requerimiento: 160, fpqrs: 89,  consulta_caso: 104 },
  { date: "2024-05-14", incidentes: 448, requerimiento: 490, fpqrs: 202, consulta_caso: 319 },
  { date: "2024-05-15", incidentes: 473, requerimiento: 380, fpqrs: 213, consulta_caso: 247 },
  { date: "2024-05-16", incidentes: 338, requerimiento: 400, fpqrs: 152, consulta_caso: 260 },
  { date: "2024-05-17", incidentes: 499, requerimiento: 420, fpqrs: 225, consulta_caso: 273 },
  { date: "2024-05-18", incidentes: 315, requerimiento: 350, fpqrs: 142, consulta_caso: 228 },
  { date: "2024-05-19", incidentes: 235, requerimiento: 180, fpqrs: 106, consulta_caso: 117 },
  { date: "2024-05-20", incidentes: 177, requerimiento: 230, fpqrs: 80,  consulta_caso: 150 },
  { date: "2024-05-21", incidentes: 82,  requerimiento: 140, fpqrs: 37,  consulta_caso: 91 },
  { date: "2024-05-22", incidentes: 81,  requerimiento: 120, fpqrs: 36,  consulta_caso: 78 },
  { date: "2024-05-23", incidentes: 252, requerimiento: 290, fpqrs: 113, consulta_caso: 189 },
  { date: "2024-05-24", incidentes: 294, requerimiento: 220, fpqrs: 132, consulta_caso: 143 },
  { date: "2024-05-25", incidentes: 201, requerimiento: 250, fpqrs: 90,  consulta_caso: 163 },
  { date: "2024-05-26", incidentes: 213, requerimiento: 170, fpqrs: 96,  consulta_caso: 111 },
  { date: "2024-05-27", incidentes: 420, requerimiento: 460, fpqrs: 189, consulta_caso: 299 },
  { date: "2024-05-28", incidentes: 233, requerimiento: 190, fpqrs: 105, consulta_caso: 124 },
  { date: "2024-05-29", incidentes: 78,  requerimiento: 130, fpqrs: 35,  consulta_caso: 85 },
  { date: "2024-05-30", incidentes: 340, requerimiento: 280, fpqrs: 153, consulta_caso: 182 },
  { date: "2024-05-31", incidentes: 178, requerimiento: 230, fpqrs: 80,  consulta_caso: 150 },

  { date: "2024-06-01", incidentes: 178, requerimiento: 200, fpqrs: 80,  consulta_caso: 130 },
  { date: "2024-06-02", incidentes: 470, requerimiento: 410, fpqrs: 212, consulta_caso: 267 },
  { date: "2024-06-03", incidentes: 103, requerimiento: 160, fpqrs: 46,  consulta_caso: 104 },
  { date: "2024-06-04", incidentes: 439, requerimiento: 380, fpqrs: 198, consulta_caso: 247 },
  { date: "2024-06-05", incidentes: 88,  requerimiento: 140, fpqrs: 40,  consulta_caso: 91 },
  { date: "2024-06-06", incidentes: 294, requerimiento: 250, fpqrs: 132, consulta_caso: 163 },
  { date: "2024-06-07", incidentes: 323, requerimiento: 370, fpqrs: 145, consulta_caso: 241 },
  { date: "2024-06-08", incidentes: 385, requerimiento: 320, fpqrs: 173, consulta_caso: 208 },
  { date: "2024-06-09", incidentes: 438, requerimiento: 480, fpqrs: 197, consulta_caso: 312 },
  { date: "2024-06-10", incidentes: 155, requerimiento: 200, fpqrs: 70,  consulta_caso: 130 },
  { date: "2024-06-11", incidentes: 92,  requerimiento: 150, fpqrs: 41,  consulta_caso: 98 },
  { date: "2024-06-12", incidentes: 492, requerimiento: 420, fpqrs: 221, consulta_caso: 273 },
  { date: "2024-06-13", incidentes: 81,  requerimiento: 130, fpqrs: 36,  consulta_caso: 85 },
  { date: "2024-06-14", incidentes: 426, requerimiento: 380, fpqrs: 192, consulta_caso: 247 },
  { date: "2024-06-15", incidentes: 307, requerimiento: 350, fpqrs: 138, consulta_caso: 228 },
  { date: "2024-06-16", incidentes: 371, requerimiento: 310, fpqrs: 167, consulta_caso: 202 },
  { date: "2024-06-17", incidentes: 475, requerimiento: 520, fpqrs: 214, consulta_caso: 338 },
  { date: "2024-06-18", incidentes: 107, requerimiento: 170, fpqrs: 48,  consulta_caso: 111 },
  { date: "2024-06-19", incidentes: 341, requerimiento: 290, fpqrs: 153, consulta_caso: 189 },
  { date: "2024-06-20", incidentes: 408, requerimiento: 450, fpqrs: 184, consulta_caso: 293 },
  { date: "2024-06-21", incidentes: 169, requerimiento: 210, fpqrs: 76,  consulta_caso: 137 },
  { date: "2024-06-22", incidentes: 317, requerimiento: 270, fpqrs: 143, consulta_caso: 176 },
  { date: "2024-06-23", incidentes: 480, requerimiento: 530, fpqrs: 216, consulta_caso: 345 },
  { date: "2024-06-24", incidentes: 132, requerimiento: 180, fpqrs: 59,  consulta_caso: 117 },
  { date: "2024-06-25", incidentes: 141, requerimiento: 190, fpqrs: 63,  consulta_caso: 124 },
  { date: "2024-06-26", incidentes: 434, requerimiento: 380, fpqrs: 195, consulta_caso: 247 },
  { date: "2024-06-27", incidentes: 448, requerimiento: 490, fpqrs: 202, consulta_caso: 319 },
  { date: "2024-06-28", incidentes: 149, requerimiento: 200, fpqrs: 67,  consulta_caso: 130 },
  { date: "2024-06-29", incidentes: 103, requerimiento: 160, fpqrs: 46,  consulta_caso: 104 },
  { date: "2024-06-30", incidentes: 446, requerimiento: 400, fpqrs: 201, consulta_caso: 260 },
];

const chartConfig = {
  visitors: { label: "Casos atendidos e Inyectados en " },
  incidentes: { label: "Incidentes", color: "var(--chart-1)" },
  requerimiento: { label: "Requerimientos", color: "var(--chart-2)" },
  fpqrs: { label: "FPQRS", color: "var(--chart-3)" },
  consulta_caso: { label: "Consulta Caso", color: "var(--chart-4)" },
} satisfies ChartConfig

export function ChartBarStacked() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    const daysToSubtract = timeRange === "30d" ? 30 : timeRange === "7d" ? 7 : 90
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total atenciones nexopus</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">Cantidad</span>
          <span className="@[540px]/card:hidden">3 meses</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 días</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 días</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart data={filteredData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
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