"use client";
import { useState } from "react";
import type { Hit } from "@/lib/types";
import type { RetrievalEngine } from "@/lib/engine";

const EXAMPLES = [
  "space science fiction adventure",
  "grief and healing memoir",
  "world war two history",
  "cozy mystery small town",
  "machine learning and data",
  "picture book about feelings",
];

export default function SearchPanel({
  engine,
  onSimilar,
}: {
  engine: RetrievalEngine | null;
  onSimilar: (h: Hit) => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [noTokens, setNoTokens] = useState(false);

  function run(query: string) {
    setQ(query);
    if (!engine || !query.trim()) {
      setHits(null);
      return;
    }
    const res = engine.search(query, 12);
    setNoTokens(res.length === 0);
    setHits(res);
  }

  return (
    <div>
      <div className="search-box">
        <input
          value={q}
          placeholder="Describe a book in your own words…"
          onChange={(e) => run(e.target.value)}
          aria-label="Semantic search query"
        />
      </div>
      <div className="chips">
        {EXAMPLES.map((ex) => (
          <span key={ex} className="chip" onClick={() => run(ex)}>
            {ex}
          </span>
        ))}
      </div>

      {hits && noTokens && (
        <p style={{ color: "var(--faint)", marginTop: 18 }}>
          No indexed terms in that query — try one of the examples above.
        </p>
      )}

      {hits && !noTokens && (
        <div className="results">
          {hits.map((h) => (
            <div className="card row" key={h.id}>
              <div>
                <div className="t">{h.title}</div>
                <div className="m">
                  {h.creator !== "Unknown" ? h.creator + " · " : ""}
                  {h.subjects.slice(0, 64)}
                </div>
              </div>
              <div className="right">
                <span className="linkish" onClick={() => onSimilar(h)}>
                  similar →
                </span>
                <div className="scorebar">
                  <i style={{ width: `${Math.max(6, Math.min(100, h.score * 100))}%` }} />
                </div>
                <span className="score mono">{h.score.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
