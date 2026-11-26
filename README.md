# 3d-room

Group Members: Savannah Lee, Samantha Oh, Nitya Shankar, and Jayden Salman

## About

3d-room helps people plan and style room layouts. The initial app follows the design reference preserved in `.agents/skills/room-design-flow/SKILL.md`: **Upload → Check walls → Furnish → Style → Share**, with a home page and saved-spaces library.

## Getting started

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Other commands:

```sh
npm run build    # Production assets in dist/
npm run preview  # Serve the production build locally
npm test         # Room-data and upload-validation tests
```

## Structure and conventions

- `src/main.jsx`: app shell, hash-based navigation, and shared room state.
- `src/screens/`: home, upload/scan entry, editor journey, and saved spaces.
- `src/components/`: reusable 2D preview and interactive 3D room.
- `src/assets/furniture.js`: independent Three.js model factories built from simple geometry.
- `src/room/furniture.js`: furniture catalog, labels, dimensions, and preview colors.
- `src/room/`: room defaults, validation, browser persistence, and Node tests.
- `src/styles.css`: responsive layout and shared visual styles.
- `public/`: reserved for static assets.

The initial stack is React and Vite, with plain CSS and JavaScript. Use two-space indentation, PascalCase component names, and descriptive camelCase names for room logic. The lockfile pins dependency resolution. Three.js renders the editor’s interactive 3D view, with OrbitControls for the camera.

## Current behavior and limits

Navigation supports browser Back/Forward and direct hash URLs. Room changes remain in memory across journey steps. Save space persists a room in localStorage; reopen it through My spaces after reloading. Starting a new space resets the active draft; unsaved drafts do not survive reloads. There are no accounts or cloud storage.

Floor-plan files are validated for JPG/PNG/PDF and a 10 MB limit. JPG/PNG uploads produce a compact image reference visible throughout the editor and included in local saves and JSON exports. Images are resized to at most 1600 pixels on their longest edge. PDFs retain only the filename; export a PDF page as an image for a visible reference. Files are not sent to a server or reconstructed automatically. Phone scanning and AI reconstruction are explicitly placeholders. The layout is an editable sample rectangle; door, window, and individual wall editing are future work.

Users can set dimensions, add furniture, adjust positions with sliders, rotate/remove pieces, and change wall/floor colors. The editor pairs a CSS top-down view with a Three.js room containing a floor and four 2.7 m walls. Interior-facing walls reveal the room when viewed from outside. Drag to orbit, scroll to zoom, and right-drag to pan; touch supports one-finger orbit and two-finger zoom/pan. Zoom buttons and Reset view are also available. Furniture uses seven reusable procedural models with fixed dimensions in metres: bed, couch, table, chair, dresser, bookshelf, and potted plant. Home and library retain lightweight illustrative previews. Basic fit warnings flag overlapping footprints and furniture extending beyond room boundaries; placement remains unrestricted. Share offers a working JSON download; public sharing and image export are not implemented. Google Fonts are optional remote styles with local font fallbacks.

## Verification

`npm test` checks dimension bounds, upload validation, save/reopen round trips, updates without duplicates, and malformed storage handling. Run `npm run build` and `git diff --check` before submitting changes.

Manual visual and interaction checks:

1. Open Home, then Create a space; try both upload and phone-scan tabs.
2. Attach a supported file, check invalid-file feedback, and continue with the labeled sample.
3. Move through all five steps, change dimensions, add/move/rotate/remove furniture, and apply colors. Revisit earlier steps and verify edits remain.
4. Switch between 2D and room views in Furnish. Orbit, zoom, pan, and reset the 3D camera. Confirm walls, floor colors, and furniture match your edits. Resize the window and check mobile touch controls and keyboard-accessible camera buttons.
5. Save a space, visit My spaces, reload, and reopen it. Verify dimensions, furniture, and colors match.
6. Download JSON from Share and inspect the room data. Check browser Back/Forward navigation.

Include screenshots or recordings when submitting visual changes for review.

## Furniture library verification

In Furnish, add each of the seven furniture types and inspect its geometry in 3D. Switch to 2D, move and rotate items, then save and reopen the room. Verify the furniture retains its size when changing room dimensions. Automated tests cover model bounds, floor alignment, and persistence of all catalog items. Models are generated locally with no external asset downloads.

