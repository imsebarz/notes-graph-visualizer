import type { Note, Tag, Notebook } from "./types";

const MCP_URL = process.env.EVERNOTE_MCP_URL || "";
const API_KEY = process.env.EVERNOTE_API_KEY || "";

// ─── HTTP helpers ───────────────────────────────────────────

async function get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  let url = `${MCP_URL}${endpoint}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  }
  const res = await fetch(url, {
    headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ─── Raw Evernote response types ────────────────────────────

interface SemanticHit {
  noteGuid: string;
  score: number;
  chunkContent: string;
}

interface NotesApiResponse {
  // Current deployed format (raw Evernote response)
  hits?: Record<string, number>;
  semanticHits?: SemanticHit[];
  // Future refactored format
  notes?: Array<{ noteId: string; title: string; snippet?: string; notebookId?: string; created?: number; updated?: number }>;
}

// ─── Notes ──────────────────────────────────────────────────

function deriveTitle(content: string): string {
  // Use first line or first ~60 chars as title
  const firstLine = content.split(/[.\n]/)[0].trim();
  if (firstLine.length <= 60) return firstLine;
  return firstLine.slice(0, 57) + "...";
}

export async function fetchNotes(maxResults = 50): Promise<Note[]> {
  const data = await get<NotesApiResponse>("/api/notes", {
    maxResults: String(maxResults),
  });

  // Handle refactored format (array of notes)
  if (data.notes && Array.isArray(data.notes)) {
    return data.notes.map((r) => ({
      id: r.noteId,
      title: r.title,
      snippet: r.snippet,
      notebookId: r.notebookId,
      created: r.created,
      updated: r.updated,
    }));
  }

  // Handle current deployed format (semanticHits)
  if (data.semanticHits && Array.isArray(data.semanticHits)) {
    return data.semanticHits.map((hit) => ({
      id: hit.noteGuid,
      title: deriveTitle(hit.chunkContent),
      snippet: hit.chunkContent,
    }));
  }

  return [];
}

// ─── Notebooks ──────────────────────────────────────────────

export async function fetchNotebooks(): Promise<Notebook[]> {
  try {
    const data = await get<Notebook[] | { notebooks: Notebook[] }>("/api/notebooks");
    if (Array.isArray(data)) return data;
    if ("notebooks" in data) return data.notebooks;
    return [];
  } catch {
    return []; // endpoint not available yet
  }
}

// ─── Tags ───────────────────────────────────────────────────

export async function fetchTags(): Promise<Tag[]> {
  try {
    const data = await get<Tag[] | { tags: Tag[] }>("/api/tags");
    if (Array.isArray(data)) return data;
    if ("tags" in data) return data.tags;
    return [];
  } catch {
    return []; // endpoint not available yet
  }
}

// ─── Search ─────────────────────────────────────────────────

export async function searchNotes(
  query: string,
  maxResults = 20
): Promise<Note[]> {
  try {
    const data = await get<NotesApiResponse>("/api/search", {
      q: query,
      maxResults: String(maxResults),
    });

    if (data.semanticHits) {
      return data.semanticHits.map((hit) => ({
        id: hit.noteGuid,
        title: deriveTitle(hit.chunkContent),
        snippet: hit.chunkContent,
      }));
    }

    return [];
  } catch {
    return [];
  }
}
