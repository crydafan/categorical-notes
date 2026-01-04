export interface Note {
  id: number;
  title: string;
  content: string;
  category: string[] | string; // TODO: Fix string type when migrating existing notes
  isArchived: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface NoteFormData {
  title: string;
  content: string;
  category: string[];
}
