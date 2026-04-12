import React, { useState, useRef } from "react";
import SearchInput from "../components/SearchInput";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Upload Panel ──────────────────────────────────────────────────
const UploadPanel = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState({ message: "", processed: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".pdf")) setFile(f);
  };

  const handleClear = async () => {
  await fetch(`${API_BASE}/clear`, { method: "DELETE" });
  reset();
};


  const handleIngest = async () => {
    if (!file) return;
    setStatus("uploading");
    setErrorMsg("");

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/ingest`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).detail || "Upload failed");
      const { job_id } = await res.json();

      setStatus("polling");
      pollRef.current = setInterval(async () => {
        const r = await fetch(`${API_BASE}/ingest/status/${job_id}`);
        const d = await r.json();
        setProgress({ message: d.message, processed: d.processed, total: d.total });
        if (d.status === "done") {
          clearInterval(pollRef.current);
          setStatus("done");
        } else if (d.status === "failed") {
          clearInterval(pollRef.current);
          setStatus("error");
          setErrorMsg(d.error || "Ingestion failed");
        }
      }, 1500);
    } catch (e) {
      setStatus("error");
      setErrorMsg(e.message);
    }
  };

  const reset = () => {
    clearInterval(pollRef.current);
    setFile(null);
    setStatus(null);
    setProgress({ message: "", processed: 0, total: 0 });
    setErrorMsg("");
  };

  const pct = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <p className="font-mono mb-4" style={{ color: "var(--text-muted)", fontSize: "11px", letterSpacing: "0.08em" }}>
        UPLOAD DOCUMENT
      </p>

      {status === "done" ? (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span style={{ color: "var(--green)", fontSize: "18px" }}>✓</span>
      <span style={{ color: "var(--text)", fontSize: "13px", fontWeight: 600 }}>{file.name}</span>
    </div>
    <div className="flex gap-3">                          {/* ← wrap in div */}
      <button onClick={reset} className="font-mono"
        style={{ color: "var(--text-muted)", fontSize: "11px", background: "none", border: "none", cursor: "pointer" }}>
        upload another
      </button>
      <button onClick={handleClear} className="font-mono"    
        style={{ color: "var(--red)", fontSize: "11px", background: "none", border: "none", cursor: "pointer" }}>
        clear index
      </button>
    </div>
  </div>

      ) : status === "uploading" || status === "polling" ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: "var(--text)", fontSize: "13px" }}>{file.name}</span>
            <span className="font-mono" style={{ color: "var(--accent)", fontSize: "12px" }}>{pct}%</span>
          </div>
          <div style={{ height: "3px", background: "var(--border)", borderRadius: "4px", marginBottom: "8px" }}>
            <div style={{ height: "100%", width: `${pct || 5}%`, background: "var(--accent)", borderRadius: "4px", transition: "width 0.4s ease" }} />
          </div>
          <p className="font-mono" style={{ color: "var(--text-muted)", fontSize: "11px" }}>{progress.message || "Starting…"}</p>
        </div>

      ) : status === "error" ? (
        <div>
          <p style={{ color: "var(--red)", fontSize: "13px", marginBottom: "8px" }}>⚠ {errorMsg}</p>
          <button onClick={reset} style={{ color: "var(--accent)", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>
            Try again
          </button>
        </div>

      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl cursor-pointer"
          style={{ border: `1.5px dashed ${file ? "var(--accent)" : "var(--border)"}`, padding: "24px 16px", textAlign: "center" }}
        >
          <input ref={inputRef} type="file" accept=".pdf" className="hidden"
            onChange={(e) => setFile(e.target.files[0])} />
          {file ? (
            <div>
              <p style={{ color: "var(--text)", fontWeight: 600, fontSize: "14px" }}>📄 {file.name}</p>
              <p className="font-mono mt-1" style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Drop PDF here or click to browse</p>
          )}
        </div>
      )}

      {file && !status && (
        <button onClick={handleIngest} className="w-full mt-3 rounded-xl"
          style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "10px",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
          Index Document →
        </button>
      )}
    </div>
  );
};

// ── Chunk Card ────────────────────────────────────────────────────
const ChunkCard = ({ chunk, index, expanded, onToggle }) => {
  const score = chunk.score;
  const scoreClr = score >= 0.8 ? "var(--green)" : score >= 0.6 ? "var(--yellow)" : "var(--text-muted)";

  return (
    <div onClick={onToggle} className="rounded-xl cursor-pointer transition-all duration-200"
      style={{ background: "var(--surface)", border: `1px solid ${expanded ? "var(--border-hover)" : "var(--border)"}`, padding: "14px 16px" }}>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono flex-shrink-0"
            style={{ background: "var(--surface2)", color: "var(--accent)", fontSize: "10px", padding: "2px 7px", borderRadius: "4px" }}>
            #{index + 1}
          </span>
          <span style={{ color: "var(--text)", fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {chunk.source || "Unknown source"}
          </span>
          {chunk.page !== "" && chunk.page !== undefined && (
            <span className="font-mono flex-shrink-0" style={{ color: "var(--text-muted)", fontSize: "11px" }}>
              p.{chunk.page}
            </span>
          )}
        </div>
        <span className="font-mono flex-shrink-0" style={{ color: scoreClr, fontSize: "12px", fontWeight: 700 }}>
          {(score * 100).toFixed(1)}%
        </span>
      </div>

      {chunk.section && (
        <p className="mt-1 font-mono" style={{ color: "var(--text-muted)", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {chunk.section}
        </p>
      )}

      <p style={{
        color: "var(--text-muted)", fontSize: "12px", lineHeight: "1.65", marginTop: "10px",
        fontFamily: "'DM Mono', monospace",
        display: "-webkit-box", WebkitLineClamp: expanded ? "unset" : 3,
        WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {chunk.text}
      </p>

      <p style={{ color: "var(--accent)", fontSize: "11px", marginTop: "6px" }}>
        {expanded ? "▲ collapse" : "▼ expand"}
      </p>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────
const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedChunk, setExpandedChunk] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedChunk(null);

    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), top_k: 5 }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Server error");
      setResult(await res.json());
    } catch (e) {
      setError(e.message || "Failed to reach server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <div className="bg-orb" style={{ top: "-100px", left: "50%", transform: "translateX(-50%)" }} />

      <div className="mx-auto px-4 py-16 relative z-10" style={{ maxWidth: "860px" }}>

        {/* Hero */}
        <div className="text-center mb-12 fade-up fade-up-1">
          <h1 className="logo mb-3" style={{ fontSize: "clamp(40px, 6vw, 64px)", color: "var(--text)", lineHeight: 1.1 }}>
            Seekie
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
            Ask questions across any documents.<br />
            Get precise answers with full source attribution.
          </p>
        </div>

        {/* Search */}
        <div className="flex justify-center mb-10 fade-up fade-up-2">
          <SearchInput query={query} setQuery={setQuery} onSearch={handleSearch} loading={loading} />
        </div>

        {/* Two-column */}
        <div className="grid gap-6 fade-up fade-up-3" style={{ gridTemplateColumns: "280px 1fr" }}>

          {/* Left: Upload + Tips */}
          <div>
            <UploadPanel />
            <div className="mt-4 rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="font-mono mb-3" style={{ color: "var(--text-muted)", fontSize: "11px", letterSpacing: "0.08em" }}>TIPS</p>
              {[
                "Upload one or more PDFs",
                "Ask specific questions",
                "Check source pages for context",
                "Higher % = better match",
              ].map((tip, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <span style={{ color: "var(--accent)", fontSize: "12px" }}>›</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Results */}
          <div>
            {error && (
              <div className="rounded-2xl p-5 mb-4"
                style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.25)" }}>
                <p style={{ color: "var(--red)", fontSize: "13px" }}>⚠ {error}</p>
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="skeleton mb-3" style={{ height: "10px", width: "60px" }} />
                  <div className="skeleton mb-2" style={{ height: "13px", width: "100%" }} />
                  <div className="skeleton mb-2" style={{ height: "13px", width: "85%" }} />
                  <div className="skeleton" style={{ height: "13px", width: "70%" }} />
                </div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton rounded-xl" style={{ height: "80px" }} />
                ))}
              </div>
            )}

            {result && !loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="rounded-2xl p-5 fade-up"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="font-mono" style={{ color: "var(--accent)", fontSize: "11px", letterSpacing: "0.1em" }}>ANSWER</span>
                    <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  </div>
                  <p style={{ color: "var(--text)", fontSize: "14px", lineHeight: "1.8", whiteSpace: "pre-wrap", fontWeight: 400 }}>
                    {result.answer}
                  </p>
                </div>

                {result.chunks?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono" style={{ color: "var(--text-muted)", fontSize: "11px", letterSpacing: "0.08em" }}>
                        SOURCES ({result.chunks.length})
                      </span>
                      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {result.chunks.map((chunk, i) => (
                        <ChunkCard key={i} chunk={chunk} index={i}
                          expanded={expandedChunk === i}
                          onToggle={() => setExpandedChunk(expandedChunk === i ? null : i)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!result && !loading && !error && (
              <div className="rounded-2xl flex flex-col items-center justify-center text-center"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "60px 32px", minHeight: "300px" }}>
                <div style={{ fontSize: "36px", marginBottom: "16px", opacity: 0.4 }}>⌕</div>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.7 }}>
                  Upload a document and ask<br />your first question to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;