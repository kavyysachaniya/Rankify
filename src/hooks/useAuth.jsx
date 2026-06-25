import { useState, useCallback, createContext, useContext } from 'react'
import { uuid } from '../utils/uuid'

const AuthContext = createContext(null)
const USERS_KEY = 'rankify-users'

async function hashPassword(password, salt) {
  const input = salt + password
  if (crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  }
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + ch
    hash |= 0
  }
  return 'h' + Math.abs(hash).toString(16).padStart(8, '0')
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function loadSavedUser() {
  try {
    const saved = localStorage.getItem('rankify-current-user')
    if (saved) return JSON.parse(saved)
  // eslint-disable-next-line no-empty
  } catch {}
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSavedUser)
  const loading = false

  const signup = useCallback(async (username, displayName, password) => {
    const trimmed = username.trim().toLowerCase()
    if (!trimmed || trimmed.length < 3) return { ok: false, error: 'Username must be at least 3 characters' }
    if (!/^[a-z0-9._]+$/.test(trimmed)) return { ok: false, error: 'Username can only contain letters, numbers, dots, and underscores' }
    if (!password || password.length < 6) return { ok: false, error: 'Password must be at least 6 characters' }
    if (!displayName.trim()) return { ok: false, error: 'Display name is required' }

    const users = getUsers()
    if (users.find(u => u.username === trimmed)) return { ok: false, error: 'Username already taken' }

    const salt = uuid()
    const hash = await hashPassword(password, salt)
    const newUser = {
      id: uuid(),
      username: trimmed,
      displayName: displayName.trim(),
      salt,
      hash,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    saveUsers(users)

    const session = { id: newUser.id, username: newUser.username, displayName: newUser.displayName }
    setUser(session)
    localStorage.setItem('rankify-current-user', JSON.stringify(session))
    return { ok: true }
  }, [])

  const login = useCallback(async (username, password) => {
    const trimmed = username.trim().toLowerCase()
    const users = getUsers()
    const found = users.find(u => u.username === trimmed)
    if (!found) return { ok: false, error: 'Invalid username or password' }

    const hash = await hashPassword(password, found.salt)
    if (hash !== found.hash) return { ok: false, error: 'Invalid username or password' }

    const session = { id: found.id, username: found.username, displayName: found.displayName }
    setUser(session)
    localStorage.setItem('rankify-current-user', JSON.stringify(session))
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('rankify-current-user')
  }, [])

  const getTemplates = useCallback(() => {
    if (!user) return []
    try {
      return JSON.parse(localStorage.getItem(`rankify-templates-${user.id}`) || '[]')
    } catch {
      return []
    }
  }, [user])

  const saveTemplate = useCallback((name, state) => {
    if (!user) return
    const templates = getTemplates()
    const existing = templates.findIndex(t => t.name === name)
    const entry = {
      id: existing >= 0 ? templates[existing].id : uuid(),
      name,
      savedAt: new Date().toISOString(),
      data: {
        tiers: state.tiers,
        items: state.items,
        pool: state.pool,
      },
    }
    if (existing >= 0) {
      templates[existing] = entry
    } else {
      templates.push(entry)
    }
    localStorage.setItem(`rankify-templates-${user.id}`, JSON.stringify(templates))
    return entry
  }, [user, getTemplates])

  const deleteTemplate = useCallback((templateId) => {
    if (!user) return
    const templates = getTemplates().filter(t => t.id !== templateId)
    localStorage.setItem(`rankify-templates-${user.id}`, JSON.stringify(templates))
  }, [user, getTemplates])

  const loadTemplate = useCallback((templateId) => {
    const templates = getTemplates()
    return templates.find(t => t.id === templateId)?.data || null
  }, [getTemplates])

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, getTemplates, saveTemplate, deleteTemplate, loadTemplate }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
