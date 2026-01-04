import { useState, useEffect, useMemo } from "react";
import type { Note, NoteFormData } from "@/types/note";
import { noteService } from "@/services/note.service";
import { authService } from "@/services/auth.service";
import { NoteCard } from "@/components/note-card";
import { NoteForm } from "@/components/note-form";
import { CategoryFilter } from "@/components/category-filter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, StickyNote, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const allNotes = await noteService.getAllNotes();
      setNotes(allNotes);
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  };

  // Get all unique categories
  const allCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    notes.forEach((note) => {
      (note.category || []).forEach((cat) => categoriesSet.add(cat));
    });
    return Array.from(categoriesSet).sort();
  }, [notes]);

  // Filter notes based on selected categories and tab
  const filteredNotes = useMemo(() => {
    const tabNotes =
      activeTab === "active"
        ? notes.filter((note) => !note.isArchived)
        : notes.filter((note) => note.isArchived);

    if (selectedCategories.length === 0) {
      return tabNotes;
    }

    return tabNotes.filter((note) =>
      selectedCategories.every((category) =>
        (note.category || []).includes(category)
      )
    );
  }, [notes, selectedCategories, activeTab]);

  const handleCreateNote = async (data: NoteFormData) => {
    try {
      await noteService.createNote(data);
      await loadNotes();
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const handleUpdateNote = async (data: NoteFormData) => {
    if (editingNote) {
      try {
        await noteService.updateNote(editingNote.id, data);
        await loadNotes();
        setEditingNote(null);
      } catch (error) {
        console.error("Failed to update note:", error);
      }
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await noteService.deleteNote(id);
        await loadNotes();
      } catch (error) {
        console.error("Failed to delete note:", error);
      }
    }
  };

  const handleArchiveNote = async (id: number) => {
    try {
      await noteService.archiveNote(id);
      await loadNotes();
    } catch (error) {
      console.error("Failed to archive note:", error);
    }
  };

  const handleUnarchiveNote = async (id: number) => {
    try {
      await noteService.unarchiveNote(id);
      await loadNotes();
    } catch (error) {
      console.error("Failed to unarchive note:", error);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };

  const handleToggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingNote(null);
  };

  const handleFormSubmit = (data: NoteFormData) => {
    if (editingNote) {
      handleUpdateNote(data);
    } else {
      handleCreateNote(data);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <StickyNote className="h-8 w-8" />
            <h1 className="text-4xl font-bold">Notes</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsFormOpen(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              New Note
            </Button>
            <Button onClick={handleLogout} variant="outline" size="lg">
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <CategoryFilter
            categories={allCategories}
            selectedCategories={selectedCategories}
            onToggleCategory={handleToggleCategory}
            onClearFilters={handleClearFilters}
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "active" | "archived")
          }
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">
              Active ({notes.filter((n) => !n.isArchived).length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived ({notes.filter((n) => n.isArchived).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <StickyNote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No active notes</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedCategories.length > 0
                    ? "No notes match the selected categories"
                    : "Create your first note to get started"}
                </p>
                {selectedCategories.length === 0 && (
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onArchive={handleArchiveNote}
                    onUnarchive={handleUnarchiveNote}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <StickyNote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No archived notes</h3>
                <p className="text-muted-foreground">
                  {selectedCategories.length > 0
                    ? "No archived notes match the selected categories"
                    : "Archive notes to move them here"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onArchive={handleArchiveNote}
                    onUnarchive={handleUnarchiveNote}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <NoteForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        editingNote={editingNote}
      />
    </div>
  );
}
