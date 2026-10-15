import type { IncomingMessage, ServerResponse } from "node:http";
import { authenticateToken, loginOrRegister, updateUserProfile, parseGoogleJwt } from "./server-auth";
import {
  createOrUpdateSubmission,
  createTeam,
  deleteHackathon,
  deleteOrArchiveHackathon,
  generateExcelReport,
  getAuditLogs,
  getHackathon,
  getHackathonStats,
  getParticipation,
  getUploadedProblemFile,
  listHackathons,
  listParticipations,
  listSubmissions,
  listTeams,
  recordAuditLog,
  saveHackathon,
  saveUploadedProblemFile,
  startParticipation,
  updateHackathonStatus,
} from "./server-hackathons";
import fs from "node:fs";

// Helper to parse JSON body from IncomingMessage
function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
  });
}

function getAuthUser(req: IncomingMessage) {
  const authHeader = (req.headers["authorization"] as string) || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return authenticateToken(token);
}

function getAuthUserFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return authenticateToken(token);
}

/**
 * Connect Middleware Handler for Vite dev server
 */
export async function handleConnectApi(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): Promise<void> {
  const url = req.url || "";
  if (!url.startsWith("/api/")) {
    return next();
  }

  const pathname = url.split("?")[0] || "";
  const search = url.split("?")[1] || "";
  const query = new URLSearchParams(search);

  // 1. Server time endpoint
  if (pathname === "/api/server-time" && req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        serverTime: new Date().toISOString(),
        timestamp: Date.now(),
      }),
    );
    return;
  }

  // 2. Auth endpoints
  if (pathname === "/api/auth/google" && req.method === "POST") {
    try {
      const body = await parseBody(req);
      if (!body.credential) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Missing Google credential" }));
        return;
      }
      if (body.role === "organizer") {
        res.statusCode = 403;
        res.end(
          JSON.stringify({
            error:
              "Google login is disabled for Administrator accounts. Please use the standard administrator login form.",
          }),
        );
        return;
      }
      const jwtData = parseGoogleJwt(body.credential);
      if (!jwtData) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid Google credential" }));
        return;
      }
      const user = loginOrRegister({
        email: jwtData.email,
        name: jwtData.name,
        picture: jwtData.picture,
        role: "participant",
        rollNumber: body.rollNumber,
        institution: body.institution,
        phone: body.phone,
      });
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, user }));
    } catch {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
    return;
  }

  if (pathname === "/api/auth/login" && req.method === "POST") {
    try {
      const body = await parseBody(req);
      const user = loginOrRegister(body);
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, user }));
    } catch (err: any) {
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 401;
      res.end(JSON.stringify({ error: err.message || "Authentication failed" }));
    }
    return;
  }

  if (pathname === "/api/auth/me" && req.method === "GET") {
    const user = getAuthUser(req);
    res.setHeader("Content-Type", "application/json");
    if (!user) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "Unauthenticated" }));
      return;
    }
    res.statusCode = 200;
    res.end(JSON.stringify({ user }));
    return;
  }

  if (pathname === "/api/auth/profile" && req.method === "PUT") {
    const user = getAuthUser(req);
    if (!user) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "Unauthenticated" }));
      return;
    }
    const body = await parseBody(req);
    const updated = updateUserProfile(user.id, body);
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, user: updated }));
    return;
  }

  // 3. Hackathons List & Create
  if (pathname === "/api/hackathons") {
    if (req.method === "GET") {
      const includeDrafts = query.get("includeDrafts") === "true";
      const user = getAuthUser(req);
      // Only allow drafts if organizer or explicitly requested
      const list = listHackathons(includeDrafts || user?.role === "organizer");
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify(list));
      return;
    }

    if (req.method === "POST") {
      const user = getAuthUser(req);
      try {
        const body = await parseBody(req);
        if (!body || !body.name || !body.name.trim()) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Hackathon Name is required" }));
          return;
        }
        if (!body.id) {
          body.id = "hack_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        }
        if (!body.status) {
          body.status = "DRAFT";
        }
        if (!body.startDate) {
          body.startDate = new Date().toISOString();
        }
        if (!body.problemStatement) {
          body.problemStatement = {
            title: `${body.name.trim()} Problem Statement`,
            description: body.description || "",
          };
        }
        const saved = saveHackathon(body, {
          name: user?.name || "Event Organizer Sir",
          role: "organizer",
        });
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, hackathon: saved }));
      } catch (err: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message || "Failed to save hackathon" }));
      }
      return;
    }
  }

  // Match /api/hackathons/:id/...
  const match = pathname.match(/^\/api\/hackathons\/([^/]+)(.*)$/);
  if (match && match[1]) {
    const hackathonId = match[1];
    const subPath = match[2] || "";

    // Export Excel (.xlsx)
    if (subPath === "/export" && req.method === "GET") {
      try {
        const buffer = generateExcelReport(hackathonId);
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader("Content-Disposition", `attachment; filename="${hackathonId}-report.xlsx"`);
        res.statusCode = 200;
        res.end(buffer);
      } catch (err: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // Serve uploaded problem file
    const fileMatch = subPath.match(/^\/files\/([^/]+)$/);
    if (fileMatch && fileMatch[1] && req.method === "GET") {
      const storedFilename = fileMatch[1];
      const { filePath, exists } = getUploadedProblemFile(storedFilename);
      if (!exists) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "File not found" }));
        return;
      }
      const data = fs.readFileSync(filePath);
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `inline; filename="${storedFilename}"`);
      res.statusCode = 200;
      res.end(data);
      return;
    }

    // Publish / Status change
    if (subPath === "/publish" && req.method === "POST") {
      const user = getAuthUser(req);
      const updated = updateHackathonStatus(hackathonId, "PUBLISHED", {
        name: user?.name || "Organizer",
        role: user?.role || "organizer",
      });
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, hackathon: updated }));
      return;
    }

    if (subPath === "/status" && req.method === "POST") {
      const user = getAuthUser(req);
      const body = await parseBody(req);
      const updated = updateHackathonStatus(hackathonId, body.status, {
        name: user?.name || "Organizer",
        role: user?.role || "organizer",
      });
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, hackathon: updated }));
      return;
    }

    // Upload problem original file
    if (subPath === "/upload-problem-file" && req.method === "POST") {
      const user = getAuthUser(req);
      try {
        const body = await parseBody(req);
        const fileMeta = saveUploadedProblemFile(
          hackathonId,
          body.filename,
          body.fileType,
          body.base64,
        );
        recordAuditLog(
          hackathonId,
          user?.name || "Organizer",
          user?.role || "organizer",
          "PROBLEM_FILE_UPLOADED",
          `Original file "${body.filename}" (${fileMeta.size} bytes) uploaded.`,
        );
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, fileMeta }));
      } catch (err: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // Participations
    if (subPath === "/participations" && req.method === "GET") {
      const list = listParticipations(hackathonId);
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify(list));
      return;
    }

    // Start participation (Authoritative Server Timer)
    if (subPath === "/participations/start" && req.method === "POST") {
      try {
        const body = await parseBody(req);
        const result = startParticipation(hackathonId, body);
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, ...result }));
      } catch (err: any) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // Teams
    if (subPath === "/teams") {
      if (req.method === "GET") {
        const list = listTeams(hackathonId);
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify(list));
        return;
      }
      if (req.method === "POST") {
        try {
          const body = await parseBody(req);
          const team = createTeam(hackathonId, body);
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, team }));
        } catch (err: any) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }
    }

    // Submissions
    if (subPath === "/submissions") {
      if (req.method === "GET") {
        const list = listSubmissions(hackathonId);
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify(list));
        return;
      }
      if (req.method === "POST") {
        try {
          const body = await parseBody(req);
          const result = createOrUpdateSubmission(hackathonId, body);
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, ...result }));
        } catch (err: any) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }
    }

    // Stats
    if (subPath === "/stats" && req.method === "GET") {
      const stats = getHackathonStats(hackathonId);
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify(stats));
      return;
    }

    // Audit logs
    if (subPath === "/audit" && req.method === "GET") {
      const logs = getAuditLogs(hackathonId);
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify(logs));
      return;
    }

    // Single Hackathon CRUD
    if (subPath === "" || subPath === "/") {
      if (req.method === "GET") {
        const h = getHackathon(hackathonId);
        res.setHeader("Content-Type", "application/json");
        if (!h) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: "Hackathon not found" }));
          return;
        }
        res.statusCode = 200;
        res.end(JSON.stringify(h));
        return;
      }

      if (req.method === "PUT" || req.method === "POST") {
        const user = getAuthUser(req);
        const body = await parseBody(req);
        const saved = saveHackathon(body, {
          name: user?.name || "Organizer",
          role: user?.role || "organizer",
        });
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, hackathon: saved }));
        return;
      }

      if (req.method === "DELETE") {
        const user = getAuthUser(req);
        const isPermanent = query.get("permanent") !== "false";
        deleteHackathon(hackathonId, {
          permanent: isPermanent,
          actor: {
            name: user?.name || "Organizer",
            role: user?.role || "organizer",
          },
        });
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(
          JSON.stringify({
            success: true,
            message: isPermanent ? "Hackathon permanently deleted" : "Archived successfully",
          }),
        );
        return;
      }
    }
  }

  next();
}

