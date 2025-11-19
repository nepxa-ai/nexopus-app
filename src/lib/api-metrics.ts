// lib/api-metrics.ts
export async function getMetrics(window: '1d'|'7d'|'30d'|'90d'='7d') {
  const r = await fetch(`/api/metrics/attentions/window?window=${window}`);
  return r.json();
}

export async function getMetricsSummary(window: '1d'|'7d'|'30d'|'90d'='7d') {
  const r = await fetch(`/api/metrics/attentions/summary/window?window=${window}`);
  return r.json();
}

export async function getMetricsTotals() {
  const r = await fetch(`/api/metrics/attentions/totals`, { cache: "no-store" })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json() as Promise<{ total_all: number; total_today: number }>
}