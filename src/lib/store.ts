export type ShapeType = "rectangle" | "circle";
export type TextFieldKey = "fullName" | "jobTitle" | "idCode";
export type TextAlign = "left" | "center" | "right";
export type FontWeight = "normal" | "bold";

export interface TextPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TextPositions = Record<TextFieldKey, TextPosition>;

export interface TextField extends TextPosition {
  id: string;
  label: string;
  font_size: number;
  color: string;
  align: TextAlign;
  font_weight: FontWeight;
}

export type UserTextValues = Record<string, string>;

export interface PhotoAdjustment {
  scale: number; // 0.5 to 3.0, 1 = 100%
  offsetX: number; // -50 to +50% of placeholder width
  offsetY: number; // -50 to +50% of placeholder height
  rotate?: number; // 0, 90, 180, 270
}

export const DEFAULT_PHOTO_ADJUSTMENT: PhotoAdjustment = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotate: 0,
};

export const DEFAULT_TEXT_POSITIONS: TextPositions = {
  fullName: { x: 12, y: 61, width: 76, height: 8 },
  jobTitle: { x: 18, y: 71, width: 64, height: 6 },
  idCode: { x: 28, y: 81, width: 44, height: 5 },
};

export const DEFAULT_TEXT_FIELDS: TextField[] = [
  {
    id: "fullName",
    label: "Full Name",
    ...DEFAULT_TEXT_POSITIONS.fullName,
    font_size: 4.8,
    color: "#111827",
    align: "center",
    font_weight: "bold",
  },
  {
    id: "jobTitle",
    label: "Job Title",
    ...DEFAULT_TEXT_POSITIONS.jobTitle,
    font_size: 3.4,
    color: "#111827",
    align: "center",
    font_weight: "normal",
  },
  {
    id: "idCode",
    label: "Employee ID",
    ...DEFAULT_TEXT_POSITIONS.idCode,
    font_size: 2.8,
    color: "#111827",
    align: "center",
    font_weight: "normal",
  },
];

export interface Theme {
  id: string;
  title: string;
  background_image_url: string;
  box_x: number;
  box_y: number;
  box_width: number;
  box_height: number;
  shape_type: ShapeType;
  template_width?: number;
  template_height?: number;
  text_fields?: TextField[];
  /** Legacy placement format retained so existing browser-saved themes still load. */
  text_positions?: TextPositions;
  created_at: string;
}

export function getTextPositions(theme: Theme): TextPositions {
  return theme.text_positions ?? DEFAULT_TEXT_POSITIONS;
}

export function getTextFields(theme: Theme): TextField[] {
  if (theme.text_fields) return theme.text_fields;
  const positions = getTextPositions(theme);
  return DEFAULT_TEXT_FIELDS.map((field) => ({ ...field, ...positions[field.id as TextFieldKey] }));
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
  const map = new Map<string, Theme>();

  // 1. Load from IndexedDB
  try {
    const local = await tx<Theme[]>("readonly", (s) => s.getAll() as IDBRequest<Theme[]>);
    for (const t of local) map.set(t.id, t);
  } catch {}

  // 2. Load from server
  try {
    if (typeof window !== "undefined") {
      const res = await fetch("/api/themes");
      if (res.ok) {
        const serverThemes = (await res.json()) as Theme[];
        for (const t of serverThemes) map.set(t.id, t);
      }
    }
  } catch {}

  const all = Array.from(map.values());
  return all.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

export async function getTheme(id: string): Promise<Theme | undefined> {
  // 1. First check IndexedDB (instant local cache)
  try {
    const local = await tx<Theme | undefined>(
      "readonly",
      (s) => s.get(id) as IDBRequest<Theme | undefined>,
    );
    if (local) return local;
  } catch {}

  // 2. If not found in IndexedDB (e.g. pasted into another tab, incognito, or different device), fetch from server!
  try {
    if (typeof window !== "undefined") {
      const res = await fetch(`/api/themes/${id}`);
      if (res.ok) {
        const serverTheme = (await res.json()) as Theme;
        if (serverTheme && serverTheme.id === id) {
          // Cache in local IndexedDB for future visits
          tx("readwrite", (s) => s.put(serverTheme) as IDBRequest<IDBValidKey>).catch(() => {});
          return serverTheme;
        }
      }
    }
  } catch {}

  return undefined;
}

export async function saveTheme(theme: Theme): Promise<void> {
  // 1. Save locally in IndexedDB
  try {
    await tx("readwrite", (s) => s.put(theme) as IDBRequest<IDBValidKey>);
  } catch (err) {
    console.warn("Could not save to IndexedDB:", err);
  }

  // 2. Also sync to server API so any other tab, browser, or device can access it!
  try {
    if (typeof window !== "undefined") {
      await fetch("/api/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
    }
  } catch (err) {
    console.warn("Could not sync theme to server:", err);
  }
}

export async function deleteTheme(id: string): Promise<void> {
  try {
    await tx("readwrite", (s) => s.delete(id) as IDBRequest<undefined>);
  } catch {}
  try {
    if (typeof window !== "undefined") {
      await fetch(`/api/themes/${id}`, { method: "DELETE" });
    }
  } catch {}
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Encode a theme into a URL-safe string (retained for backward compatibility). */
export function encodeTheme(theme: Theme): string {
  const json = JSON.stringify(theme);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decode a theme embedded in a share link. Returns null when invalid. */
export function decodeTheme(encoded: string): Theme | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const theme = JSON.parse(new TextDecoder().decode(bytes)) as Theme;
    if (!theme || typeof theme.id !== "string" || typeof theme.background_image_url !== "string") {
      return null;
    }
    return theme;
  } catch {
    return null;
  }
}

/** Build a clean, reliable share link that opens seamlessly on any tab or device. */
export function shareLinkFor(theme: Theme): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/d/${theme.id}`;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
