# Application Flows

## Authentication Flow

```
App loads
  │
  ├── localStorage has session? ──── Yes ──→ Show StartScreen
  │                                            (user object loaded)
  └── No ──→ Show AuthScreen
                │
                ├── Login tab
                │     User enters username + password
                │     ↓
                │     Look up user in localStorage users array
                │     Hash password with stored salt (SHA-256)
                │     Compare hashes
                │     ├── Match ──→ Save session → Show StartScreen
                │     └── No match ──→ Show error
                │
                └── Signup tab
                      User enters username + display name + password
                      ↓
                      Validate (username ≥3 chars, password ≥6, display name required)
                      Check username not taken
                      Generate salt (UUID)
                      Hash password with salt
                      Store user in localStorage
                      Save session → Show StartScreen
```

## Single-Player Editor Flow

```
StartScreen
  │
  ├── "New Tier List" ──→ Reset state (fresh S-F tiers) → Navigate to /editor
  │
  ├── Click community template ──→ Load template data → Navigate to /editor
  │
  └── "Start Multiplayer" ──→ Navigate to /room/new
```

```
TierListEditor (/editor)
  │
  ├── Add items to pool:
  │     ├── Drag image from desktop/browser → auto-crop → add to pool
  │     ├── "Browse Files" → file picker → auto-crop → add to pool
  │     └── "Add Text Item" → modal (label + color + optional bg/icon) → add to pool
  │
  ├── Rank items:
  │     ├── Desktop: Drag item from pool → drop on tier row
  │     ├── Mobile: Tap item (selects it) → tap tier row (moves it)
  │     └── Reorder within tier/pool by dragging
  │
  ├── Edit tiers:
  │     ├── Click tier label → edit modal (name, color, visual mode, bg image, icon)
  │     ├── Up/down arrows → reorder tiers
  │     ├── Delete tier → items go to pool
  │     └── "+ Add Row" → new tier at bottom
  │
  ├── Templates:
  │     ├── "Templates" button → modal with Save/Load tabs
  │     ├── Save: enter name → stored in localStorage per user
  │     └── Load: click template → confirms if items exist → replaces state
  │
  ├── Export:
  │     └── "Download PNG" → html2canvas captures tier canvas → browser download
  │
  ├── "Clear All" → confirm → remove all items, keep tiers
  │
  └── "New List" → confirm → navigate back to StartScreen
```

## Multiplayer Flow

### Room Creation (Admin)

```
StartScreen → "Start Multiplayer" → /room/new
  │
  Enter display name → "Create Room"
  │
  Socket connects → emit 'room:create'
  │
  Server creates room with 6-char hex slug
  Admin joins as first player
  │
  URL updates to /room/{slug}
  │
  Show RoomLobby with invite link
```

### Room Joining (Player)

```
Player receives link: https://app.com/room/a1b2c3
  │
  Enter display name → "Join Room"
  │
  Socket connects → emit 'room:join'
  │
  Server adds player to room
  Broadcasts 'room:player-joined' to others
  │
  Show RoomLobby (waiting for admin)
```

### Setup Phase (Admin Only)

```
Admin clicks "Start Setup" in Lobby
  │
  Server: LOBBY → SETUP
  Broadcast phase change to all players
  │
  Admin sees full tier list editor (same as single-player)
  Other players see read-only preview
  │
  Admin can:
  ├── Load a community template
  ├── Add items (drag, upload, text)
  ├── Customize tiers
  ├── Set timer (15s / 30s / 45s / 60s / 90s / 2min)
  │
  Admin clicks "Start Ranking"
  │
  Template sent to server → Timer sent → Phase advanced
  Server: SETUP → RANKING
```

### Ranking Phase (All Players)

```
Server sends first item to all players
Timer starts counting down
  │
  Each player:
  ├── Sees the current item in the "Unranked" pool
  ├── Drags item to a tier row (casts vote)
  ├── OR waits for timer to expire (no vote counted)
  │
  Vote flow:
  │  Player drags item to tier
  │  ↓
  │  emit 'ranking:submit-vote' { itemId, tierIndex }
  │  ↓
  │  Server records vote
  │  Broadcasts vote count to all players
  │  ↓
  │  All voted? OR Timer expired?
  │  ↓
  │  Yes → Compute result (average tier index)
  │       → Broadcast item result
  │       → Show next item OR finish
  │
  Repeat for each item in pool
  │
  All items ranked → Server: RANKING → RESULTS
  Broadcast final results
```

### Results Phase

```
All players see final tier list
  │
  ├── Tiers populated with consensus rankings
  ├── "Export PNG" → download image of results
  └── (Future: "Play Again" to restart)
```

## Socket Connection Flow

```
App loads → SocketProvider wraps app
  │
  Socket is NOT connected yet (lazy)
  │
  User navigates to /room/* → useRoom() calls useSocket()
  │
  useSocket() → getSocket() → creates socket instance (first time only)
  │
  User clicks "Create Room" or "Join Room"
  │
  if (!socket.connected) socket.connect()
  │
  Socket connects to server
  │
  On disconnect:
  ├── Server detects disconnect
  ├── Removes player from room
  ├── If admin left → promote next player
  ├── If room empty → delete room
  └── Broadcast player-left to remaining players
```

## Data Persistence Flow

```
Editor state changes (drag, add, delete, etc.)
  │
  useReducer dispatches action → new state
  │
  useEffect detects state change
  │
  JSON.stringify(state) → localStorage.setItem('rankify-state-{userId}')
  │
  On page reload:
  │
  getInitialState(userId) → try localStorage.getItem → parse JSON
  │
  State restored → editor shows previous work
```

```
Template save:
  │
  User clicks "Save Template" → enters name
  │
  State (tiers + items + pool) → JSON → localStorage 'rankify-templates-{userId}'
  │
  Template load:
  │
  User clicks "Load" on a template
  │
  Template data → dispatch LOAD_TEMPLATE → replaces editor state
```

## Image Processing Flow

```
Image input (file, drag from desktop, drag from browser)
  │
  ├── File/Desktop: FileReader.readAsDataURL → base64 string
  │
  └── Browser drag: Extract URL from HTML/uri-list
        │
        ├── Load with crossOrigin='anonymous'
        │     ├── CORS success → draw to canvas → toDataURL (base64)
        │     └── CORS fail → try loading without CORS
        │           ├── Load success → draw to canvas → try toDataURL
        │           │     ├── Success → base64
        │           │     └── SecurityError → use raw URL (won't export)
        │           └── Load fail → show error
        │
  ↓
  addImageFromSrc(base64 or URL)
  │
  Load as Image → calculate crop for selected aspect ratio
  │
  Draw cropped region to canvas → toDataURL('image/jpeg', 0.85)
  │
  Dispatch ADD_ITEM with base64 src → item appears in pool
```
