"use client";
import { motion } from "framer-motion";
import type { Metrics } from "@/lib/types";

export default function KChart({ metrics }: { metrics: Metrics }) {
  const data = metrics.k_selection;
  const chosen = metrics.clustering.k;
  const W = 580, H = 260, pad = 44;
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
            stroke={d.k === chosen ? "var(--lime)" : "var(--line)"} strokeDasharray={d.k === chosen ? "0" : "3 4"} opacity={d.k === chosen ? 0.5 : 1} />
        ))}
        <motion.path d={path} fill="none" stroke="var(--lime)" strokeWidth={2.2}
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: "easeInOut" }} />
        {data.map((d, i) => (
          <motion.g key={d.k} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.6 + i * 0.07, type: "spring", stiffness: 300, damping: 20 }} style={{ transformOrigin: `${sx(d.k)}px ${sy(d.silhouette)}px` }}>
            <circle cx={sx(d.k)} cy={sy(d.silhouette)} r={d.k === chosen ? 6.5 : 3.5}
              fill={d.k === chosen ? "var(--lime)" : "var(--ink)"} />
            <text x={sx(d.k)} y={H - pad + 20} textAnchor="middle" fontSize="11" fill="var(--muted)" className="mono">{d.k}</text>
          </motion.g>
        ))}
        <text x={sx(chosen)} y={sy(sil[ks.indexOf(chosen)]) - 16} textAnchor="middle" fontSize="12" fill="var(--lime)" className="mono">k={chosen}</text>
        <text x={pad - 10} y={pad} textAnchor="end" fontSize="11" fill="var(--muted)" className="mono">{maxS.toFixed(2)}</text>
        <text x={pad - 10} y={H - pad} textAnchor="end" fontSize="11" fill="var(--muted)" className="mono">{minS.toFixed(2)}</text>
      </svg>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "10px 6px 0" }}>
        Silhouette across k = {minK}–{maxK}, on a fixed 20k evaluation sample. k is the peak — no forcing, no cherry-picking. Selected k = {chosen}.
      </p>
    </div>
  );
}
