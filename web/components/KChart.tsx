"use client";
import { motion } from "framer-motion";
import type { Metrics } from "@/lib/types";

export default function KChart({ metrics }: { metrics: Metrics }) {
  const data = metrics.k_selection;
  const chosen = metrics.clustering.k;
  const W = 620, H = 260, pad = 44;
  const ks = data.map((d) => d.k);
  const sil = data.map((d) => d.silhouette);
  const minK = Math.min(...ks), maxK = Math.max(...ks);
  const minS = Math.min(...sil), maxS = Math.max(...sil);
  const sx = (k: number) => pad + ((k - minK) / (maxK - minK || 1)) * (W - 2 * pad);
  const sy = (s: number) => H - pad - ((s - minS) / (maxS - minS || 1)) * (H - 2 * pad);
  const path = data.map((d, i) => `${i ? "L" : "M"}${sx(d.k)},${sy(d.silhouette)}`).join(" ");
  return (
    <div className="kchart">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Silhouette score by number of clusters">
        <defs>
          <linearGradient id="kg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2dd4bf" /><stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="rgba(255,255,255,.12)" />
        <line x1={sx(chosen)} y1={pad - 6} x2={sx(chosen)} y2={H - pad} stroke="rgba(139,92,246,.45)" strokeDasharray="4 4" />
        <motion.path d={path} fill="none" stroke="url(#kg)" strokeWidth={2.5} strokeLinecap="round"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: "easeInOut" }} />
        {data.map((d, i) => (
          <motion.g key={d.k} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 + i * 0.05 }}>
            <circle cx={sx(d.k)} cy={sy(d.silhouette)} r={d.k === chosen ? 6.5 : 3.5} fill={d.k === chosen ? "#8b5cf6" : "#2dd4bf"} />
            <text x={sx(d.k)} y={H - pad + 20} textAnchor="middle" fontSize="11" fill="var(--muted)" className="mono">{d.k}</text>
          </motion.g>
        ))}
        <text x={sx(chosen)} y={sy(sil[ks.indexOf(chosen)]) - 14} textAnchor="middle" fontSize="12" fill="#b388ff" className="mono">k = {chosen}</text>
        <text x={pad - 10} y={pad} textAnchor="end" fontSize="11" fill="var(--faint)" className="mono">{maxS.toFixed(2)}</text>
        <text x={pad - 10} y={H - pad} textAnchor="end" fontSize="11" fill="var(--faint)" className="mono">{minS.toFixed(2)}</text>
      </svg>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: "10px 4px 0" }}>
        Silhouette across k = {minK}–{maxK}, chosen by the peak on a fixed 20k evaluation sample — no forcing. Selected k = {chosen}.
      </p>
    </div>
  );
}
