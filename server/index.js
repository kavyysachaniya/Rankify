import express from 'express'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { Server } from 'socket.io'
import cors from 'cors'
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  advancePhase,
  updateTemplate,
  updateTimerSeconds,
  findRoomBySocket,
  serializeRoom,
} from './roomManager.js'
import {
  submitVote,
  computeItemResult,
  getCurrentItem,
  advanceToNextItem,
  computeFinalResults,
} from './rankingEngine.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: '*' },
  maxHttpBufferSize: 10 * 1024 * 1024,
})

const roomTimers = new Map()

function startItemTimer(room) {
  const slug = room.slug
  clearRoomTimer(slug)

  let remaining = room.timerSeconds

  const interval = setInterval(() => {
    remaining--
    io.to(slug).emit('ranking:timer-tick', { remaining })

    if (remaining <= 0) {
      clearRoomTimer(slug)
      handleTimerExpired(room)
    }
  }, 1000)

  roomTimers.set(slug, interval)
}

function clearRoomTimer(slug) {
  const existing = roomTimers.get(slug)
  if (existing) {
    clearInterval(existing)
    roomTimers.delete(slug)
  }
}

function handleTimerExpired(room) {
  const currentItemId = room.template.pool[room.currentItemIndex]
  if (!currentItemId) return

  const result = computeItemResult(room, currentItemId)
  if (result) {
    io.to(room.slug).emit('ranking:item-result', result)
  }

  const next = advanceToNextItem(room)
  if (next.done) {
    room.phase = 'RESULTS'
    const finalResults = computeFinalResults(room)
    io.to(room.slug).emit('ranking:complete', {
      results: finalResults,
      room: serializeRoom(room),
    })
  } else {
    io.to(room.slug).emit('ranking:next-item', {
      item: next.item,
      index: room.currentItemIndex,
      total: room.template.pool.length,
    })
    startItemTimer(room)
  }
}

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`)

  socket.on('room:create', ({ displayName }, callback) => {
    const room = createRoom(socket.id, displayName)
    socket.join(room.slug)
    console.log(`[room] created: ${room.slug} by ${displayName} (${socket.id})`)
    callback({ ok: true, room: serializeRoom(room) })
  })

  socket.on('room:join', ({ slug, displayName }, callback) => {
    console.log(`[room] join attempt: ${slug} by ${displayName} (${socket.id})`)
    const room = joinRoom(slug, socket.id, displayName)
    if (!room) {
      console.log(`[room] join FAILED: ${slug} — room not found or in RANKING/RESULTS phase`)
      callback({ ok: false, error: 'Room not found or already in progress' })
      return
    }
    socket.join(slug)
    callback({ ok: true, room: serializeRoom(room) })
    socket.to(slug).emit('room:player-joined', {
      id: socket.id,
      displayName,
      isAdmin: false,
      connected: true,
    })
  })

  socket.on('room:advance-phase', (_, callback) => {
    const slug = findRoomBySocket(socket.id)
    if (!slug) { callback({ ok: false }); return }

    const room = advancePhase(slug, socket.id)
    if (!room) { callback({ ok: false, error: 'Cannot advance phase' }); return }

    io.to(slug).emit('room:phase-changed', {
      phase: room.phase,
      room: serializeRoom(room),
    })

    if (room.phase === 'RANKING') {
      const item = getCurrentItem(room)
      if (item) {
        io.to(slug).emit('ranking:next-item', {
          item,
          index: 0,
          total: room.template.pool.length,
        })
        startItemTimer(room)
      }
    }

    callback({ ok: true })
  })

  socket.on('room:update-template', ({ template }, callback) => {
    const slug = findRoomBySocket(socket.id)
    if (!slug) { callback({ ok: false }); return }

    const room = updateTemplate(slug, socket.id, template)
    if (!room) { callback({ ok: false }); return }

    socket.to(slug).emit('room:template-updated', { template: room.template })
    callback({ ok: true })
  })

  socket.on('room:update-timer', ({ seconds }, callback) => {
    const slug = findRoomBySocket(socket.id)
    if (!slug) { callback({ ok: false }); return }

    const room = updateTimerSeconds(slug, socket.id, seconds)
    if (!room) { callback({ ok: false }); return }

    io.to(slug).emit('room:timer-updated', { timerSeconds: room.timerSeconds })
    callback({ ok: true })
  })

  socket.on('ranking:submit-vote', ({ itemId, tierIndex }, callback) => {
    const slug = findRoomBySocket(socket.id)
    if (!slug) { callback({ ok: false }); return }

    const room = getRoom(slug)
    if (!room || room.phase !== 'RANKING') { callback({ ok: false }); return }

    const { allVoted, totalVotes, totalPlayers } = submitVote(room, itemId, socket.id, tierIndex)

    socket.to(slug).emit('ranking:vote-received', {
      playerId: socket.id,
      itemId,
      totalVotes,
      totalPlayers,
    })

    callback({ ok: true })

    if (allVoted) {
      clearRoomTimer(slug)
      handleTimerExpired(room)
    }
  })

  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`)
    const slug = findRoomBySocket(socket.id)
    if (!slug) return

    const result = leaveRoom(slug, socket.id)
    if (!result) return

    if (result.deleted) {
      console.log(`[room] deleted (empty): ${slug}`)
      clearRoomTimer(slug)
      return
    }

    console.log(`[room] player left: ${slug} (${socket.id})`)
    io.to(slug).emit('room:player-left', { playerId: socket.id })
    if (result.newAdminId) {
      console.log(`[room] admin promoted: ${result.newAdminId} in ${slug}`)
      io.to(slug).emit('room:admin-changed', { newAdminId: result.newAdminId })
    }
  })
})

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, '..', 'dist')

if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Rankify server running on port ${PORT}`)
})
