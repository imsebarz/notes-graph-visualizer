import { NextResponse } from "next/server";
import { buildGraphData } from "@/lib/graph-builder";
import { fetchNotes, fetchNotebooks, fetchTags } from "@/lib/api";
import { mockNotes, mockNotebooks, mockTags } from "@/lib/mock-data";

export async function GET() {
  const useMock =
    !process.env.EVERNOTE_MCP_URL || !process.env.EVERNOTE_API_KEY;

  try {
    let notes, notebooks, tags;

    if (useMock) {
      notes = mockNotes;
      notebooks = mockNotebooks;
      tags = mockTags;
    } else {
      [notes, notebooks, tags] = await Promise.all([
        fetchNotes(),
        fetchNotebooks(),
        fetchTags(),
      ]);
    }

    const graphData = buildGraphData(notes, tags, notebooks);

    return NextResponse.json({
      ...graphData,
      meta: {
        noteCount: notes.length,
        tagCount: tags.length,
        notebookCount: notebooks.length,
        mock: useMock,
      },
    });
  } catch (error) {
    console.error("Graph API error:", error);

    // Fallback to mock data on error
    const graphData = buildGraphData(mockNotes, mockTags, mockNotebooks);
    return NextResponse.json({
      ...graphData,
      meta: {
        noteCount: mockNotes.length,
        tagCount: mockTags.length,
        notebookCount: mockNotebooks.length,
        mock: true,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
