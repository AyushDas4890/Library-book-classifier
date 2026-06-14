"use client";
import { useEffect, useState } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={"hd" + (scrolled ? " scrolled" : "")}>
      <div className="wrap hd-in">
        <div className="brand"><span className="orb" /> Circulation Intelligence</div>
        <nav>
          <a href="#search">Search</a>
          <a href="#explore">Explore</a>
          <a href="#method">Method</a>
          <a className="pill" href="https://github.com/AyushDas4890/Library-book-classifier" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </header>
  );
}
