export interface Folder {
  id: number;
  name: string;
  parent: Folder | null;
  created_at: string;
  updated_at: string;
}
