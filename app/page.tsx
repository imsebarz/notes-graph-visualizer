"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Graph3D from "@/components/Graph3D";
import type { Graph3DHandle } from "@/components/Graph3D";
import NotePanel from "@/components/NotePanel";
import SearchBar from "@/components/SearchBar";
import LoadingScreen from "@/components/LoadingScreen";
import { ThemeProvider, useTheme, themes } from "@/lib/theme";
import type { GraphNode, GraphData } from "@/lib/types";

interface GraphResponse extends GraphData {
  meta: {
    noteCount: number;
    tagCount: number;
    notebookCount: number;
    mock: boolean;
    error?: string;
  };
}

function GraphApp() {
  const { theme, toggle } = useTheme();
  const t = themes[theme];
  const isDark = theme === "dark";

  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const graphRef = useRef<Graph3DHandle>(null);

  useEffect(() => {
    fetch("/api/graph")
      .then((res) => res.json())
      .then((data: GraphResponse) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load graph:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedNode) setSelectedNode(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedNode]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  }, []);

  const handleNodeSelect = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    graphRef.current?.zoomToNode(node);
  }, []);

  const handleClosePanel = useCallback(() => setSelectedNode(null), []);
  const handleSearch = useCallback((query: string) => setSearchQuery(query), []);
  const handleCenterView = useCallback(() => {
    setSelectedNode(null);
    graphRef.current?.centerView();
  }, []);

  if (loading) return <LoadingScreen />;
  if (!graphData) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: t.bg }}>
        <p style={{ color: t.textTertiary }}>Failed to load graph data</p>
      </div>
    );
  }

  return (
    <main
      className="relative w-screen h-screen overflow-hidden transition-colors duration-500"
      style={{ background: t.bg }}
    >
      <Graph3D
        ref={graphRef}
        data={{ nodes: graphData.nodes, links: graphData.links }}
        onNodeClick={handleNodeClick}
        searchQuery={searchQuery}
        selectedNodeId={selectedNode?.id}
        theme={theme}
      />

      <SearchBar
        onSearch={handleSearch}
        onNodeSelect={handleNodeSelect}
        nodes={graphData.nodes}
        noteCount={graphData.meta.noteCount}
        tagCount={graphData.meta.tagCount}
        linkCount={graphData.links.length}
        isMock={graphData.meta.mock}
        theme={theme}
      />

      <NotePanel
        node={selectedNode}
        graphData={{ nodes: graphData.nodes, links: graphData.links }}
        onClose={handleClosePanel}
        onNodeSelect={handleNodeSelect}
        theme={theme}
      />

      {/* Bottom-left toolbar */}
      <div className="fixed bottom-5 left-5 z-40 flex flex-col gap-3">
        {/* Buttons row */}
        <div className="flex items-center gap-2">
          {/* Center view */}
          <ToolbarButton
            onClick={handleCenterView}
            title="Center view"
            theme={theme}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 2v2M8 12v2M2 8h2M12 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </ToolbarButton>

          {/* Theme toggle */}
          <ToolbarButton
            onClick={toggle}
            title={isDark ? "Light mode" : "Dark mode"}
            theme={theme}
          >
            {isDark ? (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 9.5a5.5 5.5 0 01-7-7 5.5 5.5 0 107 7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            )}
          </ToolbarButton>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 text-[10px] pl-1" style={{ color: t.textMuted }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Notes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Tags</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-3 h-[1px]" style={{ background: t.textTertiary }} />
            <span>Reference</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-[1px]" style={{ background: t.textMuted }} />
            <span>Shared tag</span>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="fixed bottom-5 right-5 z-40">
        <span className="text-[10px] font-medium tracking-[0.2em] uppercase" style={{ color: t.textMuted }}>
          Notes Graph
        </span>
      </div>
    </main>
  );
}

function ToolbarButton({
  onClick,
  title,
  theme,
  children,
}: {
  onClick: () => void;
  title: string;
  theme: "dark" | "light";
  children: React.ReactNode;
}) {
  const t = themes[theme];
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center w-9 h-9 rounded-xl backdrop-blur-sm transition-all duration-200"
      style={{
        background: t.hoverBg,
        border: `1px solid ${t.border}`,
        color: t.textTertiary,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = t.borderHover;
        e.currentTarget.style.color = t.textSecondary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = t.border;
        e.currentTarget.style.color = t.textTertiary;
      }}
    >
      {children}
    </button>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <GraphApp />
    </ThemeProvider>
  );
}
