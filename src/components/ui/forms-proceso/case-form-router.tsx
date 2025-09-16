"use client"
import { CaseItem } from "./types"
import FormIncidente from "./form-incidente"
import FormRequerimiento from "./form-requerimiento"
import FormConsultaCaso from "./form-consulta-caso"

export default function CaseFormRouter({ item, onSubmit }: { item: CaseItem; onSubmit?: (p:any)=>void }) {
  switch (item.type) {
    case "Incidente": return <FormIncidente item={item} onSubmit={onSubmit} />
    case "Requerimiento": return <FormRequerimiento item={item} onSubmit={onSubmit} />
    case "Consulta de caso":
    default: return <FormConsultaCaso item={item} onSubmit={onSubmit} />
  }
}
