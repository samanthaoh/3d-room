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

Floor-plan files are validated for JPG/PNG/PDF and a 10 MB limit. Only the filename is retained; file contents are not uploaded, stored, or reconstructed. Phone scanning and AI reconstruction are explicitly placeholders. The layout is an editable sample rectangle; door, window, and individual wall editing are future work.

Users can set dimensions, add furniture, adjust positions with sliders, rotate/remove pieces, and change wall/floor colors. The editor pairs a CSS top-down view with a Three.js room containing a floor and four 2.7 m walls. Interior-facing walls reveal the room when viewed from outside. Drag to orbit, scroll to zoom, and right-drag to pan; touch supports one-finger orbit and two-finger zoom/pan. Zoom buttons and Reset view are also available. Furniture uses seven reusable procedural models with fixed dimensions in metres: bed, couch, table, chair, dresser, bookshelf, and potted plant. Home and library retain lightweight illustrative previews. Collision detection is not implemented; furniture can overlap or extend beyond walls. Share offers a working JSON download; public sharing and image export are not implemented. Google Fonts are optional remote styles with local font fallbacks.

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
