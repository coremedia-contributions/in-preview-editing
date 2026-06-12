# Section Item Drag & Drop

The plugin supports reordering section items via native HTML5 Drag & Drop. Items marked with
`data-cm-section-item` can be dragged and dropped within their enclosing `data-cm-section`
element. Cross-section moves are intentionally prevented.

## DOM Markers

| Attribute | Element | Purpose |
|---|---|---|
| `data-cm-section` | Container | Defines the boundary within which items can be reordered |
| `data-cm-section-item` | Item | Identifies a draggable item; its attribute value is used as the item ID |

## Architecture Overview

```
Host Document                         Shadow DOM (plugin)
──────────────────────────────────    ─────────────────────────────────
[data-cm-section]                     DragDropIndicator (React)
  [data-cm-section-item] ←── drag        └─ useSectionDragDrop hook
  [data-cm-section-item]                     └─ attaches listeners to
  [data-cm-section-item] ←── drop               host-document items
                                        .ipe-drop-indicator div
                                           └─ positioned in shadow root
```

The plugin lives in a Shadow DOM, but the draggable content elements are in the host document.
The `useSectionDragDrop` hook bridges this gap by attaching native drag event listeners
directly onto the host elements while all visual feedback (drop indicator line) is rendered
inside the Shadow DOM — the same pattern used by the `Highlighter` component.

## How It Works

### 1. Activation

When the plugin activates (`isActive = true`), the `useSectionDragDrop` hook:

- Queries all current `[data-cm-section-item]` elements and sets `draggable="true"` on each.
- Attaches `dragstart`, `dragend`, `dragover`, `dragleave`, and `drop` listeners via an
  `AbortController` so cleanup is trivial.
- Starts a `MutationObserver` on `document.body` to pick up items added dynamically after
  activation.

On deactivation, the `AbortController` is aborted, the observer is disconnected, and
`draggable` / `ipe-dragging` are removed from all items.

### 2. Drag Start

```
dragstart
  ├─ store source element in dragSourceRef
  ├─ set dataTransfer.effectAllowed = "move"
  └─ add .ipe-dragging class after a 0 ms timeout
       (timeout ensures the browser can capture the ghost image first)
```

### 3. Drag Over

On every `dragover` event over a potential target item:

1. **Section boundary check** – `findSectionNode(source)` must equal `findSectionNode(target)`.
   If they differ, `dropEffect` is set to `"none"` and the indicator stays hidden.
2. **Half-hit detection** – if the pointer is in the **top half** of the target element the
   drop position is `"before"`, otherwise `"after"`.
3. Drop state (`dropTarget` + `position`) is written to both a React state (triggers indicator
   re-render) and a ref (available in the stale-closure-safe `drop` handler).

### 4. Drop & Index Calculation

When the `drop` event fires:

```
items  = getItemsInSection(section)   // current DOM order
fromIndex = items.indexOf(source)
targetIdx = items.indexOf(dropTarget)

rawToIndex = position === "before" ? targetIdx : targetIdx + 1

// The source element is removed before insertion, so indices shift by 1
// for all positions after the source.
finalIndex = rawToIndex > fromIndex ? rawToIndex - 1 : rawToIndex
```

If `finalIndex === fromIndex` the drop is a no-op and no message is sent.
Otherwise `moveSectionItemToIndex(source, finalIndex)` is called, which dispatches a
`SECTION_ITEM_ACTION_REQUEST` message to the Studio backend with action `MOVE_TO` and
the computed `moveTo` index.

#### Index Calculation Examples

| Scenario | Items | from → to | finalIndex |
|---|---|---|---|
| Move first item to last | `[A, B, C, D]` | 0 → after D (idx 3) | 3 |
| Move last item to first | `[A, B, C, D]` | 3 → before A (idx 0) | 0 |
| Move middle item down | `[A, B, C, D]` | 1 → after C (idx 2) | 2 |
| Move middle item up | `[A, B, C, D]` | 2 → before B (idx 1) | 1 |

### 5. Visual Feedback

#### Drop Indicator (Shadow DOM)

`DragDropIndicator` creates a single `<div class="ipe-drop-indicator">` directly in the
shadow root (no React portal, no host-document leakage). When `dropTarget` is set, the div
is positioned absolutely:

- **`before`**: top edge of the target element
- **`after`**: bottom edge of the target element

The line is styled with `--ipe-accent-color` so it inherits the configured theme colour.

#### Dragged Element (Host Document)

The `.ipe-dragging` class is applied to the source element via `frontend.css`
(injected into the host document's `<head>`):

```css
[data-cm-section-item][draggable="true"] { cursor: grab; }
[data-cm-section-item].ipe-dragging     { opacity: 0.4; cursor: grabbing; }
```

## Sequence Diagram

```
User                Host DOM               useSectionDragDrop       Backend
 │                     │                          │                     │
 │── mousedown ───────▶│                          │                     │
 │── dragstart ────────┤──── dragSourceRef ───────▶│                    │
 │                     │    + .ipe-dragging         │                    │
 │── dragover ─────────┤──── same section? ────────▶│                   │
 │                     │    updateDropState()       │                    │
 │                     │    (indicator moves)       │                    │
 │── drop ─────────────┤──── compute finalIndex ───▶│                   │
 │                     │                            │── MOVE_TO ────────▶│
 │                     │                            │◀─ response ────────│
 │                     │◀─ DOM update ──────────────────────────────────│
```

## Files

| File | Role |
|---|---|
| `src/hooks/useSectionDragDrop.ts` | Core hook – event listeners, index calculation, action dispatch |
| `src/components/DragDropIndicator.tsx` | React component – mounts the indicator div in the shadow root |
| `src/lib/section-utils.ts` | `moveSectionItemToIndex`, `findSectionNode`, `getItemsInSection` |
| `src/styles/frontend.css` | Host-document styles: `cursor: grab`, `.ipe-dragging` opacity |
| `src/styles/plugin.css` | Shadow-DOM styles: `.ipe-drop-indicator` line with dot endpoints |

## Backend Contract

The drop dispatches a `SECTION_ITEM_ACTION_REQUEST` message with:

```json
{
  "contentRef": "<content-id>",
  "sectionItemId": "<value of data-cm-section-item>",
  "action": "MOVE_TO",
  "actionParams": {
    "moveTo": 2
  }
}
```

`moveTo` is the **0-based absolute target index** within the section after the move has been
applied (i.e. the final position of the item in the section's item list).

The Studio backend must implement handling for the `MOVE_TO` action in the section item
action handler.

