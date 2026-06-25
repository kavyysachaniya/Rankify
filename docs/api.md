# Socket.io API Reference

All multiplayer communication uses Socket.io events. The client connects to the same origin (no explicit URL needed in development; proxied by Vite).

## Client → Server Events

All events use acknowledgement callbacks: `socket.emit('event', data, (response) => { ... })`

### Room Events

#### `room:create`
Create a new room. Caller becomes admin.

```js
// Request
{ displayName: string }

// Response
{ ok: true, room: RoomObject }
// or
{ ok: false, error: string }
```

#### `room:join`
Join an existing room by slug. Blocked during RANKING/RESULTS phases.

```js
// Request
{ slug: string, displayName: string }

// Response
{ ok: true, room: RoomObject }
// or
{ ok: false, error: 'Room not found or already in progress' }
```

#### `room:advance-phase`
Admin-only. Move to the next phase.

```js
// Request
{}

// Response
{ ok: true }
// or
{ ok: false, error: 'Cannot advance phase' }
```

Transitions: `LOBBY → SETUP → RANKING → RESULTS`

#### `room:update-template`
Admin-only, SETUP phase only. Set the template for ranking.

```js
// Request
{
  template: {
    tiers: [{ id, name, color, bgImage, icon, visualMode, items: [] }],
    items: [{ id, type, src?, label?, bgColor?, ... }],
    pool: [itemId, ...]
  }
}

// Response
{ ok: true }
```

#### `room:update-timer`
Admin-only. Set seconds per item (clamped to 10-120).

```js
// Request
{ seconds: number }

// Response
{ ok: true }
```

### Ranking Events

#### `ranking:submit-vote`
Cast a vote for the current item.

```js
// Request
{ itemId: string, tierIndex: number }

// Response
{ ok: true }
```

`tierIndex` is 0-based (0 = first tier, 1 = second, etc.)

---

## Server → Client Events

### Room Events

#### `room:phase-changed`
Broadcast to all players when phase advances.

```js
{ phase: string, room: RoomObject }
```

#### `room:player-joined`
Broadcast to existing players when someone joins.

```js
{ id: string, displayName: string, isAdmin: false, connected: true }
```

#### `room:player-left`
Broadcast when a player disconnects.

```js
{ playerId: string }
```

#### `room:admin-changed`
Broadcast when admin disconnects and a new admin is promoted.

```js
{ newAdminId: string }
```

#### `room:template-updated`
Broadcast to non-admin players when admin updates the template.

```js
{ template: TemplateObject }
```

#### `room:timer-updated`
Broadcast when admin changes the timer setting.

```js
{ timerSeconds: number }
```

### Ranking Events

#### `ranking:next-item`
Broadcast when a new item is shown for voting.

```js
{
  item: { id, type, src?, label?, bgColor?, ... },
  index: number,      // 0-based position
  total: number       // total items to rank
}
```

#### `ranking:timer-tick`
Broadcast every second during voting.

```js
{ remaining: number }
```

#### `ranking:vote-received`
Broadcast when any player votes (keeps others informed of progress).

```js
{
  playerId: string,
  itemId: string,
  totalVotes: number,
  totalPlayers: number
}
```

#### `ranking:item-result`
Broadcast after all votes are in or timer expires.

```js
{
  itemId: string,
  tierId: string,       // which tier the item was placed in
  tierIndex: number,     // 0-based tier position
  average: number,       // average vote (e.g. 0.33)
  voteCount: number      // how many players voted
}
```

#### `ranking:complete`
Broadcast when all items have been ranked.

```js
{
  results: {
    [tierId]: [itemId, itemId, ...],  // items placed in each tier
  },
  room: RoomObject
}
```

---

## Room Object (Serialized)

Returned in responses and broadcasts:

```js
{
  slug: string,
  adminId: string,
  phase: 'LOBBY' | 'SETUP' | 'RANKING' | 'RESULTS',
  template: {
    tiers: Array,
    items: Array,
    pool: string[]
  },
  timerSeconds: number,
  currentItemIndex: number,
  players: [
    { id: string, displayName: string, isAdmin: boolean, connected: boolean }
  ],
  results: {
    [itemId]: tierId
  }
}
```
