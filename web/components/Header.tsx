"use client";

export default function Header() {
  return (
    <header className="hd">
      <div className="wrap hd-in">
        <div className="brand"><span className="dot" /> Circulation Intelligence</div>
        <nav>
          <a href="#search">Search</a>
          <a href="#explore">Explore</a>
          <a href="#method">Method</a>
          <a className="gh btn ghost" href="https://github.com/AyushDas4890/Library-book-classifier" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </header>
  );
}
