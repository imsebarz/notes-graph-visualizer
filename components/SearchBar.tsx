"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { GraphNode } from "@/lib/types";
import { themes } from "@/lib/theme";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onNodeSelect?: (node: GraphNode) => void;
  nodes: GraphNode[];
  noteCount: number;
  tagCount: number;
  linkCount: number;
  isMock: boolean;
  theme?: "dark" | "light";
}

export default function SearchBar({
  onSearch,
  onNodeSelect,
  nodes,
  noteCount,
  tagCount,
  linkCount,
  isMock,
  theme = "dark",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = themes[theme];
  const isDark = theme === "dark";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !isFocused && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && isFocused) {
        inputRef.current?.blur();
        if (query) {
          setQuery("");
          onSearch("");
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFocused, query, onSearch]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      onSearch(value);
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch("");
    inputRef.current?.focus();
  }, [onSearch]);

  const results =
    query.length >= 2
      ? nodes
          .filter((n) => {
            const q = query.toLowerCase();
            return (
              n.label.toLowerCase().includes(q) ||
              n.notebookName?.toLowerCase().includes(q) ||
              n.tagNames?.some((tn) => tn.toLowerCase().includes(q))
            );
          })
          .slice(0, 8)
      : [];

  const showDropdown = isFocused && results.length > 0;
  const accentBorder = isDark ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.35)";
  const accentRing = isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.12)";

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 w-full max-w-md px-4">
      <div
        className="relative flex items-center gap-2.5 w-full backdrop-blur-xl rounded-2xl px-4 py-3 transition-all duration-200"
        style={{
          background: t.searchBg,
          border: `1px solid ${isFocused ? accentBorder : t.border}`,
          boxShadow: isFocused
            ? `0 0 0 3px ${accentRing}, 0 20px 40px ${isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.1)"}`
            : `0 20px 40px ${isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.06)"}`,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 transition-colors"
          style={{ color: isFocused ? (isDark ? "#818cf8" : "#6366f1") : t.textTertiary }}
        >
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Search notes and tags..."
          className="bg-transparent text-sm outline-none flex-1 min-w-0"
          style={{ color: t.text }}
        />

        {query ? (
          <button onClick={handleClear} className="shrink-0 transition-colors" style={{ color: t.textTertiary }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        ) : !isFocused ? (
          <kbd
            className="text-[10px] rounded px-1.5 py-0.5 font-mono shrink-0"
            style={{
              color: t.textMuted,
              background: t.hoverBg,
              border: `1px solid ${t.border}`,
            }}
          >
            /
          </kbd>
        ) : null}

        {showDropdown && (
          <div
            className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl rounded-xl overflow-hidden"
            style={{
              background: t.dropdownBg,
              border: `1px solid ${t.border}`,
              boxShadow: `0 20px 50px ${isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.12)"}`,
            }}
          >
            {results.map((node) => (
              <button
                key={node.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onNodeSelect?.(node);
                  setQuery("");
                  onSearch("");
                  inputRef.current?.blur();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left group"
                onMouseEnter={(e) => { e.currentTarget.style.background = t.hoverBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: node.color,
                    boxShadow: `0 0 6px ${node.color}60`,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate" style={{ color: t.textSecondary }}>
                    {node.label}
                  </p>
                  {node.notebookName && (
                    <p className="text-[11px] truncate" style={{ color: t.textTertiary }}>
                      {node.notebookName}
                    </p>
                  )}
                </div>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: `${node.color}15`,
                    color: node.color,
                    border: `1px solid ${node.color}25`,
                  }}
                >
                  {node.type}
                </span>
              </button>
            ))}
            <div
              className="px-4 py-2 text-[11px]"
              style={{ borderTop: `1px solid ${t.divider}`, color: t.textMuted }}
            >
              {results.length} result{results.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px]" style={{ color: t.textMuted }}>
        <span>{noteCount} notes</span>
        <Dot color={t.textMuted} />
        <span>{tagCount} tags</span>
        <Dot color={t.textMuted} />
        <span>{linkCount} connections</span>
        {isMock && (
          <>
            <Dot color={t.textMuted} />
            <span style={{ color: isDark ? "rgba(245,158,11,0.5)" : "rgba(180,120,0,0.6)" }}>demo</span>
          </>
        )}
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="w-0.5 h-0.5 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}
