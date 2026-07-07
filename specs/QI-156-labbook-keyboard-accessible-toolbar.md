# QI-156 — Lab Book: keyboard-accessible toolbar & Take Snapshot button

**Date:** 2026-07-07
**Jira:** [QI-156](https://concord-consortium.atlassian.net/browse/QI-156)
**Branch:** `QI-156-labbook-keyboard-accessible-toolbar`
**WCAG:** 2.1.1 Keyboard (Level A) — with a related 2.4.7 Focus Visible fix
**Related stories:** QI-155 (drawing-tool interactive toolbar), QI-173 (drawing
actions), QI-174 (navigating objects within the drawing area)

## Background

As a keyboard or assistive-technology user, I need the Lab Book controls to be
fully operable without a mouse.

The actual drawing toolbar (select, free, shapes, stamp, **annotation**, trash)
is rendered by the shared `@concord-consortium/drawing-tool` library
(v2.4.0-pre.1 is installed), which already has the accessibility work done —
`<button>` elements with `aria-label`, `aria-pressed`, and `aria-expanded`. The
`annotation` tool is just another registered tool in that library, so its button
already gets the same accessible treatment. Most of the ticket's toolbar
acceptance criteria are therefore satisfied by QI-155 / the shared library.

This story covers the controls the **Lab Book itself adds** in its own React
code, which are not keyboard operable today.

## Scope

### 1. `UploadButton`: `<div>` → native `<button>` (core fix)

[packages/labbook/src/components/upload-button.tsx](../packages/labbook/src/components/upload-button.tsx)
currently renders a `<div onClick>`, which cannot receive keyboard focus or be
activated by Enter/Space. Convert it to a native `<button type="button">`. This
single change makes all three consumers keyboard operable:

- the **"Take Snapshot"** button
  ([take-snapshot.tsx](../packages/labbook/src/components/take-snapshot.tsx)) —
  the ticket's explicitly-called-out target (audit issue #93)
- the **"Upload Image"** button, shown when the entry already has an image
  ([runtime.tsx](../packages/labbook/src/components/runtime.tsx))
- the **Replace / Create** buttons inside the upload modal
  ([create-or-replace-image.tsx](../packages/labbook/src/components/create-or-replace-image.tsx))

Additional requirements:

- Drive the disabled state with the native `disabled` attribute. Today the
  component only applies a `disabled` CSS class while `onClick` still fires;
  the native attribute correctly blocks both mouse and keyboard activation and
  removes the button from the tab order when disabled.
- **Accessible name comes from the visible text children** (e.g. "Take
  Snapshot", "Replace Current Image"). Do **not** add an `aria-label` that
  differs from the visible text on these buttons — that would risk a WCAG 2.5.3
  (Label in Name) failure. The ticket's `aria-label` criterion targets icon-only
  toolbar buttons; these have visible text, so the visible text *is* the
  accessible name.

### 2. `upload-button.scss`: button reset + visible focus

[upload-button.scss](../packages/labbook/src/components/upload-button.scss) —
add `font-family: inherit;` and `cursor: pointer;` to neutralize default
`<button>` styling, and a `:focus-visible` outline so keyboard focus is visible.
The existing `.disabled` rule stays for the dimmed visual state, but disabling is
now driven by the real attribute.

### 3. Styled file input: visible focus (the "wrinkle")

[styled-file-input.tsx](../packages/helpers/src/components/styled-file-input.tsx)
already exposes a real `<input type="file">` positioned off-screen
(`left: -10000px`, **not** `display:none`), so it stays in the tab order and
Enter/Space already opens the OS file dialog — this satisfies 2.1.1. The gap is
that the visible focus ring lands on the off-screen input rather than the visible
`<label>`, so keyboard users can't *see* focus (2.4.7).

Fix: nest the `<input>` inside the `<label>` and add a `:focus-within` outline in
[styled-file-input.scss](../packages/helpers/src/components/styled-file-input.scss).
This benefits both Lab Book's Upload Image control and the media-library
drag-to-upload
([drag-to-upload.tsx](../packages/helpers/src/components/media-library/drag-to-upload.tsx)),
which is the other consumer of `StyledFileInput`.

### 4. Thumbnail delete button: accessible name

The delete/close button in
[thumbnail-wrapper.tsx](../packages/labbook/src/components/thumbnail-chooser/thumbnail-wrapper.tsx)
is already a native `<button>` but contains only an SVG, so screen readers
announce no name. Add an `aria-label` using the existing `translate` util so it
is announced (e.g. "Delete model").

### 5. Verify (no code change expected)

- **Annotation tool** button — rendered by the already-accessible shared
  `@concord-consortium/drawing-tool` library; confirm it is Tab-reachable and
  Enter/Space-activatable in the Lab Book context.
- **File input** upload — confirm Enter/Space opens the OS file dialog.

## Out of scope

- `aria-pressed` — there are no toggle buttons among the Lab-Book-added controls.
- `aria-expanded` / `aria-controls` — the Lab-Book-added buttons open a modal
  dialog, not an inline expandable options container. The drawing-tool palette
  buttons that need these are handled by the shared library / QI-155.
- Drawing actions (QI-173) and navigating objects within the drawing area
  (QI-174).

## Testing

TDD with the existing Jest + Testing-Library setup:

- `UploadButton` renders a native `<button>`, exposes its text as the accessible
  name, does not fire `onClick` when `disabled`, and activates via keyboard.
- Take Snapshot invokes its handler when activated by keyboard.
- The thumbnail delete button exposes an accessible name.

Manual keyboard verification in the running app for the annotation tool button
and the OS file dialog (items that are operable via native/shared-library
behavior and not unit-testable here).
