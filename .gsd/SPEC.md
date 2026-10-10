---
status: FINALIZED
created: 2026-10-10T18:50:00Z
finalized: 2026-10-10T18:50:00Z
---

# SPEC.md — Project Specification

## Vision

Framewise is an integrated dual-purpose engineering platform: it provides an automated photo alignment and template stamping studio for event badges and social cards, paired with an authoritative live hackathon management and real-time project evaluation suite.

---

## Goals

1. **Auto Photo Alignment (Framewise)** — Allow admins to design templates once with percentage-based bounding boxes and styled dynamic text fields, enabling users to upload portraits that automatically clip, scale, and export into CR80 ID Card, LinkedIn Banner, and Instagram Square ratios without edge-cropping.
2. **Authoritative Hackathon Engine** — Provide full lifecycle hackathon operations with anti-cheat authoritative server timers (global and individual participant countdowns), problem statement distribution with attachment downloads, and team/individual registration.
3. **Submission Verification & Late Penalty** — Enable participants to submit verified GitHub repositories and live demo links, automatically determining on-time vs late submissions with calculated delay metrics.
4. **Organizer Command Center** — Provide live 5-second polling monitors, participant rosters, submission reviews, audit logging, and one-click SheetJS Excel (`.xlsx`) report exports.

---

## Non-Goals (Out of Scope)

- External third-party payment gateways (free registration model currently).
- In-browser code execution sandbox (participants host code on GitHub).
- AI automated code grading (evaluations are handled by human organizers/judges).

---

## Users

**1. Event Organizers / Admins:**
- Create and manage custom photo badge templates and hackathons.
- Monitor live event participation, timer countdowns, and audit logs.
- Review submitted repositories and export official Excel reports.

**2. Participants / Students:**
- Customize and download high-resolution event badges for print and social media.
- Register for hackathons individually or as teams.
- Access official problem statements, track countdown timers, and submit projects.

---

## Constraints

### Technical
- **Zero Edge-Cropping:** Canvas composite rendering must preserve 100% of the template background artwork using contain/cover algorithms with blurred ambient backdrops.
- **Authoritative Timing:** Deadlines must synchronize with the server time (`/api/server-time`) to prevent local system clock tampering.
- **Local Persistence:** All theme templates, hackathon records, problem files, and user accounts must persist safely on the filesystem under `data/`.

---

## Success Criteria

- [x] Template creator supports rectangular and circular bounding boxes and dynamic text fields.
- [x] Multi-ratio canvas exports ID Card (1275x2025), LinkedIn (1910x1000), and Instagram (1500x1500) PNGs.
- [x] Hackathon wizard creates and edits events with draft, publish, and live states.
- [x] Server-synchronized timers track individual participant duration and global event windows.
- [x] Submissions validate GitHub URLs and log late-submission penalties.
- [x] Organizer live dashboard updates stats and streams complete Excel (.xlsx) reports.

---
_Last updated: 2026-10-10_
