"use client";
import { useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import type { Book, ClusterProfile, Hit } from "@/lib/types";
import type { RetrievalEngine } from "@/lib/engine";

const COLORS = ["#c7f24a", "#4ad0f2", "#f24a8b", "#b98cff", "#f2b84a", "#6be39a", "#ff7a59", "#7aa2ff", "#e0e0e0", "#8a8a8a"];

function Scatter({ catalog }: { catalog: Book[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  useEffect(() => {
    const cv = ref.current;
    if (!cv || !inView) return;
    const W = 720, H = 500, pad = 26;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.aspectRatio = `${W} / ${H}`;
    const ctx = cv.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const xs = catalog.map((b) => b.pc1), ys = catalog.map((b) => b.pc2);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const sx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (W - 2 * pad);
    const sy = (y: number) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad);
    const order = catalog.map((_, i) => i);
    const t0 = performance.now();
    const DUR = 1200;
    let raf = 0;
    const frame = (t: number) => {
      const p = Math.min(1, (t - t0) / DUR);
      const e = 1 - Math.pow(1 - p, 3);
      const shown = Math.floor(order.length * e);
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < shown; i++) {
        const b = catalog[order[i]];
        ctx.beginPath();
        ctx.fillStyle = COLORS[b.cluster % COLORS.length] + "cc";
        const r = 1.6 + Math.min(3.6, Math.log1p(b.checkouts) / 3);
        ctx.arc(sx(b.pc1), sy(b.pc2), r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [catalog, inView]);
  return <canvas className="scatter" ref={ref} role="img" aria-label="PCA scatter of clustered titles" />;
}

export default function ClusterExplorer({
  engine, clusters, onSimilar,
}: { engine: RetrievalEngine | null; clusters: ClusterProfile[]; onSimilar: (h: Hit) => void }) {
  if (!engine) return null;
  return (
    <div className="explore-grid">
      <div className="card scatter-wrap">
        <Scatter catalog={engine.catalog} />
        <p style={{ fontSize: 12.5, color: "var(--faint)", margin: "12px 6px 0" }}>
          Each point is one of the {engine.catalog.length.toLocaleString()} most-circulated titles, placed by a 2-D PCA of its
          standardized behavioural features and coloured by cluster. Point size scales with total checkouts.
        </p>
      </div>
      <div className="legend">
        {clusters.map((c) => (
          <div className="card cl-card" key={c.cluster}
            onClick={() => { const seed = engine.catalog.find((b) => b.cluster === c.cluster); if (seed) onSimilar({ ...seed, score: 1 }); }}>
            <div className="top">
              <span className="name">
                <span className="swatch" style={{ background: COLORS[c.cluster % COLORS.length], color: COLORS[c.cluster % COLORS.length] }} />
                {c.label}
              </span>
              <span className="share">{(c.share * 100).toFixed(1)}%</span>
            </div>
            <div className="feats">
              {c.top_features.map((f) => `${f.direction === "high" ? "↑" : "↓"} ${f.label}`).join("   ·   ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
