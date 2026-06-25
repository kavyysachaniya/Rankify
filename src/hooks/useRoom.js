import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '../context/SocketContext'

export function useRoom() {
  const socket = useSocket()
  const [room, setRoom] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!socket) return

    function onPhaseChanged({ room: roomData }) {
      setRoom(roomData)
    }

    function onPlayerJoined(player) {
      setRoom(prev => prev ? { ...prev, players: [...prev.players, player] } : prev)
    }

    function onPlayerLeft({ playerId }) {
      setRoom(prev => prev
        ? { ...prev, players: prev.players.filter(p => p.id !== playerId) }
        : prev
      )
    }

    function onAdminChanged({ newAdminId }) {
      setRoom(prev => {
        if (!prev) return prev
        return {
          ...prev,
          adminId: newAdminId,
          players: prev.players.map(p => ({
            ...p,
            isAdmin: p.id === newAdminId,
          })),
        }
      })
    }

    function onTemplateUpdated({ template }) {
      setRoom(prev => prev ? { ...prev, template } : prev)
    }

    function onTimerUpdated({ timerSeconds }) {
      setRoom(prev => prev ? { ...prev, timerSeconds } : prev)
    }

    socket.on('room:phase-changed', onPhaseChanged)
    socket.on('room:player-joined', onPlayerJoined)
    socket.on('room:player-left', onPlayerLeft)
    socket.on('room:admin-changed', onAdminChanged)
    socket.on('room:template-updated', onTemplateUpdated)
    socket.on('room:timer-updated', onTimerUpdated)

    return () => {
      socket.off('room:phase-changed', onPhaseChanged)
      socket.off('room:player-joined', onPlayerJoined)
      socket.off('room:player-left', onPlayerLeft)
      socket.off('room:admin-changed', onAdminChanged)
      socket.off('room:template-updated', onTemplateUpdated)
      socket.off('room:timer-updated', onTimerUpdated)
    }
  }, [socket])

  const createRoom = useCallback((displayName) => {
    if (!socket) return
    if (!socket.connected) socket.connect()

    return new Promise((resolve) => {
      socket.emit('room:create', { displayName }, (res) => {
        if (res.ok) {
          setRoom(res.room)
          setError(null)
        } else {
          setError(res.error)
        }
        resolve(res)
      })
    })
  }, [socket])

  const joinRoom = useCallback((slug, displayName) => {
    if (!socket) return
    if (!socket.connected) socket.connect()

    return new Promise((resolve) => {
      socket.emit('room:join', { slug, displayName }, (res) => {
        if (res.ok) {
          setRoom(res.room)
          setError(null)
        } else {
          setError(res.error)
        }
        resolve(res)
      })
    })
  }, [socket])

  const advancePhase = useCallback(() => {
    if (!socket) return
    return new Promise((resolve) => {
      socket.emit('room:advance-phase', {}, (res) => {
        if (!res.ok) setError(res.error)
        resolve(res)
      })
    })
  }, [socket])

  const updateTemplate = useCallback((template) => {
    if (!socket) return
    return new Promise((resolve) => {
      socket.emit('room:update-template', { template }, resolve)
    })
  }, [socket])

  const updateTimer = useCallback((seconds) => {
    if (!socket) return
    return new Promise((resolve) => {
      socket.emit('room:update-timer', { seconds }, resolve)
    })
  }, [socket])

  const isAdmin = room && socket ? room.adminId === socket.id : false

  return {
    socket,
    room,
    error,
    isAdmin,
    createRoom,
    joinRoom,
    advancePhase,
    updateTemplate,
    updateTimer,
  }
}
