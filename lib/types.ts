// --- Evernote Data Types ---

export interface Note {
  id: string;
  title: string;
  content?: string;
  snippet?: string;
  created?: number;
  updated?: number;
  notebookId?: string;
  tagIds?: string[];
}

export interface Notebook {
  id: string;
  name: string;
  stack?: string;
}

export interface Tag {
  id: string;
  name: string;
  parentId?: string;
}

// --- Graph Types ---

export type NodeType = "note" | "tag";

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  color: string;
  size: number;
  notebookId?: string;
  notebookName?: string;
  tagIds?: string[];
  tagNames?: string[];
  snippet?: string;
  created?: number;
  updated?: number;
  // Force-graph adds these at runtime
  x?: number;
  y?: number;
  z?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: "note-tag" | "note-note";
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
