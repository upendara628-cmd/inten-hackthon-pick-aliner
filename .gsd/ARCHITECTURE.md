# Architecture

> Generated for Framewise & Hackathon Arena

## Overview

Framewise is an integrated web platform combining an **Auto Photo-Alignment & Template Engine** with a **Real-Time Hackathon Management & Live Evaluation Platform**.

```
┌─────────────────────────────────────────────────────────────────┐
│                       Browser / Client                          │
│   (React 19 + TanStack Router + HTML5 Canvas + Tailwind CSS)    │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP / JSON API
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer & Server                           │
│     (Vite Middleware Dev / TanStack Start Nitro Server)         │
│   - /api/server-time     - /api/themes        - /api/auth       │
│   - /api/hackathons      - /api/submissions   - /api/export     │
└───────────────────────────────┬─────────────────────────────────┘
                                │ File I/O
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Local Storage Engine (data/)                  │
│   - data/themes/         - data/hackathons/                     │
│   - data/users.json      - data/hackathons/files/               │
└─────────────────────────────────────────────────────────────────┘
```

## System Components

### 1. Photo Stamping & Template Engine (Framewise)
- **Purpose:** Admin creates badge/ID card/post templates with customizable portrait bounding boxes and styled dynamic text fields; users drop in photos that clip and fit automatically for 3 ratios.
- **Location:** `src/components/box-editor.tsx`, `src/components/ratio-canvas.tsx`, `src/lib/render.ts`, `src/lib/store.ts`
- **Output Ratios:**
  - CR80 ID Card (2.125 : 3.375) -> 1275 x 2025 px
  - LinkedIn Banner (1.91 : 1) -> 1910 x 1000 px
  - Instagram Square (1 : 1) -> 1500 x 1500 px

### 2. Hackathon Arena & Participant Flow
- **Purpose:** Hackathon discovery, registration, timer countdown, authoritative problem statement viewer, and submission portal.
- **Location:** `src/routes/hackathons.*.tsx`, `src/components/hackathon-timer.tsx`, `src/lib/hackathon-api.ts`
- **Authoritative Timing:** Synchronized against `/api/server-time` to prevent client clock manipulation. Supports both Global Event and Individual Participant timers.

### 3. Organizer Console & Live Dashboard
- **Purpose:** Hackathon wizard creation, status progression (Draft -> Published -> Live -> Ended -> Archived), live participant progress monitoring with 5s polling, audit logging, and SheetJS Excel exports.
- **Location:** `src/routes/admin.hackathons.*.tsx`, `src/lib/server-hackathons.ts`

### 4. Authentication & Role Switcher
- **Purpose:** Dual-role security model (`organizer` vs `participant`) with session persistence and one-click role switching for testing.
- **Location:** `src/lib/auth-context.tsx`, `src/components/auth-modal.tsx`, `src/lib/server-auth.ts`

## Data Flow

1. **Theme Creation:** Admin uploads template -> sets bounding box & text fields -> saved to `/api/themes` as percentage coordinates.
2. **User Customization:** User visits `/d/:themeId` -> uploads portrait -> client canvas performs contain/cover math -> instant high-res PNG download.
3. **Hackathon Participation:** Participant registers -> starts event -> server registers `startedAt` & `deadlineAt` -> participant solves problem -> submits GitHub repository -> server validates status (`SUBMITTED` or `LATE`).
4. **Organizer Audit & Export:** Organizer views live statistics -> triggers Excel export -> server streams `.xlsx` workbook via SheetJS.

---
_Last updated: 2026-10-10_
