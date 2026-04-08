"use client";

import {
  useRef,
  useCallback,
  useEffect,
  useState,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import type { GraphNode, GraphData } from "@/lib/types";
import { themes } from "@/lib/theme";

import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
  ssr: false,
});

export interface Graph3DHandle {
  centerView: () => void;
  zoomToNode: (node: GraphNode) => void;
}

interface Graph3DProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  searchQuery?: string;
  selectedNodeId?: string | null;
  theme?: "dark" | "light";
}

const Graph3D = forwardRef<Graph3DHandle, Graph3DProps>(function Graph3D(
  { data, onNodeClick, onNodeHover, searchQuery, selectedNodeId, theme = "dark" },
  ref
) {
  const graphRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const bloomAdded = useRef(false);
  const t = themes[theme];
  const isDark = theme === "dark";

  useImperativeHandle(ref, () => ({
    centerView() {
      if (!graphRef.current) return;
      graphRef.current.zoomToFit(800, 60);
    },
    zoomToNode(node: GraphNode) {
      if (!graphRef.current) return;
      const distance = 120;
      const distRatio =
        1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);
      graphRef.current.cameraPosition(
        {
          x: (node.x || 0) * distRatio,
          y: (node.y || 0) * distRatio,
          z: (node.z || 0) * distRatio,
        },
        { x: node.x, y: node.y, z: node.z },
        1500
      );
    },
  }));

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Bloom only in dark mode
  useEffect(() => {
    if (!graphRef.current || bloomAdded.current || !isDark) return;

    const timer = setTimeout(() => {
      const renderer = graphRef.current?.renderer?.();
      if (!renderer) return;

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.4,
        0.5,
        0.25
      );

      const composer = graphRef.current.postProcessingComposer?.();
      if (composer) {
        composer.addPass(bloomPass);
        bloomAdded.current = true;
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [dimensions, isDark]);

  const matchingIds = useMemo(() => {
    if (!searchQuery) return null;
    const q = searchQuery.toLowerCase();
    return new Set(
      data.nodes
        .filter(
          (n) =>
            n.label.toLowerCase().includes(q) ||
            n.notebookName?.toLowerCase().includes(q) ||
            n.tagNames?.some((tn) => tn.toLowerCase().includes(q))
        )
        .map((n) => n.id)
    );
  }, [searchQuery, data.nodes]);

  const getConnectedIds = useCallback(
    (nodeId: string) => {
      const connected = new Set<string>();
      connected.add(nodeId);
      data.links.forEach((link: any) => {
        const src = typeof link.source === "object" ? link.source.id : link.source;
        const tgt = typeof link.target === "object" ? link.target.id : link.target;
        if (src === nodeId) connected.add(tgt);
        if (tgt === nodeId) connected.add(src);
      });
      return connected;
    },
    [data.links]
  );

  const activeNodeId = hoveredNode || selectedNodeId;
  const connectedIds = useMemo(
    () => (activeNodeId ? getConnectedIds(activeNodeId) : null),
    [activeNodeId, getConnectedIds]
  );

  const nodeThreeObject = useCallback(
    (node: any) => {
      const gn = node as GraphNode;
      const isActive = activeNodeId === gn.id;
      const isConnected = connectedIds?.has(gn.id);
      const isFiltered = matchingIds && !matchingIds.has(gn.id);
      const dimmed = (connectedIds && !isConnected) || isFiltered;

      const baseSize = gn.size || 4;
      const size = isActive ? baseSize * 1.4 : baseSize;
      const group = new THREE.Group();

      const geometry = new THREE.SphereGeometry(size * 0.5, 24, 24);
      const color = new THREE.Color(gn.color);
      const material = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: dimmed ? 0.1 : isActive ? (isDark ? 1.2 : 0.6) : (isDark ? 0.7 : 0.3),
        transparent: true,
        opacity: dimmed ? 0.12 : 1,
        shininess: 120,
      });
      group.add(new THREE.Mesh(geometry, material));

      if (!dimmed) {
        const glowSize = size * (isActive ? 1.8 : 1.2);
        const glowGeometry = new THREE.SphereGeometry(glowSize * 0.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: isActive ? 0.3 : 0.12,
          side: THREE.BackSide,
        });
        group.add(new THREE.Mesh(glowGeometry, glowMaterial));
      }

      const showLabel = isActive || isConnected || gn.type === "tag" || !connectedIds;
      if (showLabel) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const fontSize = isActive ? 48 : 32;

        ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
        const textWidth = ctx.measureText(gn.label).width;
        canvas.width = textWidth + 30;
        canvas.height = fontSize + 20;

        if (isActive) {
          ctx.fillStyle = isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.85)";
          ctx.beginPath();
          ctx.roundRect(0, 0, canvas.width, canvas.height, 10);
          ctx.fill();
        }

        ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = dimmed
          ? t.labelDimmed
          : isActive
            ? t.labelColor
            : t.labelNormal;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(gn.label, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
        );
        const scale = isActive ? 1.2 : 0.7;
        sprite.scale.set((canvas.width / canvas.height) * size * scale, size * scale, 1);
        sprite.position.set(0, size * 0.9, 0);
        group.add(sprite);
      }

      return group;
    },
    [activeNodeId, connectedIds, matchingIds, isDark, t]
  );

  const handleNodeClick = useCallback(
    (node: any) => {
      const gn = node as GraphNode;
      onNodeClick?.(gn);
      if (graphRef.current) {
        const distance = 120;
        const distRatio = 1 + distance / Math.hypot(gn.x || 0, gn.y || 0, gn.z || 0);
        graphRef.current.cameraPosition(
          { x: (gn.x || 0) * distRatio, y: (gn.y || 0) * distRatio, z: (gn.z || 0) * distRatio },
          { x: gn.x, y: gn.y, z: gn.z },
          1500
        );
      }
    },
    [onNodeClick]
  );

  const handleNodeHover = useCallback(
    (node: any) => {
      const gn = node ? (node as GraphNode) : null;
      setHoveredNode(gn?.id || null);
      onNodeHover?.(gn);
      document.body.style.cursor = gn ? "pointer" : "default";
    },
    [onNodeHover]
  );

  if (dimensions.width === 0) return null;

  const linkHighlightColor = isDark ? "#ffffff" : "#1a1a2e";
  const linkBaseRef = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)";
  const linkBaseTag = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const linkDimmed = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";

  return (
    <ForceGraph3D
      ref={graphRef}
      width={dimensions.width}
      height={dimensions.height}
      graphData={data as any}
      backgroundColor={t.bg}
      nodeThreeObject={nodeThreeObject}
      nodeThreeObjectExtend={false}
      onNodeClick={handleNodeClick}
      onNodeHover={handleNodeHover}
      linkColor={(link: any) => {
        const src = typeof link.source === "object" ? link.source.id : link.source;
        const tgt = typeof link.target === "object" ? link.target.id : link.target;
        if (connectedIds && connectedIds.has(src) && connectedIds.has(tgt)) {
          return link.type === "note-note" ? linkHighlightColor : (isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)");
        }
        if (connectedIds) return linkDimmed;
        if (matchingIds) {
          if (matchingIds.has(src) && matchingIds.has(tgt)) return isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)";
          return linkDimmed;
        }
        return link.type === "note-note" ? linkBaseRef : linkBaseTag;
      }}
      linkWidth={(link: any) => (link.type === "note-note" ? 1.5 : 0.5)}
      linkOpacity={1}
      linkDirectionalParticles={(link: any) => {
        if (connectedIds) {
          const src = typeof link.source === "object" ? link.source.id : link.source;
          const tgt = typeof link.target === "object" ? link.target.id : link.target;
          if (connectedIds.has(src) && connectedIds.has(tgt)) return 4;
        }
        return link.type === "note-note" ? 2 : 0;
      }}
      linkDirectionalParticleWidth={1.5}
      linkDirectionalParticleSpeed={0.005}
      linkDirectionalParticleColor={() => linkHighlightColor}
      d3AlphaDecay={0.015}
      d3VelocityDecay={0.4}
      d3AlphaMin={0.001}
      warmupTicks={150}
      cooldownTicks={300}
      enableNavigationControls={true}
      showNavInfo={false}
      controlType="orbit"
    />
  );
});

export default Graph3D;
