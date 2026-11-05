---
name: room-design-flow
description: Follow the 3d-room product flow when designing, implementing, or reviewing room upload, layout review, furnishing, styling, sharing, and supporting screens in this repository.
---

# 3d-room Design Flow

Use this as the product reference for this repository, based on the user's description and the supplied “Direction B · full flow” screenshot. Small screenshot labels were not reliably readable; do not invent precise copy or controls from them. Reference artifact: https://claude.ai/artifact/9gnBhNwbketEMnsgVrfyXT#page-dcb81aee8d83. Its availability is not guaranteed.

## Main Journey

**Upload → Check walls → Furnish → Style → Share**

Keep a visible step indicator across the editor journey and preserve edits when moving between steps. These describe intended behavior, not existing implementation.

### 1. Upload — Add your space

Provide two entry paths:

- **Floor plan upload:** Accept JPG, PNG, or PDF floor plans/blueprints. The intended AI workflow identifies layout, room features, and dimensions and creates an editable 3D representation.
- **Phone room scan:** Capture a space using a phone camera and room-scanning technology, estimate dimensions and features, and create a 3D representation. The screenshot includes a separate scan-mode screen within this step.

Both paths converge on layout review. Clearly show processing, errors, and estimated measurements. Ordinary room photos may supplement the flow, but reconstruction from them is not an agreed core entry path. Apple RoomPlan and OpenPlan3D Capture remain research candidates.

### 2. Check walls — Review the layout

Use a large 2D floor-plan workspace with supporting measurement controls. Let users review and correct dimensions, walls, doors, and windows before furnishing. AI estimates must remain editable and must not appear as verified measurements.

### 3. Furnish — Arrange furniture

Provide coordinated 2D floor-plan and 3D room views, a furniture selection area, and controls for the selected item. Support adding, moving, rotating, and removing furniture while retaining the reviewed room geometry.

### 4. Style — Customize the room

Emphasize the 3D preview with contextual controls for colors, materials, and decor. Let users experiment with finishes while preserving the arrangement.

### 5. Share — Present the result

Show a finished-room preview with sharing and export options. Export formats, sharing permissions, and services require implementation decisions; do not imply these integrations already work.

## Supporting Screens

The broader project includes a **home page** and **saved-spaces library**. Their detailed layouts are not specified by this screenshot. The library should let users reopen saved spaces for further editing.

## Visual Direction

Follow the screenshot's light workspace, restrained neutral palette, dark primary buttons, subtle green accents, thin borders, and compact top navigation. Give floor plans and 3D previews most of the workspace, placing contextual controls alongside them. This is directional guidance, not a pixel-precise specification.

## Applying the Flow

Identify which step a requested change affects and preserve its inputs and outputs. Implement the requested scope. Inspect the repository's actual stack before choosing libraries: React, Three.js, and React Three Fiber were candidates at setup. Label simulated AI or scanning results clearly and report unresolved integrations rather than claiming complete functionality. User corrections take precedence over this reference.
