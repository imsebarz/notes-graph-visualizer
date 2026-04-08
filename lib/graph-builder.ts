import type { Note, Tag, Notebook, GraphData, GraphNode, GraphLink } from "./types";
import { getNodeColor } from "./colors";

export function buildGraphData(
  notes: Note[],
  tags: Tag[],
  notebooks: Notebook[]
): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const notebookMap = new Map(notebooks.map((nb) => [nb.id, nb]));
  const tagMap = new Map(tags.map((t) => [t.id, t]));

  // Track connections per node to size them
  const connectionCount = new Map<string, number>();
  const increment = (id: string) =>
    connectionCount.set(id, (connectionCount.get(id) || 0) + 1);

  // 1. Create tag nodes
  const usedTagIds = new Set<string>();
  for (const note of notes) {
    for (const tagId of note.tagIds || []) {
      usedTagIds.add(tagId);
    }
  }

  for (const tagId of usedTagIds) {
    const tag = tagMap.get(tagId);
    if (!tag) continue;
    nodes.push({
      id: `tag-${tag.id}`,
      label: `#${tag.name}`,
      type: "tag",
      color: getNodeColor("tag"),
      size: 2,
    });
  }

  // 2. Create note nodes + note↔tag links
  for (const note of notes) {
    const notebook = note.notebookId ? notebookMap.get(note.notebookId) : undefined;
    nodes.push({
      id: `note-${note.id}`,
      label: note.title,
      type: "note",
      color: getNodeColor("note", note.notebookId),
      size: 4,
      notebookId: note.notebookId,
      notebookName: notebook?.name,
      tagIds: note.tagIds,
      tagNames: (note.tagIds || [])
        .map((id) => tagMap.get(id)?.name)
        .filter((n): n is string => !!n),
      snippet: note.snippet || note.content?.slice(0, 200),
      created: note.created,
      updated: note.updated,
    });

    for (const tagId of note.tagIds || []) {
      if (!tagMap.has(tagId)) continue;
      links.push({
        source: `note-${note.id}`,
        target: `tag-${tagId}`,
        type: "note-tag",
        strength: 0.3,
      });
      increment(`note-${note.id}`);
      increment(`tag-${tagId}`);
    }
  }

  // 3. Detect note↔note references (title mentions in content)
  const noteTitleIndex = notes.map((n) => ({
    id: n.id,
    title: n.title.toLowerCase(),
  }));

  for (const note of notes) {
    if (!note.content && !note.snippet) continue;
    const text = (note.content || note.snippet || "").toLowerCase();

    for (const other of noteTitleIndex) {
      if (other.id === note.id) continue;
      if (other.title.length < 4) continue; // skip very short titles
      if (text.includes(other.title)) {
        // Avoid duplicate links
        const exists = links.some(
          (l) =>
            l.type === "note-note" &&
            ((l.source === `note-${note.id}` && l.target === `note-${other.id}`) ||
              (l.source === `note-${other.id}` && l.target === `note-${note.id}`))
        );
        if (!exists) {
          links.push({
            source: `note-${note.id}`,
            target: `note-${other.id}`,
            type: "note-note",
            strength: 0.7,
          });
          increment(`note-${note.id}`);
          increment(`note-${other.id}`);
        }
      }
    }
  }

  // 4. Size nodes by connection count
  for (const node of nodes) {
    const count = connectionCount.get(node.id) || 0;
    if (node.type === "note") {
      node.size = 3 + Math.min(count * 1.5, 12);
    } else {
      node.size = 2 + Math.min(count * 0.8, 8);
    }
  }

  return { nodes, links };
}
