# Visual customizable text-field editor

## What will change
- Replace the three fixed text placements with a dynamic list of customizable fields.
- Add a Text Fields panel in the Admin Portal where an admin can add, rename, select, and remove fields such as Full Name, Job Title, and Employee ID.
- Keep every field visible on the template as a draggable, resizable box; selecting a box also selects its settings panel.
- Add controls per selected field for font size, hexadecimal color, left/center/right alignment, and normal/bold weight.
- Generate the shared-page form from the saved field list, with each input updating every live preview immediately.
- Render the configured text accurately in all downloaded ID Card, LinkedIn, and Instagram PNGs.

## Interface
- Add clear tabs for Photo and Text Fields in the template customization controls.
- The Text Fields tab will contain the field list, Add Text Field action, label input, color picker with editable hex value, font-size input, alignment control, weight control, and delete action.
- Use crisp borders and the existing neutral visual style, with no new animations.
- Preserve existing themes by converting their Full Name, Job Title, and ID / Code positions into the new field format when read.

## Data and rendering
- Store each field with a stable ID, label, percentage-based X/Y/width/height, font size, hex color, alignment, and weight in `Theme.text_fields`.
- Use a dynamic `Record<fieldId, value>` for preview and user-entered values instead of fixed property names.
- Scale the configured font size from the source-template coordinate system into each output canvas, reduce it only when necessary to fit, and apply the saved alignment, color, and weight.
- Keep the current photo clipping and background cover behavior unchanged.

## Persistence limitation
- Lovable Cloud activation was attempted but is currently blocked because the workspace has no remaining credits.
- Implement the complete feature against the existing browser storage now, including the `text_fields` data shape. Once credits are available, the same shape can be migrated to a JSON column in Lovable Cloud so links work across devices.

## Validation
- Verify adding, renaming, moving, resizing, styling, and deleting fields in the Admin Portal.
- Verify saved themes dynamically create matching user inputs and update all three previews.
- Verify high-resolution PNG exports contain the styled text and uploaded photo.
- Check desktop and narrow layouts and confirm no runtime or build errors.