/**
 * Standard Web Request Handler for Nitro / SSR in src/server.ts
 */
export async function handleWebFetchApi(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (!pathname.startsWith("/api/")) return null;

  if (pathname === "/api/server-time" && request.method === "GET") {
    return new Response(
      JSON.stringify({
        serverTime: new Date().toISOString(),
        timestamp: Date.now(),
      }),
      { headers: { "content-type": "application/json" } },
    );
  }

  if (pathname === "/api/auth/google" && request.method === "POST") {
    try {
      const body = (await request.json()) as any;
      if (!body.credential) {
        return new Response(JSON.stringify({ error: "Missing Google credential" }), { status: 400 });
      }
      if (body.role === "organizer") {
        return new Response(
          JSON.stringify({
            error:
              "Google login is disabled for Administrator accounts. Please use the standard administrator login form.",
          }),
          { status: 403, headers: { "content-type": "application/json" } },
        );
      }
      const jwtData = parseGoogleJwt(body.credential);
      if (!jwtData) {
        return new Response(JSON.stringify({ error: "Invalid Google credential" }), { status: 400 });
      }
      const user = loginOrRegister({
        email: jwtData.email,
        name: jwtData.name,
        picture: jwtData.picture,
        role: "participant",
        rollNumber: body.rollNumber,
        institution: body.institution,
        phone: body.phone,
      });
      return new Response(JSON.stringify({ success: true, user }), {
        headers: { "content-type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    }
  }

  if (pathname === "/api/auth/login" && request.method === "POST") {
    try {
      const body = (await request.json()) as any;
      const user = loginOrRegister(body);
      return new Response(JSON.stringify({ success: true, user }), {
        headers: { "content-type": "application/json" },
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || "Authentication failed" }),
        { status: 401, headers: { "content-type": "application/json" } },
      );
    }
  }

  if (pathname === "/api/auth/me" && request.method === "GET") {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 });
    }
    return new Response(JSON.stringify({ user }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (pathname === "/api/auth/profile" && request.method === "PUT") {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 });
    }
    const body = (await request.json()) as any;
    const updated = updateUserProfile(user.id, body);
    return new Response(JSON.stringify({ success: true, user: updated }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (pathname === "/api/hackathons") {
    if (request.method === "GET") {
      const includeDrafts = url.searchParams.get("includeDrafts") === "true";
      const user = getAuthUserFromRequest(request);
      const list = listHackathons(includeDrafts || user?.role === "organizer");
      return new Response(JSON.stringify(list), {
        headers: { "content-type": "application/json" },
      });
    }
    if (request.method === "POST") {
      const user = getAuthUserFromRequest(request);
      try {
        const body = (await request.json()) as any;
        if (!body || !body.name || !body.name.trim()) {
          return new Response(JSON.stringify({ error: "Hackathon Name is required" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        if (!body.id) {
          body.id = "hack_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        }
        if (!body.status) {
          body.status = "DRAFT";
        }
        if (!body.startDate) {
          body.startDate = new Date().toISOString();
        }
        if (!body.problemStatement) {
          body.problemStatement = {
            title: `${body.name.trim()} Problem Statement`,
            description: body.description || "",
          };
        }
        const saved = saveHackathon(body, {
          name: user?.name || "Event Organizer Sir",
          role: "organizer",
        });
        return new Response(JSON.stringify({ success: true, hackathon: saved }), {
          headers: { "content-type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || "Failed to save hackathon" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }
  }

  const match = pathname.match(/^\/api\/hackathons\/([^/]+)(.*)$/);
  if (match && match[1]) {
    const hackathonId = match[1];
    const subPath = match[2] || "";

    if (subPath === "/export" && request.method === "GET") {
      const buffer = generateExcelReport(hackathonId);
      return new Response(buffer as any, {
        headers: {
          "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "content-disposition": `attachment; filename="${hackathonId}-report.xlsx"`,
        },
      });
    }

    if (subPath === "/publish" && request.method === "POST") {
      const user = getAuthUserFromRequest(request);
      const updated = updateHackathonStatus(hackathonId, "PUBLISHED", {
        name: user?.name || "Organizer",
        role: user?.role || "organizer",
      });
      return new Response(JSON.stringify({ success: true, hackathon: updated }), {
        headers: { "content-type": "application/json" },
      });
    }

    if (subPath === "/status" && request.method === "POST") {
      const user = getAuthUserFromRequest(request);
      const body = (await request.json()) as any;
      const updated = updateHackathonStatus(hackathonId, body?.status || "LIVE", {
        name: user?.name || "Organizer",
        role: user?.role || "organizer",
      });
      if (!updated) {
        return new Response(JSON.stringify({ error: "Hackathon not found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true, hackathon: updated }), {
        headers: { "content-type": "application/json" },
      });
    }

    // Serve uploaded problem file
    const fileMatch = subPath.match(/^\/files\/([^/]+)$/);
    if (fileMatch && fileMatch[1] && request.method === "GET") {
      const storedFilename = fileMatch[1];
      const { filePath, exists } = getUploadedProblemFile(storedFilename);
      if (!exists) {
        return new Response(JSON.stringify({ error: "File not found" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      }
      const data = fs.readFileSync(filePath);
      return new Response(data, {
        headers: {
          "content-type": "application/octet-stream",
          "content-disposition": `inline; filename="${storedFilename}"`,
        },
      });
    }

    // Upload problem original file
    if (subPath === "/upload-problem-file" && request.method === "POST") {
      const user = getAuthUserFromRequest(request);
      try {
        const body = (await request.json()) as any;
        const fileMeta = saveUploadedProblemFile(
          hackathonId,
          body.filename,
          body.fileType,
          body.base64,
        );
        recordAuditLog(
          hackathonId,
          user?.name || "Organizer",
          user?.role || "organizer",
          "PROBLEM_FILE_UPLOADED",
          `Original file "${body.filename}" (${fileMeta.size} bytes) uploaded.`,
        );
        return new Response(JSON.stringify({ success: true, fileMeta }), {
          headers: { "content-type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    if (subPath === "/participations" && request.method === "GET") {
      const list = listParticipations(hackathonId);
      return new Response(JSON.stringify(list), {
        headers: { "content-type": "application/json" },
      });
    }

    if (subPath === "/participations/start" && request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        const result = startParticipation(hackathonId, body);
        return new Response(JSON.stringify({ success: true, ...result }), {
          headers: { "content-type": "application/json" },
        });
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err.message || "Failed to start participation" }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
      }
    }

    if (subPath === "/teams") {
      if (request.method === "GET") {
        return new Response(JSON.stringify(listTeams(hackathonId)), {
          headers: { "content-type": "application/json" },
        });
      }
      if (request.method === "POST") {
        try {
          const body = (await request.json()) as any;
          return new Response(
            JSON.stringify({ success: true, team: createTeam(hackathonId, body) }),
            {
              headers: { "content-type": "application/json" },
            },
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: err.message || "Failed to create team" }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }
      }
    }

    if (subPath === "/submissions") {
      if (request.method === "GET") {
        return new Response(JSON.stringify(listSubmissions(hackathonId)), {
          headers: { "content-type": "application/json" },
        });
      }
      if (request.method === "POST") {
        try {
          const body = (await request.json()) as any;
          const result = createOrUpdateSubmission(hackathonId, body);
          return new Response(JSON.stringify({ success: true, ...result }), {
            headers: { "content-type": "application/json" },
          });
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: err.message || "Failed to submit project" }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }
      }
    }

    if (subPath === "/stats" && request.method === "GET") {
      return new Response(JSON.stringify(getHackathonStats(hackathonId)), {
        headers: { "content-type": "application/json" },
      });
    }

    if (subPath === "/audit" && request.method === "GET") {
      return new Response(JSON.stringify(getAuditLogs(hackathonId)), {
        headers: { "content-type": "application/json" },
      });
    }

    if (subPath === "" || subPath === "/") {
      if (request.method === "GET") {
        const h = getHackathon(hackathonId);
        if (!h) {
          return new Response(JSON.stringify({ error: "Hackathon not found" }), {
            status: 404,
          });
        }
        return new Response(JSON.stringify(h), {
          headers: { "content-type": "application/json" },
        });
      }

      if (request.method === "PUT" || request.method === "POST") {
        const user = getAuthUserFromRequest(request);
        const body = (await request.json()) as any;
        const saved = saveHackathon(body, {
          name: user?.name || "Organizer",
          role: user?.role || "organizer",
        });
        return new Response(JSON.stringify({ success: true, hackathon: saved }), {
          headers: { "content-type": "application/json" },
        });
      }

      if (request.method === "DELETE") {
        const user = getAuthUserFromRequest(request);
        const isPermanent = url.searchParams.get("permanent") !== "false";
        deleteHackathon(hackathonId, {
          permanent: isPermanent,
          actor: {
            name: user?.name || "Organizer",
            role: user?.role || "organizer",
          },
        });
        return new Response(
          JSON.stringify({
            success: true,
            message: isPermanent ? "Hackathon permanently deleted" : "Archived successfully",
          }),
          {
            headers: { "content-type": "application/json" },
          },
        );
      }
    }
  }

  return null;
}
