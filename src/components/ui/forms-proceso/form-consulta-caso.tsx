"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CaseItem } from "./types"
import { opcionesGenerales } from "./opciones"

type Props = { item: CaseItem; onSubmit?: (payload: CaseItem) => void }

export default function FormConsultaCaso({ item, onSubmit }: Props) {
  const [v, setV] = React.useState({
    header: item.header,
    status: item.status,
    target: item.target ?? "",
    limit: item.limit ?? "",
    reviewer: item.reviewer ?? "Assign reviewer",
  })

  return (
    <form className="flex flex-col gap-4" onSubmit={(e)=>{e.preventDefault(); onSubmit?.({ ...item, ...v })}}>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2"><Label>Id atención</Label><Input value={v.header} onChange={(e)=>setV(s=>({...s, header:e.target.value}))}/></div>
        <div className="flex flex-col gap-2">
          <Label>Estado</Label>
          <Select defaultValue={v.status} onValueChange={(x)=>setV(s=>({...s, status:x}))}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>{opcionesGenerales.status.map(x=> <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2"><Label>Target</Label><Input value={v.target} onChange={(e)=>setV(s=>({...s, target:e.target.value}))}/></div>
        <div className="flex flex-col gap-2"><Label>Limit</Label><Input value={v.limit} onChange={(e)=>setV(s=>({...s, limit:e.target.value}))}/></div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Gestor</Label>
        <Select defaultValue={v.reviewer} onValueChange={(x)=>setV(s=>({...s, reviewer:x}))}>
          <SelectTrigger><SelectValue placeholder="Asignar" /></SelectTrigger>
          <SelectContent>{opcionesGenerales.reviewers.map(x=> <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Separator />
      <div className="flex justify-end"><Button type="submit">Guardar</Button></div>
    </form>
  )
}