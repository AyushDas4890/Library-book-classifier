"use client";
import type { Book } from "@/lib/types";

export default function Marquee({ catalog }: { catalog: Book[] }) {
  if (!catalog.length) return null;
  const top = [...catalog].sort((a, b) => b.checkouts - a.checkouts).slice(0, 26);
  const items = [...top, ...top];
  return (
    <div className="marquee" aria-hidden>
      <div className="marquee-track">
        {items.map((b, i) => (
          <span className="tag" key={i}>
            <b>{b.title.length > 42 ? b.title.slice(0, 42) + "…" : b.title}</b> · {b.checkouts.toLocaleString()} checkouts
          </span>
        ))}
      </div>
    </div>
  );
}
