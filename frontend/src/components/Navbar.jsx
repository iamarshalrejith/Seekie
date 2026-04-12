import React from "react";

const Navbar = () => {
  return (
    <nav style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      className="w-full sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <span className="logo text-xl" style={{ color: "var(--text)" }}>
          Seekie
        </span>
        <span className="font-mono text-xs px-3 py-1 rounded-full"
          style={{ background: "var(--surface2)", color: "var(--accent)", border: "1px solid var(--border)" }}>
          RAG 
        </span>
      </div>
    </nav>
  );
};

export default Navbar;