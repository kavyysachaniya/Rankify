# Backend Architecture

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Express | 5 | HTTP server + static file serving |
| Socket.io | 4.8 | Real-time WebSocket communication |
| CORS | 2.8 | Cross-origin request handling |
| Node.js | 18+ | Runtime |

## Server Structure

```
server/
├── index.js          # Entry point — Express app, Socket.io setup, event handlers
├── roomManager.js    # Room CRUD, player join/leave, phase transitions
├── rankingEngine.js  # Vote submission, result computation, final tallying
└── package.json      # Server-only dependencies
```

## How It Works

The server has two responsibilities:

1. **Production static hosting** — serves the built frontend from `dist/` with SPA fallback routing
2. **Multiplayer engine** — manages rooms, players, voting, and real-time broadcasts via Socket.io

All multiplayer state lives in memory (a `Map` of rooms). No database required. Restarting the server clears all active rooms.

## Room Lifecycle

```
CREATE ROOM → LOBBY → SETUP → RANKING → RESULTS
                ↑                           │
                └───── (play again) ────────┘
```

### Phases

| Phase | What Happens |
|-------|-------------|
| **LOBBY** | Players join via invite link. Admin sees "Start Setup" button. |
| **SETUP** | Admin builds or loads a template (tiers + items). Other players see a preview. |
| **RANKING** | Items are shown one-by-one. All players vote simultaneously. Timer counts down. |
| **RESULTS** | Final consensus ranking displayed. PNG export available. |

### Phase Transitions

Only the room admin can advance phases. The server enforces this:

```
LOBBY → SETUP → RANKING → RESULTS
```

No backward transitions. No skipping.

## Room Data Model

```js
{
  slug: string,              // 6-char hex room code (e.g. "a1b2c3")
  adminId: string,           // socket.id of the admin
  phase: 'LOBBY' | 'SETUP' | 'RANKING' | 'RESULTS',
  createdAt: number,         // Date.now() timestamp
  template: {
    tiers: Array,            // tier objects (id, name, color, etc.)
    items: Array,            // item objects (id, type, src/label, etc.)
    pool: string[],          // item IDs to rank (ordering = presentation order)
  },
  timerSeconds: number,      // seconds per item (10-120, default 30)
  currentItemIndex: number,  // which pool item is being voted on
  players: Map<socketId, {
    id: string,
    displayName: string,
    isAdmin: boolean,
    connected: boolean,
  }>,
  votes: Map<itemId, Map<playerId, tierIndex>>,
  results: Map<itemId, tierId>,
}
```

## Room Manager (`roomManager.js`)

### Functions

| Function | Description |
|----------|-------------|
| `createRoom(adminSocketId, displayName)` | Creates room with 6-char hex slug, adds admin as first player |
| `joinRoom(slug, socketId, displayName)` | Adds player to room. Blocked during RANKING/RESULTS phases |
| `leaveRoom(slug, socketId)` | Removes player. If admin leaves, promotes next player. If empty, deletes room |
| `getRoom(slug)` | Returns room or null |
| `advancePhase(slug, socketId)` | Admin-only phase transition. Resets votes on RANKING entry |
| `updateTemplate(slug, socketId, data)` | Admin-only, SETUP phase only |
| `updateTimerSeconds(slug, socketId, seconds)` | Admin-only, clamps to 10-120 |
| `findRoomBySocket(socketId)` | Reverse lookup: socket ID → room slug |
| `serializeRoom(room)` | Converts Maps to arrays/objects for JSON transport |

### Auto-Cleanup

A 60-second interval checks for stale rooms:
- All players disconnected AND room is older than 2 hours → deleted

## Ranking Engine (`rankingEngine.js`)

### Voting Algorithm

1. Each item is shown to all players simultaneously
2. Players vote by selecting a tier index (0 = first tier, 1 = second, etc.)
3. When all players vote OR the timer expires:
   - Compute average tier index across all votes
   - Round to nearest integer
   - Clamp to valid tier range
   - Place item in that tier

```
Example: 3 players vote on item "Dark Knight"
  Player A → tier 0 (S)
  Player B → tier 1 (A)
  Player C → tier 0 (S)

  Average = (0 + 1 + 0) / 3 = 0.33
  Rounded = 0
  Result: Item placed in S tier
```

### Functions

| Function | Description |
|----------|-------------|
| `submitVote(room, itemId, playerId, tierIndex)` | Records vote, returns `{ totalVotes, totalPlayers, allVoted }` |
| `computeItemResult(room, itemId)` | Averages votes, returns placement result |
| `getCurrentItem(room)` | Returns the item object at `currentItemIndex` |
| `advanceToNextItem(room)` | Increments index, returns `{ done, item }` |
| `computeFinalResults(room)` | Builds `{ tierId: [itemId, ...] }` map of all placements |

### Timer Flow

```
Item shown → Timer starts (N seconds)
                ↓
    ┌── All voted ──┐── Timer hits 0 ──┐
    ↓               ↓                  ↓
    Clear timer     Clear timer        ─┘
    ↓
    Compute result for this item
    ↓
    Broadcast result
    ↓
    ┌── More items? ──────── Yes → Show next item → Start timer
    ↓
    No → Phase = RESULTS → Broadcast final results
```

## Express Configuration

```js
app.use(cors())
app.use(express.json({ limit: '10mb' }))  // large payloads for base64 images
```

Socket.io configuration:
```js
const io = new Server(httpServer, {
  cors: { origin: '*' },                   // restrict in production
  maxHttpBufferSize: 10 * 1024 * 1024,     // 10MB for template data
})
```

### Static File Serving (Production)

When `dist/` exists, the server serves it:

```js
app.use(express.static(distPath))
app.get('/{*splat}', (req, res) => {
  res.sendFile(join(distPath, 'index.html'))  // SPA fallback
})
```

This means `npm run build && npm start` gives you a fully self-contained production server.

## Server Bind

```js
httpServer.listen(PORT, '0.0.0.0')  // accepts connections from any interface
```

`PORT` defaults to `3001` but reads from `process.env.PORT` for hosting platforms.
