"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Book, ClusterProfile, Hit } from "@/lib/types";
import type { RetrievalEngine } from "@/lib/engine";

const COLORS = ["#2dd4bf", "#f5b13d", "#6aa6ff", "#b388ff", "#f472b6", "#7bdc8a", "#88e0d0", "#c0c0c0"];

function Galaxy({ catalog }: { catalog: Book[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const W = 760, H = 520, pad = 30;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; cv.style.aspectRatio = `${W} / ${H}`;
    ctx.scale(dpr, dpr);
    const xs = catalog.map((b) => b.pc1), ys = catalog.map((b) => b.pc2);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const sx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (W - 2 * pad);
    const sy = (y: number) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad);
    const stars = catalog.map((b) => ({
      x: sx(b.pc1), y: sy(b.pc2),
      r: 1.5 + Math.min(3.6, Math.log1p(b.checkouts) / 3),
      c: COLORS[b.cluster % COLORS.length],
      ph: Math.random() * Math.PI * 2, sp: 0.6 + Math.random() * 1.4,
    }));
    let raf = 0, t = 0;
    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        const tw = 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
        ctx.globalAlpha = 0.35 + 0.55 * tw;
        ctx.fillStyle = s.c;
        ctx.shadowColor = s.c; ctx.shadowBlur = 8 * tw;
        ctx.beginPath();
        ctx.arc(s.x + Math.sin(t * 0.3 + s.ph) * 1.3, s.y + Math.cos(t * 0.25 + s.ph) * 1.3, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [catalog]);
  return <canvas ref={ref} role="img" aria-label="Animated PCA scatter of clustered titles" />;
}

export default function ClusterGalaxy({
  engine, clusters, onSimilar,
}: { engine: RetrievalEngine | null; clusters: ClusterProfile[]; onSimilar: (h: Hit) => void }) {
  if (!engine) return null;
  return (
    <div className="explore-grid">
      <motion.div className="galaxy"
        initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
        <Galaxy catalog={engine.catalog} />
        <p style={{ fontSize: 12.5, color: "var(--faint)", margin: 0, padding: "0 16px 16px" }}>
          Each star is one of the {engine.catalog.length.toLocaleString()} most-circulated titles, placed by a 2-D PCA of its
          standardized behavioural features and coloured by cluster. Size scales with total checkouts.
        </p>
      </motion.div>
      <div className="legend">
        {clusters.map((c, i) => (
          <motion.div className="cl-card" key={c.cluster}
            initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay: i * 0.06 }}
            onClick={() => { const seed = engine.catalog.find((b) => b.cluster === c.cluster); if (seed) onSimilar({ ...seed, score: 1 }); }}>
            <div className="top">
              <span className="name">
                <span className="swatch" style={{ background: COLORS[c.cluster % COLORS.length], color: COLORS[c.cluster % COLORS.length] }} />
                {c.label}
              </span>
              <span className="share">{(c.share * 100).toFixed(1)}%</span>
            </div>
            <div className="feats">{c.top_features.map((f) => `${f.direction === "high" ? "↑" : "↓"} ${f.label}`).join("  ·  ")}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
