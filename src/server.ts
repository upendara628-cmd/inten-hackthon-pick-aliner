import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

import {
  saveThemeToServer,
  getThemeFromServer,
  listThemesFromServer,
  deleteThemeFromServer,
} from "./lib/server-themes";
import { handleWebFetchApi } from "./lib/server-api-handler";

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const hackathonRes = await handleWebFetchApi(request);
      if (hackathonRes) return hackathonRes;

      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/themes")) {
        const parts = url.pathname
          .replace(/^\/api\/themes\/?/, "")
          .split("/")
          .filter(Boolean);
        const themeId = parts[0];

        if (request.method === "GET") {
          if (themeId) {
            const theme = getThemeFromServer(themeId);
            if (theme) {
              return new Response(JSON.stringify(theme), {
                headers: { "content-type": "application/json" },
              });
            }
            return new Response(JSON.stringify({ error: "Theme not found" }), {
              status: 404,
              headers: { "content-type": "application/json" },
            });
          }
          const list = listThemesFromServer();
          return new Response(JSON.stringify(list), {
            headers: { "content-type": "application/json" },
          });
        }

        if (request.method === "POST") {
          try {
            const theme = (await request.json()) as any;
            if (!theme?.id) {
              return new Response(JSON.stringify({ error: "Missing theme id" }), {
                status: 400,
                headers: { "content-type": "application/json" },
              });
            }
            saveThemeToServer(theme);
            return new Response(JSON.stringify({ success: true, id: theme.id }), {
              headers: { "content-type": "application/json" },
            });
          } catch {
            return new Response(JSON.stringify({ error: "Invalid JSON" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }
        }

        if (request.method === "DELETE" && themeId) {
          deleteThemeFromServer(themeId);
          return new Response(JSON.stringify({ success: true }), {
            headers: { "content-type": "application/json" },
          });
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
