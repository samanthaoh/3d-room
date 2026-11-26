# Room data contract · version 1

Use this structure for editor state, browser saves, and JSON exports. Runtime validation and JSDoc types live in `src/room/schema.js`; defaults and persistence live in `src/room/model.js`.

```json
{
  "schemaVersion": 1,
  "id": "room-example",
  "name": "Living room",
  "width": 5,
  "depth": 4,
  "height": 2.7,
  "wallColor": "#e5e9dc",
  "floorColor": "#d4b48c",
  "source": "Demo layout",
  "furniture": [
    { "id": "sofa-1", "type": "sofa", "x": 20, "y": 25, "rotation": 90 }
  ],
  "updatedAt": "2026-11-13T12:00:00.000Z"
}
```

## Fields and units

| Field | Meaning |
| --- | --- |
| `schemaVersion` | Integer `1`. Increment for breaking changes and add an explicit migration. |
| `id` | Nonempty stable project ID, generated with `crypto.randomUUID()` for new rooms. |
| `name` | Display name, up to 80 characters. Empty names display as Untitled space. |
| `width`, `depth`, `height` | Finite numbers in metres, each from 1 through 30. Default height is 2.7. |
| `wallColor`, `floorColor` | Six-digit `#RRGGBB` strings. |
| `source` | Filename or `Demo layout`; no binary upload data. |
| `referenceImage` | Optional compact PNG/JPEG base64 data URL (up to 1,500,000 characters), or `null`. Included in browser saves and JSON exports; absence is valid for older rooms. |
| `furniture` | Array of independently positioned furniture instances. |
| `updatedAt` | Optional until saved, then a canonical UTC ISO timestamp. |

Each furniture instance has a nonempty unique `id` within its room, a catalog `type`, numeric `x` and `y` from 0 through 100, and numeric `rotation` from 0 inclusive to 360 exclusive. Multiple instances may share a type. Supported types: `bed`, `sofa` (Couch), `table`, `chair`, `dresser`, `bookshelf`, `plant`.

## Position and rotation convention

To preserve existing projects, `x` and `y` are **percentages of the floor plan**, not metres. The origin is the upper-left floor corner. X increases right; Y increases down the plan (toward the front of the 3D room). They locate the upper-left corner of the **unrotated** furniture footprint. Rotation is clockwise in degrees around its center. Positive 90° turns a chair facing the top of the plan to face right.

Furniture width/depth/height come from `src/room/furniture.js` in metres. Do not duplicate them in saved instances. Changing room dimensions preserves percentage anchors and fixed furniture sizes. Moving or rotating does not enforce containment or prevent collisions; even valid data may extend beyond a wall. The editor sliders expose the full 0–100% position range. New pieces are centered and must fit the unrotated room dimensions; subsequent movement and rotation do not enforce containment.

Three.js uses a centered floor origin, X right, Y up, and Z toward the front. Use `furnitureTransform(room, item)` instead of implementing another conversion:

- `worldX = room.width × (item.x / 100 − 0.5) + asset.width / 2`
- `worldY = 0` (models rest on the floor)
- `worldZ = room.depth × (item.y / 100 − 0.5) + asset.depth / 2`
- `rotationY = −item.rotation × π / 180`

The 2D preview uses X/Y as CSS left/top percentages and rotates around the footprint center. For the example above, the couch center is `(-0.5, 0, -0.55)` metres and its Three.js rotation is `−π/2`.

## Persistence and compatibility

The localStorage key `3d-room.spaces` holds a JSON array of rooms. Saving validates the room, sets `updatedAt`, and replaces the matching project ID or prepends a new project. Invalid saves throw before writing. JSON download uses the same room shape; unsaved exports may omit `updatedAt`.

`normalizeRoom` upgrades unversioned saves in memory by adding version 1 and a default height. Existing positions and rotations are preserved. Reading does not rewrite storage; the upgraded shape is written when the user saves. Invalid records and unsupported versions are skipped on read without deleting the underlying storage. Malformed JSON yields an empty library. The current app has no import UI or cloud storage.

Use `createRoom()` and `createFurnitureItem(type)` for new objects, `normalizeRotation()` for rotation changes, and `normalizeRoom()` at data boundaries. Do not persist Three.js objects, CSS styles, camera state, or original uploaded files. A compact image copy is allowed in `referenceImage`. New coordinate systems, catalog dimension changes, and renaming catalog IDs require an explicit compatibility decision.

## Dimension controls

The UI calls `depth` **Length**. Presets and custom entries use `parseDimensions` in `src/room/dimensions.js`; only a complete valid dimension set is applied. Preset names are not stored: dimensions are authoritative. No schema change is needed for presets. On resize, furniture dimensions remain fixed and percentage anchors remain unchanged.

`loadSpace(storage, id)` reads the latest record and returns a validated independent room snapshot for editing. Saving reads the stored array strictly before writing; malformed or inaccessible storage causes an error. Unsupported records are preserved when saving another room. Library refreshes do not replace the active draft. Selection and camera state remain transient.
