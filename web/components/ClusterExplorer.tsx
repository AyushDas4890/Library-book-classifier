"use client";
import { useEffect, useRef } from "react";
import type { Book, ClusterProfile, Hit } from "@/lib/types";
import type { RetrievalEngine } from "@/lib/engine";

const COLORS = ["#1f6f5c", "#b9532a", "#3f6cb0", "#9a6cb0", "#c79a2e", "#4a7a3a", "#777", "#555", "#999", "#333"];

function Scatter({ catalog }: { catalog: Book[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const W = 720, H = 480, pad = 24;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.aspectRatio = `${W} / ${H}`;
    const ctx = cv.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const xs = catalog.map((b) => b.pc1), ys = catalog.map((b) => b.pc2);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const sx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (W - 2 * pad);
    const sy = (y: number) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad);
    ctx.clearRect(0, 0, W, H);
    for (const b of catalog) {
      ctx.beginPath();
      ctx.fillStyle = COLORS[b.cluster % COLORS.length] + "cc";
      const r = 1.6 + Math.min(3.4, Math.log1p(b.checkouts) / 3);
      ctx.arc(sx(b.pc1), sy(b.pc2), r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [catalog]);
  return <canvas ref={ref} role="img" aria-label="PCA scatter of clustered titles" />;
}

export default function ClusterExplorer({
  engine,
  clusters,
  onSimilar,
}: {
  engine: RetrievalEngine | null;
  clusters: ClusterProfile[];
  onSimilar: (h: Hit) => void;
}) {
  if (!engine) return null;
  return (
    <div className="explore-grid">
      <div className="card scatter-wrap">
        <Scatter catalog={engine.catalog} />
        <p style={{ fontSize: 12.5, color: "var(--faint)", margin: "10px 4px 0" }}>
          Each point is one of the {engine.catalog.length.toLocaleString()} most-circulated titles, placed by a 2-D PCA of
          its standardized behavioural features and coloured by cluster. Point size scales with total checkouts.
        </p>
      </div>
      <div className="legend">
        {clusters.map((c) => (
          <div
            className="card cl-card"
            key={c.cluster}
            onClick={() => {
              const seed = engine.catalog.find((b) => b.cluster === c.cluster);
              if (seed) onSimilar({ ...seed, score: 1 });
            }}
          >
            <div className="top">
              <span className="name">
                <span className="swatch" style={{ background: COLORS[c.cluster % COLORS.length] }} />
                {c.label}
              </span>
              <span className="share">{(c.share * 100).toFixed(1)}%</span>
            </div>
            <div className="feats">
              {c.top_features.map((f) => `${f.direction === "high" ? "↑" : "↓"} ${f.label}`).join("  ·  ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
