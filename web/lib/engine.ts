import type { Book, Hit, Metrics } from "./types";

interface EncoderFile { scale: number; dim: number; tokens: string[]; data: number[][] }

export class RetrievalEngine {
  catalog: Book[] = [];
  metrics!: Metrics;
  private vecs: Float32Array[] = [];
  private tokVecs: Float32Array[] = [];
  private tokIndex: Map<string, number> = new Map();
  private dim = 0;
  ready = false;

  async load(base = "/data") {
    const [cat, vecRes, encRes, met] = await Promise.all([
      fetch(`${base}/catalog.json`).then((r) => r.json()),
      fetch(`${base}/vectors.json`).then((r) => r.json()),
      fetch(`${base}/encoder.json`).then((r) => r.json()),
      fetch(`${base}/metrics.json`).then((r) => r.json()),
    ]);
    this.catalog = cat as Book[];
    this.metrics = met as Metrics;
    const v = vecRes as { scale: number; dim: number; data: number[][] };
    this.dim = v.dim;
    this.vecs = v.data.map((row) => dequant(row, v.scale));
    const e = encRes as EncoderFile;
    this.tokVecs = e.data.map((row) => dequant(row, e.scale));
    e.tokens.forEach((t, i) => this.tokIndex.set(t, i));
    this.ready = true;
  }

  private encodeQuery(q: string): Float32Array | null {
    const toks = q.toLowerCase().match(/[a-z0-9]+/g) || [];
    const acc = new Float32Array(this.dim);
    let used = 0;
    for (const t of toks) {
      const idx = this.tokIndex.get(t);
      if (idx === undefined) continue;
      const tv = this.tokVecs[idx];
      for (let d = 0; d < this.dim; d++) acc[d] += tv[d];
      used++;
    }
    if (used === 0) return null;
    return l2norm(acc);
  }

  search(query: string, k = 12): Hit[] {
    const qv = this.encodeQuery(query);
    if (!qv) return [];
    return this.topK(qv, k, -1);
  }

  similar(bookId: number, k = 8): Hit[] {
    if (bookId < 0 || bookId >= this.vecs.length) return [];
    return this.topK(this.vecs[bookId], k, bookId);
  }

  private topK(qv: Float32Array, k: number, skip: number): Hit[] {
    const scored: { i: number; s: number }[] = [];
    for (let i = 0; i < this.vecs.length; i++) {
      if (i === skip) continue;
      scored.push({ i, s: dot(qv, this.vecs[i]) });
    }
    scored.sort((a, b) => b.s - a.s);
    return scored.slice(0, k).map(({ i, s }) => ({ ...this.catalog[i], score: Math.round(s * 1000) / 1000 }));
  }
}

function dequant(row: number[], scale: number): Float32Array {
  const out = new Float32Array(row.length);
  for (let i = 0; i < row.length; i++) out[i] = row[i] / scale;
  return out;
}
function dot(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
function l2norm(v: Float32Array): Float32Array {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= n;
  return v;
}