## Saved-spaces library

My spaces displays saved projects as preview cards with room names, dimensions, furniture counts, and saved dates. Search by name or sort by most recently saved/name; Open space resumes editing. Create a space is available in the header and grid. An empty library explains how to create and save a first room, and unmatched searches offer Clear search. Projects remain browser-local.

Manual checks: save two rooms with different names; verify previews and dates, search and clear, switch sort order, and reopen each room. Check the empty state in a browser with no saved projects, then inspect the layout at mobile and desktop widths.

## Shared room data

The [version 1 room-data contract](docs/room-data.md) defines room dimensions, furniture positions and rotations, coordinate conversions, validation, and migration of existing saves. Dimensions use metres; furniture anchors use floor-plan percentages and rotations use clockwise degrees. Use the shared factories and helpers in `src/room/schema.js` and `src/room/model.js` when adding features.

## Furniture selection and placement

In Furnish, select a catalog card and use Add to room. New pieces start centered and are automatically selected; pieces larger than the room are disabled. Select placed objects by clicking in 2D/3D or using the accessible room list. The selected item has a visible outline and position, rotation, and removal controls. Camera position is retained during furniture edits. Fit warnings flag overlaps without preventing placement.

Manual checks: add two copies of a piece, select each in both views and the room list, move/rotate/remove the selected instance, and verify the other remains unchanged. Orbit the camera and confirm dragging does not select an object; save and reopen to check placements persist. Check keyboard selection in the catalog, room list, and 2D view. Test a small room to verify oversized pieces cannot be added.

## Direct furniture controls

In Furnish, choose Move and drag any furniture piece in 2D or 3D to reposition it. Choose Rotate and drag a piece horizontally to turn it (two pixels per degree); hold Shift for 15° snapping. Dragging preserves the original grab offset. Release to finish. Pointer cancellation restores the original transform. Position anchors stay within 0–100%; furniture footprints can still overlap or cross walls.

In 3D, dragging furniture pauses orbit controls. Drag empty space to orbit, or choose Camera to orbit even when starting over furniture; scrolling zooms and right-dragging pans. Camera mode does not move furniture in 2D. Sidebar sliders and rotation buttons remain available.

Manual checks: drag and rotate each furniture type in both views; release outside the canvas; test Shift snapping in both directions; verify camera controls resume after release. Switch views and save/reopen to confirm transforms match. Test using mouse and trackpad. Automated tests cover coordinate bounds, rotation normalization/snapping, and save/reopen transforms; browser gestures require manual verification.

## Upload references

Upload a JPG or PNG, then continue to Check walls: the image appears above the workspace with Show/Hide controls. It remains available through Furnish, Style, and Share. Save and reopen a space to retain the reference. Return to Upload to replace or remove it. Existing rooms without images still load normally. Browser storage limits can prevent saving multiple large references; the save error retains the active room and JSON download remains available.

Manual checks: upload portrait and landscape images; navigate every editor step; hide/show the reference; save/reload/reopen; replace and remove the image. Test an unreadable image, a file over 10 MB, and a PDF. Select two images quickly to verify the newest selection wins. Image decoding and browser rendering still need manual verification.

## Room dimensions

Check walls offers Compact room (3 × 3 m), Bedroom (4 × 3.5 m), Living room (5 × 4 m), and Open space (7 × 5 m) presets. Presets apply immediately. Custom width, length, and wall height accept decimal metres from 1–30; Apply dimensions validates all fields before updating the room. Length maps to the existing `depth` field in saved data. Both 2D and 3D are available during layout review. Resizing updates floor area, wall/floor geometry, and camera framing, while preserving furniture sizes, relative anchors, and colors.

Manual checks: apply each preset; enter decimal dimensions; clear a field and enter out-of-range values to check errors; switch between 2D/3D; inspect floor/wall proportions and camera framing; save and reopen. Unapplied custom entries leave the room at its last applied dimensions. Check furniture placement after shrinking a furnished room.

## Saving and reopening projects

Use Save space in the editor (or Save to my spaces in Share) to persist applied dimensions, furniture IDs/types/positions/rotations, finishes, name, and reference image in this browser. The editor confirms successful writes and shows the last-saved time. Repeated saves update the same project ID.

