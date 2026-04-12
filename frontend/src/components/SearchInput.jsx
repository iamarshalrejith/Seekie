import React, { useRef } from "react";

const SearchInput = ({ query, setQuery, onSearch, loading }) => {
  const ref = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) onSearch();
  };

  return (
    <div className="w-full" style={{ maxWidth: "720px" }}>
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-200"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>

        <input
          ref={ref}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your documents..."
          disabled={loading}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text)",
            fontFamily: "'Syne', sans-serif",
            fontSize: "15px",
            fontWeight: 500,
          }}
        />

        <button
          onClick={onSearch}
          disabled={loading || !query.trim()}
          style={{
            background: query.trim() && !loading ? "var(--accent)" : "var(--surface2)",
            color: query.trim() && !loading ? "#fff" : "var(--text-muted)",
            border: "none",
            borderRadius: "10px",
            padding: "8px 18px",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            cursor: query.trim() && !loading ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? (
            <>
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12"/>
              </svg>
              Thinking…
            </>
          ) : "Ask →"}
        </button>
      </div>

      <p className="font-mono text-center mt-3" style={{ color: "var(--text-dim)", fontSize: "11px" }}>
        Upload your PDFs → Ask questions → Get answers with sources
      </p>
    </div>
  );
};

export default SearchInput;