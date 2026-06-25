import crypto from 'node:crypto'

const rooms = new Map()

function generateSlug() {
  return crypto.randomBytes(3).toString('hex')
}

export function createRoom(adminSocketId, displayName) {
  const slug = generateSlug()
  const room = {
    slug,
    adminId: adminSocketId,
    phase: 'LOBBY',
    createdAt: Date.now(),
    template: { tiers: [], items: [], pool: [] },
    timerSeconds: 30,
    currentItemIndex: -1,
    players: new Map(),
    votes: new Map(),
    results: new Map(),
  }

  room.players.set(adminSocketId, {
    id: adminSocketId,
    displayName,
    isAdmin: true,
    connected: true,
  })

  rooms.set(slug, room)
  return room
}

export function joinRoom(slug, socketId, displayName) {
  const room = rooms.get(slug)
  if (!room) return null
  if (room.phase === 'RANKING' || room.phase === 'RESULTS') return null

  room.players.set(socketId, {
    id: socketId,
    displayName,
    isAdmin: false,
    connected: true,
  })

  return room
}

export function leaveRoom(slug, socketId) {
  const room = rooms.get(slug)
  if (!room) return null

  const wasAdmin = room.players.get(socketId)?.isAdmin
  room.players.delete(socketId)

  if (room.players.size === 0) {
    rooms.delete(slug)
    return { room, deleted: true }
  }

  if (wasAdmin) {
    const nextPlayer = room.players.values().next().value
    if (nextPlayer) {
      nextPlayer.isAdmin = true
      room.adminId = nextPlayer.id
    }
  }

  return { room, deleted: false, newAdminId: wasAdmin ? room.adminId : null }
}

export function getRoom(slug) {
  return rooms.get(slug) || null
}

export function advancePhase(slug, socketId) {
  const room = rooms.get(slug)
  if (!room || room.adminId !== socketId) return null

  const transitions = {
    LOBBY: 'SETUP',
    SETUP: 'RANKING',
    RANKING: 'RESULTS',
  }

  const next = transitions[room.phase]
  if (!next) return null

  room.phase = next

  if (next === 'RANKING') {
    room.currentItemIndex = 0
    room.votes.clear()
    room.results.clear()
  }

  return room
}

export function updateTemplate(slug, socketId, templateData) {
  const room = rooms.get(slug)
  if (!room || room.adminId !== socketId || room.phase !== 'SETUP') return null

  room.template = templateData
  return room
}

export function updateTimerSeconds(slug, socketId, seconds) {
  const room = rooms.get(slug)
  if (!room || room.adminId !== socketId) return null

  room.timerSeconds = Math.max(10, Math.min(120, seconds))
  return room
}

export function findRoomBySocket(socketId) {
  for (const [slug, room] of rooms) {
    if (room.players.has(socketId)) return slug
  }
  return null
}

export function serializeRoom(room) {
  return {
    slug: room.slug,
    adminId: room.adminId,
    phase: room.phase,
    template: room.template,
    timerSeconds: room.timerSeconds,
    currentItemIndex: room.currentItemIndex,
    players: Array.from(room.players.values()),
    results: Object.fromEntries(room.results),
  }
}

setInterval(() => {
  const now = Date.now()
  const TWO_HOURS = 2 * 60 * 60 * 1000
  for (const [slug, room] of rooms) {
    const allDisconnected = Array.from(room.players.values()).every(p => !p.connected)
    if (allDisconnected && now - room.createdAt > TWO_HOURS) {
      rooms.delete(slug)
    }
  }
}, 60_000)
