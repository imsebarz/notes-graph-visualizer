// Notebook color palette - cool/warm tones for visual distinction
const NOTEBOOK_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#ec4899", // pink
  "#f43f5e", // rose
  "#06b6d4", // cyan
  "#14b8a6", // teal
  "#22c55e", // green
  "#eab308", // yellow
  "#f97316", // orange
  "#3b82f6", // blue
  "#ef4444", // red
];

const TAG_COLOR = "#f59e0b"; // amber for all tags
const DEFAULT_NOTE_COLOR = "#6366f1";

const notebookColorMap = new Map<string, string>();

export function getNotebookColor(notebookId: string): string {
  if (!notebookColorMap.has(notebookId)) {
    const idx = notebookColorMap.size % NOTEBOOK_COLORS.length;
    notebookColorMap.set(notebookId, NOTEBOOK_COLORS[idx]);
  }
  return notebookColorMap.get(notebookId)!;
}

export function getNodeColor(type: "note" | "tag", notebookId?: string): string {
  if (type === "tag") return TAG_COLOR;
  return notebookId ? getNotebookColor(notebookId) : DEFAULT_NOTE_COLOR;
}

export { TAG_COLOR, DEFAULT_NOTE_COLOR };
