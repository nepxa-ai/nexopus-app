import { z } from "zod"

export const caseSchema = z.object({
  id: z.number(),
  header: z.string(),
  // Tipamos los 3 tipos que vas a usar en la UI
  type: z.enum(["Incidente", "Requerimiento", "Consulta de caso", "fpqrs"]),
  status: z.string(),
  target: z.string().optional().default(""),
  limit: z.string().optional().default(""),
  reviewer: z.string().optional().default("Assign reviewer"),
})

export type CaseItem = z.infer<typeof caseSchema>