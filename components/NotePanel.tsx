"use client";

import type { GraphNode, GraphData } from "@/lib/types";
import { useMemo } from "react";
import { themes } from "@/lib/theme";

interface NotePanelProps {
  node: GraphNode | null;
  graphData: GraphData;
  onClose: () => void;
  onNodeSelect?: (node: GraphNode) => void;
  theme?: "dark" | "light";
}

export default function NotePanel({
  node,
  graphData,
  onClose,
  onNodeSelect,
  theme = "dark",
}: NotePanelProps) {
  if (!node) return null;

  return (
    <PanelContent
      node={node}
      graphData={graphData}
      onClose={onClose}
      onNodeSelect={onNodeSelect}
      theme={theme}
    />
  );
}

function PanelContent({
  node,
  graphData,
  onClose,
  onNodeSelect,
  theme,
}: {
  node: GraphNode;
  graphData: GraphData;
  onClose: () => void;
  onNodeSelect?: (node: GraphNode) => void;
  theme: "dark" | "light";
}) {
  const t = themes[theme];
  const isDark = theme === "dark";
  const isTag = node.type === "tag";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connectedNodes = useMemo(() => {
    const ids = new Set<string>();
    graphData.links.forEach((link: any) => {
      const src = typeof link.source === "object" ? link.source.id : link.source;
      const tgt = typeof link.target === "object" ? link.target.id : link.target;
      if (src === node.id) ids.add(tgt);
      if (tgt === node.id) ids.add(src);
    });
    return graphData.nodes.filter((n) => ids.has(n.id));
  }, [node.id, graphData]);

  const connectedNotes = connectedNodes.filter((n) => n.type === "note");
  const connectedTags = connectedNodes.filter((n) => n.type === "tag");

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  return (
    <div
      className="fixed right-0 top-0 h-full w-[420px] backdrop-blur-2xl z-50 flex flex-col animate-slide-in"
      style={{
        background: t.panelBg,
        borderLeft: `1px solid ${t.border}`,
      }}
    >
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className="w-4 h-4 rounded-full shrink-0 mt-1"
              style={{
                backgroundColor: node.color,
                boxShadow: `0 0 14px ${node.color}${isDark ? "80" : "50"}`,
              }}
            />
            <div className="min-w-0 flex-1">
              <h2
                className="font-semibold text-[18px] leading-snug pr-4"
                style={{ color: t.text }}
              >
                {node.label}
              </h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                  style={{
                    backgroundColor: `${node.color}${isDark ? "18" : "15"}`,
                    color: node.color,
                    border: `1px solid ${node.color}${isDark ? "30" : "25"}`,
                  }}
                >
                  {isTag ? "Tag" : "Note"}
                </span>
                {node.notebookName && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: t.hoverBg,
                      color: t.textTertiary,
                      border: `1px solid ${t.border}`,
                    }}
                  >
                    {node.notebookName}
                  </span>
                )}
                {node.updated && (
                  <span className="text-[10px]" style={{ color: t.textMuted }}>
                    {timeAgo(node.updated)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors -mt-0.5 -mr-1"
            style={{ color: t.textTertiary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = t.hoverBg;
              e.currentTarget.style.color = t.textSecondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = t.textTertiary;
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${t.divider}, transparent)` }} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Snippet */}
        {node.snippet && (
          <div className="px-5 py-5">
            <p
              className="text-[13.5px] leading-[1.7]"
              style={{ color: t.textSecondary }}
            >
              {node.snippet}
            </p>
          </div>
        )}

        {node.snippet && (
          <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${t.divider}, transparent)` }} />
        )}

        {/* Tags */}
        {node.tagNames && node.tagNames.length > 0 && (
          <div className="px-5 py-4">
            <SectionTitle color={t.textMuted}>Tags</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {node.tagNames.map((name) => (
                <span
                  key={name}
                  className="text-[11px] px-2.5 py-1 rounded-lg transition-colors cursor-default"
                  style={{
                    background: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.1)",
                    color: isDark ? "rgba(251,191,36,0.8)" : "rgba(180,120,0,0.9)",
                    border: `1px solid ${isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.2)"}`,
                  }}
                >
                  #{name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Connected Notes */}
        {connectedNotes.length > 0 && (
          <div className="px-5 py-4">
            <SectionTitle color={t.textMuted}>
              Connected Notes
              <span className="ml-1.5 opacity-50">{connectedNotes.length}</span>
            </SectionTitle>
            <div className="space-y-0.5">
              {connectedNotes.map((cn) => (
                <button
                  key={cn.id}
                  onClick={() => onNodeSelect?.(cn)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 -mx-1 rounded-xl transition-all text-left group"
                  style={{ color: t.textTertiary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = t.hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
                    style={{
                      backgroundColor: cn.color,
                      boxShadow: `0 0 6px ${cn.color}40`,
                    }}
                  />
                  <span
                    className="text-[13px] truncate transition-colors"
                    style={{ color: t.textTertiary }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = t.text; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = t.textTertiary; }}
                  >
                    {cn.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Connected Tags (for tag nodes) */}
        {connectedTags.length > 0 && isTag && (
          <div className="px-5 py-4">
            <SectionTitle color={t.textMuted}>
              Related Tags
              <span className="ml-1.5 opacity-50">{connectedTags.length}</span>
            </SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {connectedTags.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => onNodeSelect?.(ct)}
                  className="text-[11px] px-2.5 py-1 rounded-lg transition-colors"
                  style={{
                    background: isDark ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.08)",
                    color: isDark ? "rgba(251,191,36,0.6)" : "rgba(180,120,0,0.7)",
                    border: `1px solid ${isDark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.15)"}`,
                  }}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {(node.created || node.updated) && (
          <>
            <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${t.divider}, transparent)` }} />
            <div className="px-5 py-4">
              <SectionTitle color={t.textMuted}>Timeline</SectionTitle>
              <div className="space-y-2.5">
                {node.created && (
                  <TimelineRow
                    label="Created"
                    date={node.created}
                    labelColor={t.textTertiary}
                    valueColor={t.textSecondary}
                  />
                )}
                {node.updated && (
                  <TimelineRow
                    label="Updated"
                    date={node.updated}
                    labelColor={t.textTertiary}
                    valueColor={t.textSecondary}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${t.divider}, transparent)` }} />
      <div className="px-5 py-3 flex items-center justify-between">
        <span className="text-[10px]" style={{ color: t.textMuted }}>
          {connectedNodes.length} connection{connectedNodes.length !== 1 ? "s" : ""}
        </span>
        <span className="text-[10px]" style={{ color: t.textMuted }}>
          esc to close
        </span>
      </div>
    </div>
  );
}

function SectionTitle({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h3
      className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3"
      style={{ color }}
    >
      {children}
    </h3>
  );
}

function TimelineRow({
  label,
  date,
  labelColor,
  valueColor,
}: {
  label: string;
  date: number;
  labelColor: string;
  valueColor: string;
}) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span style={{ color: labelColor }}>{label}</span>
      <span className="font-mono text-[11px]" style={{ color: valueColor }}>
        {new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
    </div>
  );
}
