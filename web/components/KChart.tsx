"use client";
import type { Metrics } from "@/lib/types";

export default function KChart({ metrics }: { metrics: Metrics }) {
  const data = metrics.k_selection;
  const chosen = metrics.clustering.k;
  const W = 560, H = 240, pad = 40;
  const ks = data.map((d) => d.k);
  const sil = data.map((d) => d.silhouette);
  const minK = Math.min(...ks), maxK = Math.max(...ks);
  const minS = Math.min(...sil), maxS = Math.max(...sil);
  const sx = (k: number) => pad + ((k - minK) / (maxK - minK || 1)) * (W - 2 * pad);
  const sy = (s: number) => H - pad - ((s - minS) / (maxS - minS || 1)) * (H - 2 * pad);
  const path = data.map((d, i) => `${i ? "L" : "M"}${sx(d.k)},${sy(d.silhouette)}`).join(" ");
  return (
    <div className="card kchart">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Silhouette score by number of clusters">
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--line)" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="var(--line)" />
        {data.map((d) => (
          <line key={d.k} x1={sx(d.k)} y1={sy(d.silhouette)} x2={sx(d.k)} y2={H - pad}
            stroke={d.k === chosen ? "var(--accent)" : "var(--line)"} strokeDasharray={d.k === chosen ? "0" : "3 3"} />
        ))}
        <path d={path} fill="none" stroke="var(--ink)" strokeWidth={2} />
        {data.map((d) => (
          <g key={d.k}>
            <circle cx={sx(d.k)} cy={sy(d.silhouette)} r={d.k === chosen ? 6 : 3.5}
              fill={d.k === chosen ? "var(--accent)" : "var(--ink)"} />
            <text x={sx(d.k)} y={H - pad + 18} textAnchor="middle" fontSize="11" fill="var(--muted)">{d.k}</text>
          </g>
        ))}
        <text x={sx(chosen)} y={sy(sil[ks.indexOf(chosen)]) - 14} textAnchor="middle" fontSize="11" fill="var(--accent)">
          k = {chosen}
        </text>
        <text x={pad - 8} y={pad} textAnchor="end" fontSize="11" fill="var(--muted)">{maxS.toFixed(2)}</text>
        <text x={pad - 8} y={H - pad} textAnchor="end" fontSize="11" fill="var(--muted)">{minS.toFixed(2)}</text>
      </svg>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 4px 0" }}>
        Silhouette score across k = {minK}–{maxK}. k is chosen by the peak silhouette on a fixed 20k evaluation sample —
        no forcing, no cherry-picking. Selected k = {chosen}.
      </p>
    </div>
  );
}
