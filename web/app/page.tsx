"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RetrievalEngine } from "@/lib/engine";
import type { Hit, Metrics } from "@/lib/types";
import ScrollProgress from "@/components/ScrollProgress";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import SearchPanel from "@/components/SearchPanel";
import ClusterGalaxy from "@/components/ClusterGalaxy";
import KChart from "@/components/KChart";

const GH = "https://github.com/AyushDas4890/Library-book-classifier";

export default function Page() {
  const [engine, setEngine] = useState<RetrievalEngine | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [similarOf, setSimilarOf] = useState<Hit | null>(null);
  const [similar, setSimilar] = useState<Hit[]>([]);

  useEffect(() => {
    const e = new RetrievalEngine();
    e.load().then(() => { setEngine(e); setMetrics(e.metrics); });
  }, []);

  function showSimilar(h: Hit) {
    if (!engine) return;
    setSimilarOf(h);
    setSimilar(engine.similar(h.id, 8));
  }

  return (
    <>
      <ScrollProgress />
      <Header />
      <Hero metrics={metrics} />

      {engine && (
        <div className="wrap" style={{ marginTop: -10 }}>
          <Marquee catalog={engine.catalog} />
        </div>
      )}

      <section className="wrap section" id="search">
        <Reveal>
          <div className="section-head">
            <div className="eyebrow">Retrieval</div>
            <h2 className="display">Search the catalogue <span className="grad">by meaning</span></h2>
            <p>Type a description, not a keyword. The query is embedded into the same vector space as every title and matched by cosine similarity — the retrieval core of a RAG system, running entirely in your browser.</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}><SearchPanel engine={engine} onSimilar={showSimilar} /></Reveal>
      </section>

      <section className="wrap section" id="explore">
        <Reveal>
          <div className="section-head">
            <div className="eyebrow">Segmentation</div>
            <h2 className="display">A galaxy of <span className="grad">circulation archetypes</span></h2>
            <p>k-means over eight standardized behavioural features — demand, intensity, volatility, seasonality, format and age — not the subject of the book. Tap an archetype to see representative neighbours.</p>
          </div>
        </Reveal>
        {metrics && <ClusterGalaxy engine={engine} clusters={metrics.clusters} onSimilar={showSimilar} />}
      </section>

      <section className="wrap section" id="method">
        <Reveal>
          <div className="section-head">
            <div className="eyebrow">Method &amp; honesty</div>
            <h2 className="display">How <span className="grad">k</span> was chosen</h2>
            <p>The number of clusters is selected by silhouette, reported plainly across the whole search range.</p>
          </div>
        </Reveal>
        {metrics && <Reveal delay={0.1}><KChart metrics={metrics} /></Reveal>}
        <div className="method-grid">
          {[
            ["Real data only", "Every figure comes from the Seattle Public Library “Checkouts by Title” open dataset. Nothing is synthetic."],
            ["No inflated metrics", "Metrics are computed on the full model space at the chosen k — not a hand-picked subset forced to k=2."],
            ["Reproducible", "A committed real sample, a fixed seed, a tested package and CI. Clone it and you get the same numbers."],
          ].map(([h, p], i) => (
            <motion.div className="method-card" key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.55, delay: i * 0.1 }}>
              <h4>{h}</h4><p>{p}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer>
        <div className="wrap">
          <Reveal><div className="display foot-big">Read the <span className="grad">city.</span></div></Reveal>
          <div className="foot-row">
            <span>Built by Ayush Das · clustering + RAG over public-library open data.</span>
            <a href={GH} target="_blank" rel="noreferrer" className="pill">View on GitHub</a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {similarOf && (
          <motion.div className="modal-bg" onClick={() => setSimilarOf(null)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              <div className="eyebrow">Most similar titles</div>
              <h3 className="display">{similarOf.title}</h3>
              <p style={{ color: "var(--muted)", marginTop: 0 }}>{similarOf.creator !== "Unknown" ? similarOf.creator : ""}</p>
              <div className="results">
                {similar.map((h) => (
                  <div className="row" key={h.id}>
                    <div><div className="t">{h.title}</div><div className="m">{h.subjects.slice(0, 72)}</div></div>
                    <span className="score mono">{h.score.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18 }}><button className="pill" onClick={() => setSimilarOf(null)}>Close</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