Open My spaces and select Open space to load the latest stored project into Furnish. The restored layout is independent of the saved snapshot: further edits require another save. The library refreshes on entry and when another tab changes browser storage. Reload the page and reopen a card to continue working; unsaved drafts are not restored automatically. Data is specific to this browser and site address, with no account/cloud sync.

Save errors retain the current edits and do not report success. Unreadable library data blocks writes rather than overwriting the library; unknown records are retained when saving other projects. JSON export on Share is available if browser storage is full or inaccessible.

Manual verification: create two rooms with different dimensions and furniture arrangements, save each, reload, and reopen their cards. Verify width/length/height, positions, rotations, colors, and image references. Change one room, save again, and verify its card updates without a duplicate or changes to the other room. Reopen without saving an edit to verify the prior snapshot remains intact.

## Editor actions

The editor header provides Back to My spaces, Save space, and Save & return to library. Save & return navigates only after a successful write. Back returns without saving. Save feedback appears above the workspace.

In Furnish, Add object focuses the furniture catalog. The selected-object toolbar shows the current piece and angle, with Rotate left/right (45°) and Delete object actions; these are disabled until an object is selected. The sidebar also offers a continuous rotation slider and explicit delete button. Undo delete restores the most recently deleted item and its position during the current editor visit. Desktop layouts keep the workspace visible while scrolling through controls.

Manual checks: add a piece using the shortcut, select it in the room, rotate in both directions, delete and undo, and verify both views agree. Confirm disabled controls when nothing is selected. Save & return, reopen the project, and verify the changes. Test failed saving to ensure navigation stays in the editor. Check mobile layout and keyboard focus on the Add object shortcut.

## Upload verification

The picker and drag-and-drop accept one JPG, PNG, or PDF up to and including 10 MB. Empty, unsupported, oversized, and unreadable images show an error while keeping the last successful attachment. Images can be removed and selected again. PDF attachments retain only their filename and can be removed; PDF rendering and content validation are not implemented.

Run the browser regression suite after installing dependencies:

```sh
npx playwright install chromium  # Once per machine
npm run test:e2e                # Starts its own Vite server on port 4175
```

`tests/upload.spec.js` verifies real PNG/JPEG previews, same-file reselection, editor continuity, PDF replacement/removal, drag-and-drop, error recovery, and competing selections. `npm test` also checks the exact size boundary and empty-file rejection.

Manual checks: select and drop a floor plan; confirm its preview and filename, hide/show/remove the image, then select it again. Try TXT/SVG, an empty image, a corrupt image, and a file over 10 MB; verify the error and that the previous preview remains. Cancel the picker and confirm the attachment remains. Drop two files and verify the single-file error. Use Tab to focus the picker and Enter to open it; repeat at a mobile viewport.

## Room controls verification

`npm run test:e2e` also runs `tests/room-controls.spec.js` in Chromium with real WebGL rendering. It covers orbit/pan/wheel and button zoom, reset, 3D furniture movement, Shift-snapped rotation, independent instances, deletion/undo, save/reopen, all seven furniture types, and repeated edits. Interrupted drags restore the starting transform; unrelated pointers do not control an active furniture drag. Camera mode leaves selection intact. Disposed 3D views release their WebGL contexts.

Manual checks: add two pieces, move them apart, select each in 2D/3D, rotate with dragging and the buttons, and delete/undo. Drag empty space to orbit, use Camera mode over furniture, right-drag to pan, scroll or use the zoom buttons, then Reset view. Save and reopen to verify both pieces. On a touch device, check one-finger manipulation and Camera mode pinch/pan. Placement still allows overlaps and footprints extending beyond walls, with basic fit warnings.

## Save/reopen regression checks

`tests/saved-spaces.spec.js` verifies two independent projects through the UI: exact fractional furniture positions and rotations, room dimensions and colors, reload/reopen, updating without duplicates, and discarding unsaved edits when reopening a saved snapshot. It also simulates full browser storage, damaged saved data, and a removed project. Failed saves retain the current draft and previous stored layout; Save & return stays in the editor until saving succeeds. An unreadable library displays an explicit error instead of the first-project empty state. Run with `npm run test:e2e -- tests/saved-spaces.spec.js`.

