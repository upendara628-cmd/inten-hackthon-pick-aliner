# inten-hackthon-pick-aliner

Framewise: Production-grade photo alignment engine and synchronized live hackathon competition platform.

The application has two roles: Admin and User.

---

### DESIGN & UI RULES (CRITICAL)

- The app MUST look clean, modern, and handcrafted by a human developer. Do NOT use generic AI aesthetic cliches (no floating blurred glows, no neon gradients, no overly rounded cards).

- STRICT NO ANIMATION RULE: Do not add any transition animations, fade-ins, slide-ins, page transitions, or hover scale effects.

- ALLOWED ANIMATIONS: ONLY functional loading spinners (e.g. Lucide Loader2 spin) and simple visual focus/selection borders (e.g. border-blue-600 on click).

- Theme colors: Neutral slate/zinc palette with standard high-contrast text and crisp 1px borders (`border-slate-200` / `border-slate-800`).

---

### CORE APP ARCHITECTURE & ROUTES

1. `/admin` - Admin Dashboard & Theme Creator

2. `/admin/themes` - Admin List of Created Themes & Shareable Links

3. `/d/:themeId` - Public User Customizer Page

---

### DETAILED FEATURE REQUIREMENTS

#### 1. ADMIN THEME CREATOR CREATION (`/admin`)

- **Single Template Upload:** Admin uploads a single base background image (theme/template).

- **Auto-Resize Engine:** Automatically fit and render the uploaded theme image into three standard canvas containers side-by-side or tabbed:

  1. ID Card Ratio (Vertical 2.125 : 3.375 or Standard CR80)

  2. LinkedIn Post / Banner Ratio (1.91 : 1)

  3. Instagram Post Ratio (1 : 1 or 4:5)

- **Visual Bounding Box Canvas Editor:**

  - Render an interactive HTML5 Canvas (or Fabric.js overlay) over the background template image.

  - Allow Admin to click and drag to draw/position a semi-transparent rectangular or circular bounding box placeholder indicating where the user's photo should be placed.

  - Allow Admin to drag handles to resize and reposition the placeholder box on the template.

- **Publish & Link Generation:**

  - Admin enters a Theme Name and clicks "Save & Generate Link".

  - The theme image and bounding box coordinates (percentage-based X, Y, Width, Height relative to template dimensions) are stored in Supabase.

  - Generates a unique shareable link: `https://[your-app-domain]/d/[themeId]`.

  - Admin can manage all uploaded themes at `/admin/themes` with quick "Copy Share Link" buttons.

#### 2. USER EXPERIENCE PAGE (`/d/:themeId`)

- The user opens the shareable link.

- **Single Photo Upload:** User uploads their photo once.

- **Auto-Alignment System:**

  - The uploaded photo automatically places and clips itself inside the precise bounding box defined by the admin on the background template.

  - The photo scales automatically to cover/fit inside the bounding box without distorting its aspect ratio.

- **Multi-Ratio Preview Grid:**

  - Instantly shows rendered previews for all three output ratios: ID Card, LinkedIn, and Instagram.

- **Instant Export / Download:**

  - Provide clear "Download PNG" buttons for each aspect ratio canvas output.

  - Generating high-resolution canvas output for download without loss of background or user photo clarity.

---

### SUPABASE DATABASE SCHEMA

Generate and run migrations/queries for:

`themes` table:

- `id` (uuid, primary key)

- `title` (text)

- `background_image_url` (text)

- `box_x` (float - percentage X coordinate)

- `box_y` (float - percentage Y coordinate)

- `box_width` (float - percentage width)

- `box_height` (float - percentage height)

- `shape_type` (text - 'rectangle' or 'circle')

- `created_at` (timestamp)

Include Supabase Storage bucket setup for `theme-assets` and `user-uploads`.

---

### STEP-BY-STEP UI WORKFLOW TO IMPLEMENT

- Header: Clean top navbar with "Admin Portal" and "Theme Gallery".

- Admin Screen: Left side has File Upload input and Theme Title field. Right side has interactive Canvas view with bounding box controls.

- User Screen: Minimalistic center screen with single "Upload Photo" drag-and-drop zone. Below it, side-by-side high-resolution Canvas previews with individual "Download PNG" buttons.

- Show standard loading spinner text when images are processing or uploading.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pic-aligner.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5c7c5e23-451f-58b2-86db-4a4965630f34).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
