import fs from "node:fs";
import path from "node:path";
import type { Theme } from "./store";

import os from "node:os";

function resolveThemesDir(): string {
  const local = path.resolve(process.cwd(), "data", "themes");
  try {
    if (!fs.existsSync(local)) {
      fs.mkdirSync(local, { recursive: true });
    }
    const testFile = path.join(local, `.test_${Date.now()}`);
    fs.writeFileSync(testFile, "");
    fs.unlinkSync(testFile);
    return local;
  } catch {
    const tmp = path.resolve(os.tmpdir(), "framewise-data", "themes");
    try {
      if (!fs.existsSync(tmp)) {
        fs.mkdirSync(tmp, { recursive: true });
      }
    } catch {}
    return tmp;
  }
}

const THEMES_DIR = resolveThemesDir();
const memoryCache = new Map<string, Theme>();

function ensureDir() {
  try {
    if (!fs.existsSync(THEMES_DIR)) {
      fs.mkdirSync(THEMES_DIR, { recursive: true });
    }
  } catch {}

  // Seed default demonstration themes if not present
  for (const st of SEED_THEMES) {
    try {
      const fp = path.join(THEMES_DIR, `${st.id}.json`);
      if (!fs.existsSync(fp)) {
        fs.writeFileSync(fp, JSON.stringify(st, null, 2), "utf-8");
      }
    } catch {}
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

// Initialize memoryCache with default templates
for (const st of SEED_THEMES) {
  memoryCache.set(st.id, st);
}

export function saveThemeToServer(theme: Theme): void {
  try {
    memoryCache.set(theme.id, theme);
    ensureDir();
    const filePath = path.join(THEMES_DIR, `${theme.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(theme), "utf-8");
  } catch (err) {
    // In-memory cache retains saved theme if disk is read-only
  }
}

export function getThemeFromServer(id: string): Theme | null {
  if (memoryCache.has(id)) {
    return memoryCache.get(id)!;
  }
  try {
    ensureDir();
    const filePath = path.join(THEMES_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const theme = JSON.parse(content) as Theme;
      memoryCache.set(id, theme);
      return theme;
    }
  } catch {}

  try {
    const origPath = path.resolve(process.cwd(), "data", "themes", `${id}.json`);
    if (origPath !== path.join(THEMES_DIR, `${id}.json`) && fs.existsSync(origPath)) {
      const content = fs.readFileSync(origPath, "utf-8");
      const theme = JSON.parse(content) as Theme;
      memoryCache.set(id, theme);
      return theme;
    }
  } catch {}

  return null;
}

export function listThemesFromServer(): Theme[] {
  try {
    ensureDir();
    if (fs.existsSync(THEMES_DIR)) {
      const files = fs.readdirSync(THEMES_DIR);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const id = file.replace(/\.json$/, "");
        getThemeFromServer(id);
      }
    }
  } catch {}

  // Also check original project directory if bundled
  const originalThemesDir = path.resolve(process.cwd(), "data", "themes");
  if (originalThemesDir !== THEMES_DIR) {
    try {
      if (fs.existsSync(originalThemesDir)) {
        const files = fs.readdirSync(originalThemesDir);
        for (const file of files) {
          if (!file.endsWith(".json")) continue;
          const id = file.replace(/\.json$/, "");
          getThemeFromServer(id);
        }
      }
    } catch {}
  }

  return Array.from(memoryCache.values()).sort((a, b) =>
    (b.created_at || "").localeCompare(a.created_at || ""),
  );
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
