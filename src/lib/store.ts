export type ShapeType = "rectangle" | "circle";
export type TextFieldKey = "fullName" | "jobTitle" | "idCode";

export interface TextPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TextPositions = Record<TextFieldKey, TextPosition>;

export interface UserTextValues {
  fullName: string;
  jobTitle: string;
  idCode: string;
}

export const DEFAULT_TEXT_POSITIONS: TextPositions = {
  fullName: { x: 12, y: 61, width: 76, height: 8 },
  jobTitle: { x: 18, y: 71, width: 64, height: 6 },
  idCode: { x: 28, y: 81, width: 44, height: 5 },
};

export interface Theme {
  id: string;
  title: string;
  background_image_url: string;
  box_x: number;
  box_y: number;
  box_width: number;
  box_height: number;
  shape_type: ShapeType;
  text_positions?: TextPositions;
  created_at: string;
}

export function getTextPositions(theme: Theme): TextPositions {
  return theme.text_positions ?? DEFAULT_TEXT_POSITIONS;
}

const DB_NAME = "theme-studio";
const STORE = "themes";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function listThemes(): Promise<Theme[]> {
  const all = await tx<Theme[]>("readonly", (s) => s.getAll() as IDBRequest<Theme[]>);
  return all.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getTheme(id: string): Promise<Theme | undefined> {
  return tx<Theme | undefined>("readonly", (s) => s.get(id) as IDBRequest<Theme | undefined>);
}

export async function saveTheme(theme: Theme): Promise<void> {
  await tx("readwrite", (s) => s.put(theme) as IDBRequest<IDBValidKey>);
}

export async function deleteTheme(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id) as IDBRequest<undefined>);
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
