/**
 * scripts/verify-e2e.mjs
 * Automated End-to-End Test Suite for Framewise & Hackathons Engine
 * Part of GSD Milestone 1 / Phase 4 Verification
 */

import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_URL || "http://localhost:8080";
console.log(`\n======================================================`);
console.log(`  Framewise & Hackathons E2E Verification Suite`);
console.log(`  Target: ${BASE_URL}`);
console.log(`======================================================\n`);

let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
  totalTests++;
  process.stdout.write(`[TEST ${totalTests}] ${name} ... `);
  try {
    await fn();
    console.log(`\x1b[32mPASS\x1b[0m`);
    passedTests++;
  } catch (err) {
    console.log(`\x1b[31mFAIL\x1b[0m`);
    console.error(`  -> Error:`, err.message || err);
    throw err;
  }
}

async function main() {
  const testThemeId = `test_theme_${Date.now()}`;
  const testHackathonId = `test_hack_${Date.now()}`;
  const testPartId = `test_part_${Date.now()}`;

  // 1. Authoritative Server Time
  await runTest("Authoritative Server Time (/api/server-time)", async () => {
    const res = await fetch(`${BASE_URL}/api/server-time`);
    assert.equal(res.status, 200, "Server time endpoint should return 200");
    const data = await res.json();
    assert.ok(data.serverTime, "Should contain serverTime ISO string");
    assert.ok(typeof data.timestamp === "number", "Should contain timestamp number");
    const deltaMs = Math.abs(Date.now() - data.timestamp);
    assert.ok(deltaMs < 10000, `Timestamp skew too high (${deltaMs}ms)`);
  });

  // 1b. Google Authentication Endpoint (/api/auth/google)
  await runTest("Google Auth Verification (/api/auth/google)", async () => {
    // Construct valid Google ID Token structure (header.payload.sig)
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        email: "e2e.google.user@gmail.com",
        name: "E2E Google Tester",
        picture: "https://lh3.googleusercontent.com/test-pic.jpg",
        sub: "google_sub_e2e_12345",
      }),
    ).toString("base64url");
    const testGoogleJwt = `${header}.${payload}.mock_signature_bytes`;

    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential: testGoogleJwt,
        role: "organizer",
      }),
    });
    assert.equal(res.status, 200, "Google auth endpoint should return 200");
    const data = await res.json();
    assert.ok(data.success, "Google auth should return success: true");
    assert.equal(data.user.email, "e2e.google.user@gmail.com");
    assert.equal(data.user.name, "E2E Google Tester");
    assert.equal(data.user.picture, "https://lh3.googleusercontent.com/test-pic.jpg");
    assert.equal(data.user.role, "organizer");
    assert.ok(data.user.token, "User should receive active auth token");

    // Verify token works with /api/auth/me
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${data.user.token}` },
    });
    assert.equal(meRes.status, 200, "/api/auth/me should authenticate Google user");
    const meData = await meRes.json();
    assert.equal(meData.user.email, "e2e.google.user@gmail.com");

    // Invalid credential rejection
    const badRes = await fetch(`${BASE_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: "invalid_gibberish" }),
    });
    assert.equal(badRes.status, 400, "Should reject invalid Google credential with 400");
  });

  // 2. Themes Persistence & Percentage Coordinates
  await runTest("Theme Creation with Percentage Bounding Box (/api/themes)", async () => {
    const themePayload = {
      id: testThemeId,
      title: "Automated Test Theme",
      background_image_url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'/>",
      box_x: 25.5,
      box_y: 20.0,
      box_width: 50.0,
      box_height: 45.0,
      shape_type: "rectangle",
      template_width: 1000,
      template_height: 1000,
      created_at: new Date().toISOString(),
    };

    const res = await fetch(`${BASE_URL}/api/themes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(themePayload),
    });
    assert.equal(res.status, 200, "Theme creation should return 200");
    const result = await res.json();
    assert.equal(result.id, testThemeId, "Returned theme ID should match");
  });

  // 3. Theme Retrieval & Geometry Verification
  await runTest("Theme Retrieval & Geometry Verification (/api/themes/:id)", async () => {
    const res = await fetch(`${BASE_URL}/api/themes/${testThemeId}`);
    assert.equal(res.status, 200, "Theme get should return 200");
    const theme = await res.json();
    assert.equal(theme.id, testThemeId);
    assert.equal(theme.box_x, 25.5);
    assert.equal(theme.box_width, 50.0);
    assert.equal(theme.shape_type, "rectangle");
  });

  // 4. Cleanup Test Theme
  await runTest("Theme Deletion Cleanup (DELETE /api/themes/:id)", async () => {
    const res = await fetch(`${BASE_URL}/api/themes/${testThemeId}`, {
      method: "DELETE",
    });
    assert.equal(res.status, 200, "Theme deletion should return 200");
  });

  // 5. Hackathon List
  await runTest("Hackathons Listing (/api/hackathons)", async () => {
    const res = await fetch(`${BASE_URL}/api/hackathons`);
    assert.equal(res.status, 200, "Hackathon list should return 200");
    const list = await res.json();
    assert.ok(Array.isArray(list), "Response should be an array");
  });

  // 6. Hackathon Creation
  await runTest("Hackathon Creation with Problem Statement (/api/hackathons)", async () => {
    const hackathonPayload = {
      id: testHackathonId,
      name: "E2E Verification Hackathon",
      shortDescription: "Automated test sprint for systems verification",
      fullDescription: "Detailed hackathon instructions and rules for testing",
      organizerName: "Test Suite Orchestrator",
      organizerId: "org_test",
      venue: "Automated Runner",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      participationType: "both",
      minTeamSize: 1,
      maxTeamSize: 4,
      timerMode: "individual",
      globalStartTime: new Date().toISOString(),
      globalEndTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      individualDurationMinutes: 120, // 2 hours
      submissionPolicy: "allow_late",
      accessType: "public",
      status: "PUBLISHED",
      problemStatement: {
        title: "Automated Systems Optimization Challenge",
        content: "Build high-throughput event processing pipelines.",
        objective: "Handle 10,000 req/s reliably.",
      },
    };

    const res = await fetch(`${BASE_URL}/api/hackathons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hackathonPayload),
    });
    assert.equal(res.status, 200, "Hackathon create should return 200");
    const result = await res.json();
    assert.ok(result.success, "Should succeed");
    assert.equal(result.hackathon.id, testHackathonId);
  });

  // 7. Participant Registration & Authoritative Countdown Timer
  await runTest("Participant Start & Authoritative Timer (/participations/start)", async () => {
    const startPayload = {
      participantType: "individual",
      participantId: testPartId,
      participantName: "Alex Rivera Test",
      email: "alex.test@example.com",
    };

    const res = await fetch(`${BASE_URL}/api/hackathons/${testHackathonId}/participations/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(startPayload),
    });
    assert.equal(res.status, 200, "Participation start should return 200");
    const result = await res.json();
    assert.ok(result.success, "Should succeed");
    assert.ok(result.participation.startedAt, "Should have server-assigned startedAt");
    assert.ok(result.participation.deadlineAt, "Should have server-assigned deadlineAt");
    assert.equal(result.participation.status, "IN_PROGRESS");

    // Check individual duration calculation: deadline should be ~120 min from startedAt
    const startMs = Date.parse(result.participation.startedAt);
    const deadlineMs = Date.parse(result.participation.deadlineAt);
    const diffMinutes = Math.round((deadlineMs - startMs) / 60000);
    assert.equal(diffMinutes, 120, "Deadline must be exactly 120 minutes from start");
  });

  // 8. Project Submission & On-Time Verification
  await runTest("Project Submission & Status Tracking (/submissions)", async () => {
    // Fetch participation record to get participationId
    const partRes = await fetch(`${BASE_URL}/api/hackathons/${testHackathonId}/participations`);
    const participations = await partRes.json();
    const part = participations.find((p) => p.participantId === testPartId);
    assert.ok(part, "Participation record should exist");

    const submitPayload = {
      participationId: part.id,
      participantType: "individual",
      participantName: "Alex Rivera Test",
      projectTitle: "Resilient Streaming Worker",
      description: "Sub-50ms consensus engine built with TypeScript.",
      githubUrl: "https://github.com/framewise/resilient-worker",
      demoUrl: "https://resilient-worker.app",
    };

    const res = await fetch(`${BASE_URL}/api/hackathons/${testHackathonId}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitPayload),
    });
    assert.equal(res.status, 200, "Submission should return 200");
    const result = await res.json();
    assert.ok(result.success, "Should succeed");
    assert.equal(result.submission.status, "SUBMITTED", "On-time submission must have status SUBMITTED");
    assert.equal(result.submission.lateBySeconds, 0, "On-time submission must have 0 lateBySeconds");
  });

  // 9. Live Organizer Dashboard Statistics
  await runTest("Live Organizer Stats Calculation (/stats)", async () => {
    const res = await fetch(`${BASE_URL}/api/hackathons/${testHackathonId}/stats`);
    assert.equal(res.status, 200, "Stats endpoint should return 200");
    const stats = await res.json();
    assert.ok(stats.totalParticipants >= 1, "Should count at least 1 participant");
    assert.ok(stats.submitted >= 1, "Should count at least 1 submission");
  });

  // 10. SheetJS Excel Workbook Export
  await runTest("SheetJS Excel Workbook Export (/export)", async () => {
    const res = await fetch(`${BASE_URL}/api/hackathons/${testHackathonId}/export`);
    assert.equal(res.status, 200, "Excel export should return 200");
    const contentType = res.headers.get("content-type");
    assert.ok(
      contentType?.includes("spreadsheetml.sheet"),
      `Content-Type should be openxmlformats (.xlsx), got ${contentType}`,
    );

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // Standard ZIP / XLSX magic number: 0x50, 0x4B, 0x03, 0x04 ("PK\x03\x04")
    assert.equal(bytes[0], 0x50, "Magic byte 0 should be 'P'");
    assert.equal(bytes[1], 0x4b, "Magic byte 1 should be 'K'");
    assert.ok(bytes.length > 1000, `Excel file size should be substantial (>1KB), got ${bytes.length} bytes`);
  });

  // 11. Cleanup Test Hackathon
  await runTest("Cleanup Test Hackathon (DELETE /api/hackathons/:id)", async () => {
    const res = await fetch(`${BASE_URL}/api/hackathons/${testHackathonId}`, {
      method: "DELETE",
    });
    assert.equal(res.status, 200, "Hackathon deletion should return 200");

    // Also remove test files from data/hackathons directory
    try {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const dir = path.resolve(process.cwd(), "data", "hackathons");
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file.startsWith("test_hack_")) {
            fs.unlinkSync(path.join(dir, file));
          }
        }
      }
    } catch {}
  });

  console.log(`\n======================================================`);
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED EMPIRICALLY!`);
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error(`\n[FATAL] Test suite failed:`, err);
  process.exit(1);
});
