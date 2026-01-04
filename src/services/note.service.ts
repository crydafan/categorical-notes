import type { Note, NoteFormData } from "@/types/note";
import { authService } from "./auth.service";
import { fetchWithRefresh } from "@/lib/fetch-with-refresh";

// Helper to convert date strings to Date objects
const parseNote = (note: Note): Note => {
  return {
    ...note,
    createdAt: new Date(note.createdAt),
    updatedAt: new Date(note.updatedAt),
  };
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const noteService = {
  // Get all notes
  getAllNotes: async (): Promise<Note[]> => {
    const response = await fetchWithRefresh("/api/notes", {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch notes");
    const notes = await response.json();
    return notes.map(parseNote);
  },

  // Get active notes
  getActiveNotes: async (): Promise<Note[]> => {
    const notes = await noteService.getAllNotes();
    return notes.filter((note) => !note.isArchived);
  },

  // Get archived notes
  getArchivedNotes: async (): Promise<Note[]> => {
    const notes = await noteService.getAllNotes();
    return notes.filter((note) => note.isArchived);
  },

  // Create a new note
  createNote: async (data: NoteFormData): Promise<Note> => {
    const response = await fetchWithRefresh("/api/notes", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create note");
    const note = await response.json();
    return parseNote(note);
  },

  // Update an existing note
  updateNote: async (
    id: number,
    data: Partial<Omit<Note, "id" | "createdAt" | "updatedAt">>
  ): Promise<Note> => {
    const response = await fetchWithRefresh(`/api/notes/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update note");
    const note = await response.json();
    return parseNote(note);
  },

  // Delete a note
  deleteNote: async (id: number): Promise<void> => {
    const response = await fetchWithRefresh(`/api/notes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete note");
  },

  // Archive a note
  archiveNote: async (id: number): Promise<Note> => {
    return noteService.updateNote(id, { isArchived: true });
  },

  // Unarchive a note
  unarchiveNote: async (id: number): Promise<Note> => {
    return noteService.updateNote(id, { isArchived: false });
  },

  // Add category to a note
  addCategory: async (id: number, categoryToAdd: string): Promise<Note> => {
    const response = await fetchWithRefresh(`/api/notes/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch note");
    const note = await response.json();

    const categories = note.category || [];
    if (!categories.includes(categoryToAdd)) {
      categories.push(categoryToAdd);
    }

    return noteService.updateNote(id, { category: categories });
  },

  // Remove category from a note
  removeCategory: async (
    id: number,
    categoryToRemove: string
  ): Promise<Note> => {
    const response = await fetchWithRefresh(`/api/notes/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch note");
    const note = await response.json();

    const categories = (note.category || []).filter(
      (c: string) => c !== categoryToRemove
    );

    return noteService.updateNote(id, { category: categories });
  },
};
