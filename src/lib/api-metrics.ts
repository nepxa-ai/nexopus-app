// lib/api.ts
export async function getMetrics(window: '1d'|'7d'|'30d'|'90d'='7d') {
  const r = await fetch(`/api/metrics/attentions/window?window=${window}`);
  return r.json();
}

export async function getMetricsSummary(window: '1d'|'7d'|'30d'|'90d'='7d') {
  const r = await fetch(`/api/metrics/attentions/summary/window?window=${window}`);
  return r.json();
}