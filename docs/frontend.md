# Frontend Architecture

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| Vite | 8 | Build tool + dev server |
| Tailwind CSS | 4 | Utility-first styling |
| @dnd-kit | 6/10 | Drag-and-drop |
| react-router-dom | 7 | Client-side routing |
| html2canvas | 1.4 | PNG export |
| socket.io-client | 4.8 | Real-time multiplayer |
| react-image-crop | 11 | Image cropping |

## Routing

Defined in `App.jsx`:

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `StartScreen` | Home — new list, multiplayer, community templates |
| `/editor` | `TierListEditor` | Drag-and-drop tier list editor |
| `/room/new` | `RoomView` | Create a new multiplayer room |
| `/room/:slug` | `RoomView` | Join an existing room |

All routes require authentication. Unauthenticated users see `AuthScreen`.

## State Management

### Editor State — `useTierList.js`

Central state managed with `useReducer`. Auto-persists to `localStorage` per user.

**State shape:**
```js
{
  screen: 'start' | 'editor',
  tiers: [
    {
      id: string,
      name: string,          // "S", "A", "B", etc.
      color: string,         // hex color
      bgImage: string|null,  // base64 data URL
      icon: string|null,     // base64 data URL
      visualMode: 'color' | 'bgImage' | 'icon',
      items: string[],       // item IDs in this tier
    }
  ],
  items: [
    {
      id: string,
      type: 'image' | 'text',
      src?: string,          // base64 data URL (image type)
      label?: string,        // display text (text type)
      bgColor?: string,      // hex (text type)
      bgImage?: string,      // base64 (text type, optional)
      icon?: string,         // base64 (text type, optional)
      aspectRatio: string,   // 'square', 'landscape', 'portrait', etc.
    }
  ],
  pool: string[],            // item IDs not yet ranked
}
```

**Actions:**

| Action | Description |
|--------|-------------|
| `RESET_FRESH` | New blank tier list with default S-F tiers |
| `CLEAR_ALL_ITEMS` | Remove all items, keep tier structure |
| `ADD_ITEM` | Add item to pool |
| `REMOVE_ITEM` | Delete item from everywhere |
| `MOVE_ITEM_TO_TIER` | Move item into a tier (optional index) |
| `MOVE_ITEM_TO_POOL` | Move item back to unranked pool |
| `REORDER_ITEM_IN_TIER` | Reorder within a tier |
| `REORDER_POOL` | Reorder within pool |
| `ADD_TIER` | Append new tier row |
| `REMOVE_TIER` | Delete tier, items go to pool |
| `UPDATE_TIER` | Edit tier name/color/visual |
| `REORDER_TIERS` | Move tier up/down |
| `LOAD_TEMPLATE` | Replace entire state from template data |

### Auth State — `useAuth.jsx`

Provides via React Context:

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `user` | object\|null | `{ id, username, displayName }` |
| `loading` | boolean | Initial load state |
| `login(username, password)` | async fn | Returns `{ ok, error? }` |
| `signup(username, displayName, password)` | async fn | Returns `{ ok, error? }` |
| `logout()` | fn | Clears session |
| `getTemplates()` | fn | Returns saved templates array |
| `saveTemplate(name, state)` | fn | Save/overwrite template |
| `deleteTemplate(id)` | fn | Delete template |
| `loadTemplate(id)` | fn | Returns template data |

Currently backed by localStorage. Will be replaced with Supabase (see `ROADMAP.md`).

### Socket State — `SocketContext.jsx`

Lazy socket connection — socket is only created when first accessed. Doesn't auto-connect on page load (multiplayer is opt-in).

```js
const socket = useSocket()  // returns socket instance or null
```

### Room State — `useRoom.js`

Manages multiplayer room lifecycle:

| Property | Description |
|----------|-------------|
| `room` | Current room data (players, phase, template, etc.) |
| `error` | Last error message |
| `isAdmin` | Whether current user is room admin |
| `createRoom(name)` | Create room, returns `{ ok, room }` |
| `joinRoom(slug, name)` | Join room, returns `{ ok, room }` |
| `advancePhase()` | Admin: move to next phase |
| `updateTemplate(data)` | Admin: set room template |
| `updateTimer(seconds)` | Admin: set timer duration |

### Ranking State — `useRanking.js`

Manages the voting phase:

| Property | Description |
|----------|-------------|
| `currentItem` | Item being voted on |
| `itemIndex` / `totalItems` | Progress tracking |
| `timerRemaining` | Countdown seconds |
| `hasVoted` | Whether current user voted |
| `selectedTier` | Which tier the user picked |
| `voteCounts` | `{ totalVotes, totalPlayers }` |
| `lastResult` | Result of previous item |
| `finalResults` | All results when ranking completes |
| `submitVote(itemId, tierIndex)` | Cast a vote |

## Drag and Drop

Uses `@dnd-kit` with three collision detection strategies layered:

1. **pointerWithin** — precise, checks if pointer is inside a droppable
2. **rectIntersection** — fallback, checks bounding box overlap

Drop targets:
- **Pool** — droppable ID `"pool"`
- **Tier rows** — droppable ID `"tier-{tierId}"`
- **Individual items** — sortable, allows reordering within containers

Sensors:
- `PointerSensor` — mouse, 5px activation distance
- `TouchSensor` — touch, 200ms delay + 5px tolerance
- `KeyboardSensor` — arrow keys

## Image Handling

### Adding Images

Three input methods, all funneling through `addImageFromSrc()`:

1. **File picker** — `<input type="file">`, reads as data URL via FileReader
2. **Drag from desktop** — native drop event, reads file as data URL
3. **Drag from browser** — extracts URL from `text/html` or `text/uri-list`, loads with CORS, converts to data URL via canvas

All images are cropped to the selected aspect ratio and stored as JPEG base64 data URLs (0.85 quality).

### Exporting as PNG

`exportImage.js` uses `html2canvas` to capture the tier canvas:

1. Adds `.exporting` class (hides hover controls via CSS)
2. Clones the DOM into an offscreen iframe
3. Converts any `oklch`/`oklab` CSS colors to RGB (Tailwind v4 compatibility)
4. Renders to canvas at 2x scale
5. Converts to data URL and triggers browser download
6. Removes `.exporting` class

## Component Hierarchy

```
App
├── AuthScreen                    (when not logged in)
└── AppInner                      (when logged in)
    ├── StartScreen               (route: /)
    │   └── CommunityTemplates
    │       └── TemplateCard
    ├── TierListEditor            (route: /editor)
    │   ├── TemplateManager
    │   ├── TierCanvas
    │   │   ├── TierRow
    │   │   │   └── ItemCard
    │   │   └── TierEditModal
    │   ├── ItemPool
    │   │   └── ItemCard
    │   └── DragOverlay → ItemCard
    └── RoomView                  (route: /room/:slug)
        ├── RoomHeader
        ├── RoomLobby
        │   └── PlayerList
        ├── RoomSetup (admin)
        │   ├── TierCanvas + ItemPool (full editor)
        │   └── CommunityTemplates
        ├── RankingPhase
        │   ├── TierRow (read-only)
        │   ├── RankingPool → ItemCard
        │   └── TimerDisplay
        └── ResultsScreen
```
