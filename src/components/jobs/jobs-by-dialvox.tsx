"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";



type Estado = "running" | "success" | "error" | "waiting" | "canceled";

export interface ExecutionItem {
  id: number;
  id_job: number;
  workflow_name: string;
  id_dialvox: number;
  estado: Estado;
  created_at?: string; // opcional por si luego lo agregas en la DB
}

interface Props {
  items: ExecutionItem[];
}

/** Mapea estado a estilo visual */
function estadoBadgeVariant(estado: Estado): { label: string; variant: "default" | "outline" | "destructive" } {
  switch (estado) {
    case "success":
      return { label: "Success", variant: "default" };
    case "error":
      return { label: "Error", variant: "destructive" };
    case "running":
      return { label: "Success", variant: "outline" }; //CAMBIAR
    case "waiting":
      return { label: "Waiting", variant: "outline" };
    case "canceled":
      return { label: "Canceled", variant: "outline" };
    default:
      return { label: estado, variant: "outline" };
  }
}

/**
 * Componente tipo "Audit Log" agrupado por id_dialvox,
 * similar a la UI de Nginx Proxy Manager pero para tus executions.
 */
export function AuditLogByDialvox({ items }: Props) {
  const [search, setSearch] = React.useState("");

  // Agrupar por id_dialvox
  const grouped = React.useMemo(() => {
    const map = new Map<number, ExecutionItem[]>();

    items.forEach((item) => {
      if (!map.has(item.id_dialvox)) {
        map.set(item.id_dialvox, []);
      }
      map.get(item.id_dialvox)!.push(item);
    });

    // Filtrar por búsqueda (por id_dialvox o workflow_name)
    const entries = Array.from(map.entries()).filter(([id_dialvox, groupItems]) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      const idMatch = id_dialvox.toString().includes(term);
      const nameMatch = groupItems.some((g) =>
        g.workflow_name.toLowerCase().includes(term)
      );
      return idMatch || nameMatch;
    });

    // Ordenar por id_dialvox descendente
    entries.sort((a, b) => b[0] - a[0]);

    return entries;
  }, [items, search]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xl font-semibold">
          Seguimiento por ID Dialvox
        </CardTitle>
        <div className="w-64">
          <Input
            placeholder="Buscar por id_dialvox o workflow…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[540px] pr-2">
          {grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay ejecuciones para los filtros actuales.
            </p>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {grouped.map(([id_dialvox, groupItems]) => (
                <AccordionItem
                  key={id_dialvox}
                  value={String(id_dialvox)}
                  className="border rounded-md px-3"
                >
                  <AccordionTrigger className="flex items-center justify-between gap-4 py-3 min-h-[64px]">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                        {groupItems.length}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold">
                          ID Dialvox #{id_dialvox}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {groupItems[0]?.workflow_name}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
                          <TableHead>ID Job n8n</TableHead>
                          <TableHead>Workflow</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupItems
                          .slice()
                          .sort((a, b) => b.id - a.id)
                          .map((item) => {
                            const estadoView = estadoBadgeVariant(item.estado);
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="font-mono text-xs">
                                  {item.id}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {item.id_job}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {item.workflow_name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={estadoView.variant}>
                                    {estadoView.label}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}