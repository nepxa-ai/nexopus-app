"use client"

import * as React from "react"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getMetricsTotals } from "@/lib/api-metrics"

export function SectionCards() {

  const [totalAll, setTotalAll] = React.useState<number | null>(null)
  const [totalToday, setTotalToday] = React.useState<number | null>(null) 

    React.useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        const { total_all, total_today } = await getMetricsTotals()
        if (!cancel) {
          setTotalAll(total_all ?? 0)
          setTotalToday(total_today ?? 0)
        }
      } catch (e) {
        console.error("metrics totals error:", e)
        if (!cancel) {
          setTotalAll(0)
          setTotalToday(0)
        }
      }
    })()
    return () => { cancel = true }
  }, [])

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Card 1: Total histórico */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Casos Atendidos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalAll ?? "—"}
          </CardTitle>
          <CardAction>
            {/* <Badge variant="outline">
              <IconTrendingUp />
               opcional: % variación mensual si luego lo calculas
              +12.5%
            </Badge>  */}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm" />
      </Card>

      {/* Card 2: Total del día */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Atenciones de hoy</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalToday ?? "—"}
          </CardTitle>
          <CardAction>
            {/*
             <Badge variant="outline">
              <IconTrendingDown />
               opcional: % vs. ayer si luego lo calculas
              -11.67%
            </Badge> */}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm" />
      </Card>

      {/* Card 3 y 4: sin cambios */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Casos Reajustados po CDS</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            3
          </CardTitle>
          <CardAction>
            {/* <Badge variant="outline">
              <IconTrendingUp />
              +3.5%
            </Badge> */}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm" />
      </Card>

      {/* Card 2: Total del día 
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tiempo Promedio llamada?</CardDescription>
        </CardHeader>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            1m-30s
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm" />
      </Card> */}
    </div>
  )
}
