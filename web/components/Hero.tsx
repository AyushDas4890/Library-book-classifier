"use client";
import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { Metrics } from "@/lib/types";
import CountUp from "./CountUp";

const WORDS = ["The", "hidden", "shape", "of", "a", "city's", "reading."];

function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const N = 64;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0006, vy: (Math.random() - 0.5) * 0.0006,
    }));
    const resize = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
      }
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = pts[i], b = pts[j];
          const dx = (a.x - b.x) * w, dy = (a.y - b.y) * h;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            ctx.strokeStyle = `rgba(45,212,191,${0.12 * (1 - d / 130)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x * w, a.y * h); ctx.lineTo(b.x * w, b.y * h); ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = "rgba(160,180,255,.55)";
        ctx.beginPath(); ctx.arc(p.x * w, p.y * h, 1.7, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="hero-particles" aria-hidden style={{ width: "100%", height: "100%" }} />;
}

export default function Hero({ metrics }: { metrics: Metrics | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const d = metrics?.data;
  const c = metrics?.clustering;
  return (
    <section className="hero" ref={ref}>
      <Particles />
      <motion.div className="wrap" style={{ y, opacity }}>
        <motion.div className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          Unsupervised ML · semantic retrieval
        </motion.div>
        <h1 className="display">
          {WORDS.map((wd, i) => (
            <motion.span
              key={i}
              className="word"
              initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {i >= 5 ? <span className="grad">{wd}</span> : wd}
            </motion.span>
          ))}
        </h1>
        <motion.p className="lede" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          A reproducible pipeline that segments library titles by how they actually circulate, then lets you search the
          collection by meaning — built end to end on real Seattle Public Library open data.
        </motion.p>
        <motion.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 }}>
          <a className="pill solid" href="#search">Try semantic search</a>
          <a className="pill" href="#explore">Explore the clusters</a>
        </motion.div>

        {d && c && (
          <div className="stats">
            <div className="stat"><div className="v"><CountUp to={d.distinct_titles} /></div><div className="l">distinct titles analysed</div></div>
            <div className="stat"><div className="v"><CountUp to={d.modelled_titles} /></div><div className="l">titles in the behavioural model</div></div>
            <div className="stat"><div className="v"><CountUp to={c.k} /></div><div className="l">circulation archetypes (k)</div></div>
            <div className="stat"><div className="v"><CountUp to={c.silhouette} decimals={2} /></div><div className="l">silhouette at chosen k</div></div>
          </div>
        )}
        {d && <p className="src">Source: {d.source}. {d.raw_rows.toLocaleString()} checkout records.</p>}
      </motion.div>
    </section>
  );
}
