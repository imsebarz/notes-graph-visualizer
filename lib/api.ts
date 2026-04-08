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

async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${MCP_URL}${endpoint}`, {
    method: "POST",
    headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function put<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${MCP_URL}${endpoint}`, {
    method: "PUT",
    headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function del(endpoint: string): Promise<void> {
  const res = await fetch(`${MCP_URL}${endpoint}`, {
    method: "DELETE",
    headers: { "X-API-Key": API_KEY },
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
}

// ─── Search result → Note mapping ──────────────────────────

interface SearchResult {
  noteId: string;
  title: string;
  snippet?: string;
  score?: number;
  notebookId?: string;
  created?: number;
  updated?: number;
}

function searchResultToNote(r: SearchResult): Note {
  return {
    id: r.noteId,
    title: r.title,
    snippet: r.snippet,
    notebookId: r.notebookId,
    created: r.created,
    updated: r.updated,
  };
}

// ─── Notes ──────────────────────────────────────────────────

export async function fetchNotes(maxResults = 50): Promise<Note[]> {
  const data = await get<SearchResult[]>("/api/notes", {
    maxResults: String(maxResults),
  });
  return (Array.isArray(data) ? data : []).map(searchResultToNote);
}

export async function fetchNote(noteId: string): Promise<Note> {
  return get<Note>(`/api/notes/${encodeURIComponent(noteId)}`);
}

export async function createNote(params: {
  title: string;
  content: string;
  format?: string;
  notebookId?: string;
  tagIds?: string[];
}): Promise<Note> {
  return post<Note>("/api/notes", params);
}

export async function updateNote(
  noteId: string,
  params: { title?: string; content?: string; format?: string; tagIds?: string[] }
): Promise<Note> {
  return put<Note>(`/api/notes/${encodeURIComponent(noteId)}`, params);
}

export async function deleteNote(noteId: string): Promise<void> {
  return del(`/api/notes/${encodeURIComponent(noteId)}`);
}

// ─── Notebooks ──────────────────────────────────────────────

export async function fetchNotebooks(): Promise<Notebook[]> {
  const data = await get<Notebook[]>("/api/notebooks");
  return Array.isArray(data) ? data : [];
}

export async function fetchNotebook(notebookId: string): Promise<Notebook> {
  return get<Notebook>(`/api/notebooks/${encodeURIComponent(notebookId)}`);
}

// ─── Tags ───────────────────────────────────────────────────

export async function fetchTags(): Promise<Tag[]> {
  const data = await get<Tag[]>("/api/tags");
  return Array.isArray(data) ? data : [];
}

// ─── Search ─────────────────────────────────────────────────

export async function searchNotes(
  query: string,
  maxResults = 20
): Promise<Note[]> {
  const data = await get<SearchResult[]>("/api/search", {
    q: query,
    maxResults: String(maxResults),
  });
  return (Array.isArray(data) ? data : []).map(searchResultToNote);
}
