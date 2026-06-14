"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { RetrievalEngine } from "@/lib/engine";
import type { Hit, Metrics } from "@/lib/types";
import Header from "@/components/Header";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import ScrollProgress from "@/components/ScrollProgress";
import Constellation from "@/components/Constellation";
import SearchPanel from "@/components/SearchPanel";
import ClusterExplorer from "@/components/ClusterExplorer";
import KChart from "@/components/KChart";

const GH = "https://github.com/AyushDas4890/Library-book-classifier";

export default function Page() {
  const [engine, setEngine] = useState<RetrievalEngine | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [similarOf, setSimilarOf] = useState<Hit | null>(null);
  const [similar, setSimilar] = useState<Hit[]>([]);

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const e = new RetrievalEngine();
    e.load().then(() => { setEngine(e); setMetrics(e.metrics); });
  }, []);

  function showSimilar(h: Hit) {
    if (!engine) return;
    setSimilarOf(h);
    setSimilar(engine.similar(h.id, 8));
  }

  const d = metrics?.data;
  const c = metrics?.clustering;

  return (
    <>
      <ScrollProgress />
      <Header />

      <section className="hero" ref={heroRef}>
        <Constellation />
        <div className="glow" />
        <motion.div className="wrap inner" style={{ y: heroY, opacity: heroOpacity }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="eyebrow">Unsupervised ML · semantic retrieval</div>
          </motion.div>
          <motion.h1 className="display grad-text" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>
            The hidden shape of a city&apos;s reading.
          </motion.h1>
          <motion.p className="lede" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.22 }}>
            A reproducible pipeline that segments library titles by how they actually circulate, then lets you search the
            collection by meaning — built end to end on real Seattle Public Library open data.
          </motion.p>
          <motion.div style={{ display: "flex", gap: 12, flexWrap: "wrap" }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.34 }}>
            <a className="btn" href="#search">Try semantic search</a>
            <a className="btn ghost" href="#explore">Explore the clusters</a>
          </motion.div>
          {d && c && (
            <div className="stats">
              {[
                { v: <CountUp value={d.distinct_titles} />, l: "distinct titles analysed" },
                { v: <CountUp value={d.modelled_titles} />, l: "titles in the behavioural model" },
                { v: <CountUp value={c.k} />, l: "circulation archetypes (k)" },
                { v: <CountUp value={c.silhouette} decimals={2} />, l: "silhouette at chosen k" },
              ].map((s, i) => (
                <motion.div className="card stat" key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 + i * 0.1 }}>
                  <div className="v">{s.v}</div><div className="l">{s.l}</div>
                </motion.div>
              ))}
            </div>
          )}
          {d && <p className="src">{d.source} — {d.raw_rows.toLocaleString()} checkout records.</p>}
        </motion.div>
      </section>

      <section className="wrap section" id="search">
        <Reveal>
          <div className="section-head">
            <div className="eyebrow">Retrieval</div>
            <h2 className="display">Search the catalogue by meaning</h2>
            <p>Type a description, not a keyword. The query is embedded into the same vector space as every title and matched by cosine similarity — the retrieval core of a RAG system, running entirely in your browser.</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}><SearchPanel engine={engine} onSimilar={showSimilar} /></Reveal>
      </section>

      <section className="wrap section" id="explore">
        <Reveal>
          <div className="section-head">
            <div className="eyebrow">Segmentation</div>
            <h2 className="display">Six circulation archetypes</h2>
            <p>k-means over eight standardized behavioural features — demand, intensity, volatility, seasonality, format and age — not the subject of the book. Tap an archetype to see representative neighbours.</p>
          </div>
        </Reveal>
        {metrics && <Reveal delay={0.1}><ClusterExplorer engine={engine} clusters={metrics.clusters} onSimilar={showSimilar} /></Reveal>}
      </section>

      <section className="wrap section" id="method">
        <Reveal>
          <div className="section-head">
            <div className="eyebrow">Method &amp; honesty</div>
            <h2 className="display">How k was chosen</h2>
            <p>The number of clusters is selected by silhouette, reported plainly across the whole search range.</p>
          </div>
        </Reveal>
        {metrics && <Reveal delay={0.1}><KChart metrics={metrics} /></Reveal>}
        <Reveal delay={0.15}>
          <div className="method">
            <div className="grid">
              <div className="card"><h4><span className="dot" />Real data only</h4><p>Every figure comes from the Seattle Public Library &ldquo;Checkouts by Title&rdquo; open dataset. Nothing is synthetic.</p></div>
              <div className="card"><h4><span className="dot" />No inflated metrics</h4><p>Metrics are computed on the full model space at the chosen k — not a hand-picked subset forced to k=2.</p></div>
              <div className="card"><h4><span className="dot" />Reproducible</h4><p>A committed real sample, a fixed seed, a tested package and CI. Clone it and you get the same numbers.</p></div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer>
        <div className="wrap foot-in">
          <span>Built by Ayush Das · clustering + RAG over public-library open data.</span>
          <a href={GH} target="_blank" rel="noreferrer">github.com/AyushDas4890/Library-book-classifier</a>
        </div>
      </footer>

      {similarOf && (
        <div className="modal-bg" onClick={() => setSimilarOf(null)}>
          <motion.div className="modal" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="eyebrow">Most similar titles</div>
            <h3 className="display">{similarOf.title}</h3>
            <p style={{ color: "var(--muted)", marginTop: 0 }}>{similarOf.creator !== "Unknown" ? similarOf.creator : ""}</p>
            <div className="results">
              {similar.map((h) => (
                <div className="card row" key={h.id}>
                  <div><div className="t">{h.title}</div><div className="m">{h.subjects.slice(0, 72)}</div></div>
                  <span className="score mono">{h.score.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20 }}><button className="btn ghost" onClick={() => setSimilarOf(null)}>Close</button></div>
          </motion.div>
        </div>
      )}
    </>
  );
}
