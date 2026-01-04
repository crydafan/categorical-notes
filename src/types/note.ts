export interface Note {
  id: number;
  title: string;
  content: string;
  category: string[];
  isArchived: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface NoteFormData {
  title: string;
  content: string;
  category: string[];
}
