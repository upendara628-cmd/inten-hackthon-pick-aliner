import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

function themesApiPlugin(): Plugin {
  const dataDir = path.resolve(process.cwd(), "data", "themes");
  const ensureDir = () => {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  };

  return {
    name: "themes-api-plugin",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/themes")) {
          return next();
        }

        const pathname = url.split("?")[0] || "";
        const parts = pathname
          .replace(/^\/api\/themes\/?/, "")
          .split("/")
          .filter(Boolean);
        const themeId = parts[0];

        res.setHeader("Content-Type", "application/json");

        if (req.method === "GET") {
          ensureDir();
          if (themeId) {
            const filePath = path.join(dataDir, `${themeId}.json`);
            if (fs.existsSync(filePath)) {
              const data = fs.readFileSync(filePath, "utf-8");
              res.statusCode = 200;
              res.end(data);
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "Theme not found" }));
            }
          } else {
            const files = fs.readdirSync(dataDir);
            const themes = [];
            for (const file of files) {
              if (file.endsWith(".json")) {
                try {
                  const content = fs.readFileSync(path.join(dataDir, file), "utf-8");
                  themes.push(JSON.parse(content));
                } catch {}
              }
            }
            themes.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
            res.statusCode = 200;
            res.end(JSON.stringify(themes));
          }
          return;
        }

        if (req.method === "POST") {
          ensureDir();
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", () => {
            try {
              const theme = JSON.parse(body);
              if (!theme.id) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Missing theme id" }));
                return;
              }
              const filePath = path.join(dataDir, `${theme.id}.json`);
              fs.writeFileSync(filePath, JSON.stringify(theme), "utf-8");
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, id: theme.id }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Invalid JSON" }));
            }
          });
          return;
        }

        if (req.method === "DELETE" && themeId) {
          ensureDir();
          const filePath = path.join(dataDir, `${themeId}.json`);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true }));
          return;
        }

        next();
      });
    },
  };
}

import { handleConnectApi } from "./src/lib/server-api-handler";

function hackathonsApiPlugin(): Plugin {
  return {
    name: "hackathons-api-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          await handleConnectApi(req, res, next);
        } catch (err) {
          next(err instanceof Error ? err : new Error(String(err)));
        }
      });
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [themesApiPlugin(), hackathonsApiPlugin()],
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
