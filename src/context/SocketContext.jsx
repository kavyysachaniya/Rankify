import { createContext, useContext, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const socketRef = useRef(null)

  const getSocket = useCallback(() => {
    if (!socketRef.current) {
      socketRef.current = io({
        autoConnect: false,
        transports: ['websocket', 'polling'],
      })
    }
    return socketRef.current
  }, [])

  return (
    <SocketContext.Provider value={getSocket}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const getSocket = useContext(SocketContext)
  return getSocket ? getSocket() : null
}