Saving is explicit and browser-local. Use the same browser profile and site address to reopen projects; clearing site data removes local saves. Unsaved drafts do not survive reloads.

## Complete project journey

Start with **Create a space** on Home, upload an image reference, then use the Continue buttons through **Check walls → Furnish → Style → Share**. Apply room measurements, arrange furniture, and choose colors. On Share, use **Save to my spaces**, then **View saved spaces**; after reloading, Open restores the project in Furnish with its reference and arrangement. JSON download exports the same project. The step links and browser Back/Forward retain the current draft during the session.

`npm run test:e2e -- tests/project-flow.spec.js` exercises this entire journey at desktop (1440 px) and mobile (390 px) widths. It verifies the current-step indicator, uploaded reference across screens and reloads, exact furniture transforms, dimensions/colors, JSON export, and starting a clean project without changing the saved one. A separate regression checks that starting a new project during image preparation cancels the old upload's result.


## Furniture fit warnings

The editor checks all placed furniture after adding, moving, rotating, deleting, resizing the room, or reopening a save. Feedback identifies pieces using their names and room-list numbers. Rotated rectangular footprints detect wall crossings and overlaps; exact edge contact is allowed. Ceiling-height warnings also catch tall pieces after room resizing. The same feedback appears in layout review, furnishing, styling, and sharing.

These are approximate footprint checks, including for rounded or irregular furniture. They do not model door swings, walking clearance, or usable space beneath tables. Warnings do not block editing or saving and do not reposition furniture. During a 3D drag they update when the drag ends; sliders and 2D dragging update immediately.

`npm test` covers rotated corners, containment, edge contact, separated rotated pieces, and room resizing. `npm run test:e2e -- tests/furniture-fit.spec.js` verifies warnings appear and clear in the editor, survive save/reopen, and remain readable at mobile width.

## Interaction regression checks

`tests/bug-regressions.spec.js` covers canvas stability while renaming/saving, WebGL context loss and restoration, and arranging/saving through 2D when WebGL is unavailable. A graphics interruption displays recovery guidance and cancels any uncommitted 3D furniture drag. The 3D controls return when the browser restores graphics; 2D remains available throughout. Renaming and saving retain the current canvas and camera.

## Team demo: Sage & Oak

On Home, choose **Open sample room · furnished living + dining**. This opens a fresh, editable draft in Furnish. The sample is a 6 × 5 m (30 m²) room with 2.7 m walls, pale sage paint, and an oak-toned floor. Eight pieces form a conversation area and a separate two-seat dining area: couch, angled reading chair, plant, bookshelf, sideboard (dresser model), dining table, and two dining chairs. All pieces fit inside the room without overlapping. Clearances are illustrative, not an accessibility or building-code assessment; doors/windows are not modeled.

The reproducible fixture is `src/assets/sample-room.json`; `src/room/sample.js` gives each opened copy new project/furniture IDs. Opening the sample never writes to the library automatically. Save it explicitly. Reopening the Home sample resets the arrangement in a new draft and leaves saved copies untouched. The default Create a space flow still starts empty.

Suggested final demo:

1. Open the sample from Home. Orbit the room and zoom in once; switch to 2D to show the two furniture groups.
2. Select Chair 2 (the reading chair), move it slightly or adjust its rotation, then show the same change in 3D.
3. Move a piece past a wall to demonstrate fit warnings, then restore it or reopen the sample for a clean take.
4. Visit Style, adjust a finish, then continue to Share. Save and download the JSON.
5. Open My spaces, reload, and reopen the saved sample to demonstrate persistence.

Run `npm run test:e2e -- tests/sample-room.spec.js` to verify the complete sample and capture 2D/3D screenshots under `test-results/`. Unit tests check validity, all eight pieces, fit, fresh IDs, and exact save/reopen transforms. To reset for another take, return Home and open the sample again; save with a distinct name if retaining multiple takes.

## Animated home preview

The Home hero loops through Plan, Furnish, Arrange, and Style every 3.5 seconds using the local room preview. Pause/play and individual scene buttons control playback. Reduced-motion preferences disable autoplay and transitions; manual scene selection remains available. The animation uses separate demo data and never changes the current project. Verify with `npm run test:e2e -- tests/home-demo.spec.js`.
