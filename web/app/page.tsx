"use client";
import { useEffect, useState } from "react";
import { RetrievalEngine } from "@/lib/engine";
import type { Hit, Metrics } from "@/lib/types";
import Header from "@/components/Header";
import Reveal from "@/components/Reveal";
import SearchPanel from "@/components/SearchPanel";
import ClusterExplorer from "@/components/ClusterExplorer";
import KChart from "@/components/KChart";

const GH = "https://github.com/AyushDas4890/Library-book-classifier";

export default function Page() {
  const [engine, setEngine] = useState<RetrievalEngine | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [similarOf, setSimilarOf] = useState<Hit | null>(null);
  const [similar, setSimilar] = useState<Hit[]>([]);

  useEffect(() => {
    const e = new RetrievalEngine();
    e.load().then(() => {
      setEngine(e);
      setMetrics(e.metrics);
    });
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
      <Header />

      <section className="wrap hero">
        <Reveal>
          <div className="eyebrow">Unsupervised ML · semantic retrieval</div>
          <h1 className="display">The hidden shape of a city&apos;s reading.</h1>
          <p className="lede">
            A reproducible pipeline that segments library titles by how they actually circulate, then lets you search the
            collection by meaning — built end to end on real Seattle Public Library open data.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <a className="btn" href="#search">Try semantic search</a>
            <a className="btn ghost" href="#explore">Explore the clusters</a>
          </div>
          {d && (
            <div className="stats">
              <div className="card stat"><div className="v">{d.distinct_titles.toLocaleString()}</div><div className="l">distinct titles analysed</div></div>
              <div className="card stat"><div className="v">{d.modelled_titles.toLocaleString()}</div><div className="l">titles in the behavioural model</div></div>
              <div className="card stat"><div className="v">{c!.k}</div><div className="l">circulation archetypes (k)</div></div>
              <div className="card stat"><div className="v">{c!.silhouette.toFixed(2)}</div><div className="l">silhouette at chosen k</div></div>
            </div>
          )}
          {d && <p className="src">Source: {d.source}. {d.raw_rows.toLocaleString()} checkout records.</p>}
        </Reveal>
      </section>

      <section className="wrap section" id="search">
        <Reveal>
          <div className="section-head">
            <div className="eyebrow">Retrieval</div>
            <h2 className="display">Search the catalogue by meaning</h2>
            <p>
              Type a description, not a keyword. The query is embedded into the same vector space as every title and
              matched by cosine similarity — the retrieval core of a RAG system, running entirely in your browser.
            </p>
          </div>
          <SearchPanel engine={engine} onSimilar={showSimilar} />
        </Reveal>
      </section>

      <section className="wrap section" id="explore">
        <Reveal>
          <div className="section-head">
            <div className="eyebrow">Segmentation</div>
            <h2 className="display">Six circulation archetypes</h2>
            <p>
              k-means over eight standardized behavioural features — demand, intensity, volatility, seasonality, format
              and age — not the subject of the book. Tap an archetype to see representative neighbours.
            </p>
          </div>
          {metrics && <ClusterExplorer engine={engine} clusters={metrics.clusters} onSimilar={showSimilar} />}
        </Reveal>
      </section>

      <section className="wrap section" id="method">
        <Reveal>
          <div className="section-head">
            <div className="eyebrow">Method &amp; honesty</div>
            <h2 className="display">How k was chosen</h2>
            <p>The number of clusters is selected by silhouette, reported plainly across the whole search range.</p>
          </div>
          {metrics && <KChart metrics={metrics} />}
          <div className="method" style={{ marginTop: 28 }}>
            <div className="grid">
              <div className="card"><h4>Real data only</h4><p>Every figure comes from the Seattle Public Library &ldquo;Checkouts by Title&rdquo; open dataset. Nothing is synthetic.</p></div>
              <div className="card"><h4>No inflated metrics</h4><p>Metrics are computed on the full model space at the chosen k — not on a hand-picked subset forced to k=2.</p></div>
              <div className="card"><h4>Reproducible</h4><p>A committed real sample, a fixed seed, a tested package and CI. Clone it and you get the same numbers.</p></div>
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="eyebrow">Most similar titles</div>
            <h3 className="display">{similarOf.title}</h3>
            <p style={{ color: "var(--muted)", marginTop: 0 }}>
              {similarOf.creator !== "Unknown" ? similarOf.creator : ""}
            </p>
            <div className="results">
              {similar.map((h) => (
                <div className="card row" key={h.id}>
                  <div>
                    <div className="t">{h.title}</div>
                    <div className="m">{h.subjects.slice(0, 72)}</div>
                  </div>
                  <span className="score mono">{h.score.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" onClick={() => setSimilarOf(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
