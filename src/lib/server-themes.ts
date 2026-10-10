import fs from "node:fs";
import path from "node:path";
import type { Theme } from "./store";

const THEMES_DIR = path.resolve(process.cwd(), "data", "themes");
const memoryCache = new Map<string, Theme>();

function ensureDir() {
  if (!fs.existsSync(THEMES_DIR)) {
    fs.mkdirSync(THEMES_DIR, { recursive: true });
  }

  // Seed default demonstration themes if not present
  for (const st of SEED_THEMES) {
    const fp = path.join(THEMES_DIR, `${st.id}.json`);
    if (!fs.existsSync(fp)) {
      try {
        fs.writeFileSync(fp, JSON.stringify(st, null, 2), "utf-8");
      } catch {}
    }
  }
}

const SEED_THEMES: Theme[] = [
  {
    id: "framewise-engineering-2026",
    title: "Framewise Engineering Pass 2026",
    background_image_url: "/stud.png",
    box_x: 35,
    box_y: 20,
    box_width: 30,
    box_height: 32,
    shape_type: "circle",
    created_at: "2026-10-10T10:00:00.000Z",
    text_fields: [
      {
        id: "fullName",
        label: "Full Name",
        x: 10,
        y: 56,
        width: 80,
        height: 9,
        font_size: 4.8,
        color: "#0f172a",
        align: "center",
        font_weight: "bold",
      },
      {
        id: "jobTitle",
        label: "Role",
        x: 15,
        y: 67,
        width: 70,
        height: 7,
        font_size: 3.4,
        color: "#6c2bff",
        align: "center",
        font_weight: "bold",
      },
      {
        id: "idCode",
        label: "Credential ID",
        x: 20,
        y: 76,
        width: 60,
        height: 6,
        font_size: 2.8,
        color: "#ea580c",
        align: "center",
        font_weight: "normal",
      },
    ],
  },
  {
    id: "hackathon-sprint-badge",
    title: "Hackathon Live Sprint Credential",
    background_image_url: "/stud.png",
    box_x: 32,
    box_y: 22,
    box_width: 36,
    box_height: 30,
    shape_type: "rectangle",
    created_at: "2026-10-09T14:30:00.000Z",
    text_fields: [
      {
        id: "fullName",
        label: "Hacker Name",
        x: 10,
        y: 56,
        width: 80,
        height: 9,
        font_size: 4.6,
        color: "#0f172a",
        align: "center",
        font_weight: "bold",
      },
      {
        id: "jobTitle",
        label: "Track & Squad",
        x: 15,
        y: 67,
        width: 70,
        height: 7,
        font_size: 3.3,
        color: "#7c3aed",
        align: "center",
        font_weight: "bold",
      },
      {
        id: "idCode",
        label: "Participant UID",
        x: 20,
        y: 76,
        width: 60,
        height: 6,
        font_size: 2.8,
        color: "#0284c7",
        align: "center",
        font_weight: "normal",
      },
    ],
  },
  {
    id: "student-summit-pass",
    title: "Global Student Summit 2026",
    background_image_url: "/stud.png",
    box_x: 34,
    box_y: 19,
    box_width: 32,
    box_height: 33,
    shape_type: "circle",
    created_at: "2026-10-08T09:15:00.000Z",
    text_fields: [
      {
        id: "fullName",
        label: "Delegate Name",
        x: 10,
        y: 56,
        width: 80,
        height: 9,
        font_size: 4.8,
        color: "#0f172a",
        align: "center",
        font_weight: "bold",
      },
      {
        id: "jobTitle",
        label: "University / Institution",
        x: 15,
        y: 67,
        width: 70,
        height: 7,
        font_size: 3.3,
        color: "#059669",
        align: "center",
        font_weight: "bold",
      },
      {
        id: "idCode",
        label: "Pass ID",
        x: 20,
        y: 76,
        width: 60,
        height: 6,
        font_size: 2.7,
        color: "#475569",
        align: "center",
        font_weight: "normal",
      },
    ],
  },
];

export function saveThemeToServer(theme: Theme): void {
  try {
    ensureDir();
    memoryCache.set(theme.id, theme);
    const filePath = path.join(THEMES_DIR, `${theme.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(theme), "utf-8");
  } catch (err) {
    console.error("Failed to save theme to disk:", err);
  }
}

export function getThemeFromServer(id: string): Theme | null {
  try {
    if (memoryCache.has(id)) {
      return memoryCache.get(id)!;
    }
    ensureDir();
    const filePath = path.join(THEMES_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const theme = JSON.parse(content) as Theme;
      memoryCache.set(id, theme);
      return theme;
    }
  } catch (err) {
    console.error(`Failed to read theme ${id} from disk:`, err);
  }
  return null;
}

export function listThemesFromServer(): Theme[] {
  try {
    ensureDir();
    const files = fs.readdirSync(THEMES_DIR);
    const themes: Theme[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const id = file.replace(/\.json$/, "");
      const t = getThemeFromServer(id);
      if (t) themes.push(t);
    }
    return themes.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  } catch (err) {
    console.error("Failed to list themes from disk:", err);
    return Array.from(memoryCache.values());
  }
}

export function deleteThemeFromServer(id: string): void {
  try {
    memoryCache.delete(id);
    ensureDir();
    const filePath = path.join(THEMES_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Failed to delete theme ${id}:`, err);
  }
}
