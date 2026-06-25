import { useReducer, useEffect } from 'react'
import { uuid } from '../utils/uuid'

const DEFAULT_TIERS = [
  { id: uuid(), name: 'S', color: '#d4a0a0', bgImage: null, icon: null, visualMode: 'color', items: [] },
  { id: uuid(), name: 'A', color: '#d4b8a0', bgImage: null, icon: null, visualMode: 'color', items: [] },
  { id: uuid(), name: 'B', color: '#d4cca0', bgImage: null, icon: null, visualMode: 'color', items: [] },
  { id: uuid(), name: 'C', color: '#a0d4a8', bgImage: null, icon: null, visualMode: 'color', items: [] },
  { id: uuid(), name: 'D', color: '#a0b8d4', bgImage: null, icon: null, visualMode: 'color', items: [] },
  { id: uuid(), name: 'F', color: '#b8a0d4', bgImage: null, icon: null, visualMode: 'color', items: [] },
]

function createDefaultState() {
  return {
    screen: 'start',
    tiers: DEFAULT_TIERS.map(t => ({ ...t, id: uuid(), items: [] })),
    items: [],
    pool: [],
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESET_FRESH':
      return { ...createDefaultState(), screen: 'editor' }

    case 'RESET_KEEP_TIERS':
      return {
        ...state,
        screen: 'editor',
        tiers: state.tiers.map(t => ({ ...t, items: [] })),
        pool: [
          ...state.pool,
          ...state.tiers.flatMap(t => t.items),
        ],
      }

    case 'GO_START':
      return { ...state, screen: 'start' }

    case 'CLEAR_ALL_ITEMS':
      return {
        ...state,
        items: [],
        pool: [],
        tiers: state.tiers.map(t => ({ ...t, items: [] })),
      }

    case 'REORDER_POOL':
      return { ...state, pool: action.pool }

    case 'ADD_TIER':
      return {
        ...state,
        tiers: [...state.tiers, {
          id: uuid(),
          name: action.name || 'New',
          color: action.color || '#666666',
          bgImage: null,
          icon: null,
          visualMode: 'color',
          items: [],
        }],
      }

    case 'REMOVE_TIER': {
      const tier = state.tiers.find(t => t.id === action.tierId)
      return {
        ...state,
        tiers: state.tiers.filter(t => t.id !== action.tierId),
        pool: [...state.pool, ...(tier ? tier.items : [])],
      }
    }

    case 'REORDER_TIERS':
      return { ...state, tiers: action.tiers }

    case 'UPDATE_TIER':
      return {
        ...state,
        tiers: state.tiers.map(t =>
          t.id === action.tierId ? { ...t, ...action.updates } : t
        ),
      }

    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.item],
        pool: [...state.pool, action.item.id],
      }

    case 'REMOVE_ITEM': {
      const itemId = action.itemId
      return {
        ...state,
        items: state.items.filter(i => i.id !== itemId),
        pool: state.pool.filter(id => id !== itemId),
        tiers: state.tiers.map(t => ({
          ...t,
          items: t.items.filter(id => id !== itemId),
        })),
      }
    }

    case 'MOVE_ITEM_TO_TIER': {
      const { itemId, tierId, index } = action
      const newTiers = state.tiers.map(t => {
        if (t.id === tierId) {
          const filtered = t.items.filter(id => id !== itemId)
          const insertAt = index !== undefined ? index : filtered.length
          filtered.splice(insertAt, 0, itemId)
          return { ...t, items: filtered }
        }
        return { ...t, items: t.items.filter(id => id !== itemId) }
      })
      return {
        ...state,
        tiers: newTiers,
        pool: state.pool.filter(id => id !== itemId),
      }
    }

    case 'MOVE_ITEM_TO_POOL': {
      const { itemId } = action
      return {
        ...state,
        tiers: state.tiers.map(t => ({
          ...t,
          items: t.items.filter(id => id !== itemId),
        })),
        pool: state.pool.includes(itemId) ? state.pool : [...state.pool, itemId],
      }
    }

    case 'REORDER_ITEM_IN_TIER': {
      const { tierId, oldIndex, newIndex } = action
      return {
        ...state,
        tiers: state.tiers.map(t => {
          if (t.id !== tierId) return t
          const newItems = [...t.items]
          const [moved] = newItems.splice(oldIndex, 1)
          newItems.splice(newIndex, 0, moved)
          return { ...t, items: newItems }
        }),
      }
    }

    case 'LOAD_TEMPLATE': {
      const { data } = action
      if (!data || !Array.isArray(data.tiers) || !Array.isArray(data.items) || !Array.isArray(data.pool)) {
        return state
      }
      return {
        ...state,
        screen: 'editor',
        tiers: data.tiers,
        items: data.items,
        pool: data.pool,
      }
    }

    default:
      return state
  }
}

function getStorageKey(userId) {
  return userId ? `rankify-state-${userId}` : 'rankify-state-guest'
}

function loadSavedState(userId) {
  try {
    const saved = localStorage.getItem(getStorageKey(userId))
    if (saved) return JSON.parse(saved)
  // eslint-disable-next-line no-empty
  } catch {}
  return null
}

function getInitialState(userId) {
  return loadSavedState(userId) || createDefaultState()
}

export function useTierList(userId) {
  const [state, dispatch] = useReducer(reducer, userId, getInitialState)

  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(state))
    // eslint-disable-next-line no-empty
    } catch {}
  }, [state, userId])

  return { state, dispatch }
}
