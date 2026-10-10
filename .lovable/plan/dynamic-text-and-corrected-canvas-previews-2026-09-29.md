# Dynamic text and corrected canvas previews

## What will change

- Extend each saved theme with three admin-positioned text areas: Full Name, Job Title / Role, and ID / Code.
- Add draggable, resizable text areas to the theme creator so administrators define placement on the uploaded template.
- Add profile-photo and text controls to the customization page; every change updates all three previews immediately.
- Show “Customizing: [Theme Title]” prominently at the top of the page.
- Render text into downloaded PNGs and live canvases, fitting long values within their defined areas.
- Remove preview letterboxing and ensure the background and clipped photo use consistent cover-cropping at each standard output ratio.

## Interface

- The customization page will use a compact form beside the previews on larger screens and above them on smaller screens.
- Existing themes without text positions will receive sensible default positions derived from the photo area, so they continue working.
- No animations or transition effects will be introduced.

## Technical details

- Store text coordinates as percentages on each theme, matching the existing photo-area coordinate system.
- Pass a typed text-value object through the canvas component into the renderer.
- Draw legible canvas text with responsive font sizing, clipping, ellipsis, and role-specific weight.
- Keep all processing in the browser and preserve the existing local theme storage behavior.
- Validate the creator, customization inputs, canvas dimensions, clipping, and downloads in desktop and mobile layouts.
