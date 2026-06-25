import { useRef, useState, useCallback } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext'
import RoomView from './components/room/RoomView'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useTierList } from './hooks/useTierList'
import AuthScreen from './components/AuthScreen'
import StartScreen from './components/StartScreen'
import TierCanvas from './components/TierCanvas'
import ItemPool from './components/ItemPool'

import ItemCard from './components/ItemCard'
import TemplateManager from './components/TemplateManager'

function collisionDetection(args) {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions
  return rectIntersection(args)
}

function AppInner() {
  const { user, loading, logout } = useAuth()

  if (loading) return null
  if (!user) return <AuthScreen />

  return (
    <Routes>
      <Route path="/room/:slug" element={<RoomView />} />
      <Route path="/editor" element={<TierListEditor user={user} onLogout={logout} />} />
      <Route path="*" element={<StartScreenRoute user={user} onLogout={logout} />} />
    </Routes>
  )
}

function StartScreenRoute({ user, onLogout }) {
  const navigate = useNavigate()
  const { dispatch } = useTierList(user.id)

  function handleNewList() {
    dispatch({ type: 'RESET_FRESH' })
    navigate('/editor')
  }

  function handleLoadTemplate(data) {
    dispatch({ type: 'LOAD_TEMPLATE', data })
    navigate('/editor')
  }

  return (
    <StartScreen
      onNewList={handleNewList}
      onLoadTemplate={handleLoadTemplate}
      user={user}
      onLogout={onLogout}
    />
  )
}

function TierListEditor({ user, onLogout }) {
  const navigate = useNavigate()
  const { state, dispatch } = useTierList(user.id)
  const canvasRef = useRef(null)
  const [activeId, setActiveId] = useState(null)
  const [selectedItemId, setSelectedItemId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const activeItem = activeId ? state.items.find(i => i.id === activeId) : null

  function findContainer(id) {
    if (state.pool.includes(id)) return 'pool'
    for (const tier of state.tiers) {
      if (tier.items.includes(id)) return tier.id
    }
    return null
  }

  function handleDragStart(event) {
    setActiveId(event.active.id)
    setSelectedItemId(null)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeContainer = findContainer(active.id)
    let overContainer = over.id

    if (overContainer === 'pool') {
      if (activeContainer === 'pool') return
      dispatch({ type: 'MOVE_ITEM_TO_POOL', itemId: active.id })
      return
    }

    if (typeof overContainer === 'string' && overContainer.startsWith('tier-')) {
      overContainer = overContainer.replace('tier-', '')
      dispatch({ type: 'MOVE_ITEM_TO_TIER', itemId: active.id, tierId: overContainer })
      return
    }

    const overItemContainer = findContainer(over.id)

    if (overItemContainer === 'pool' && activeContainer === 'pool') {
      const oldIndex = state.pool.indexOf(active.id)
      const newIndex = state.pool.indexOf(over.id)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        dispatch({ type: 'REORDER_POOL', pool: arrayMove(state.pool, oldIndex, newIndex) })
      }
      return
    }

    if (overItemContainer && overItemContainer !== 'pool') {
      const tier = state.tiers.find(t => t.id === overItemContainer)
      if (!tier) return
      const overIndex = tier.items.indexOf(over.id)

      if (activeContainer === overItemContainer) {
        const oldIndex = tier.items.indexOf(active.id)
        dispatch({ type: 'REORDER_ITEM_IN_TIER', tierId: overItemContainer, oldIndex, newIndex: overIndex })
      } else {
        dispatch({ type: 'MOVE_ITEM_TO_TIER', itemId: active.id, tierId: overItemContainer, index: overIndex })
      }
    }
  }

  function handleGoToStart() {
    const hasItems = state.items.length > 0
    if (hasItems && !window.confirm('This will discard your current tier list. Continue?')) return
    navigate('/')
  }

  function handleClearAll() {
    if (state.items.length === 0) return
    if (!window.confirm('Remove all items from the tier list?')) return
    dispatch({ type: 'CLEAR_ALL_ITEMS' })
  }

  const handleTapTier = useCallback((tierId) => {
    if (selectedItemId && window.innerWidth < 768) {
      dispatch({ type: 'MOVE_ITEM_TO_TIER', itemId: selectedItemId, tierId })
      setSelectedItemId(null)
    }
  }, [selectedItemId, dispatch])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="mx-auto p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px] min-h-screen flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-extrabold text-white">Rankify</h1>
          <div className="flex items-center gap-3">
            <TemplateManager state={state} dispatch={dispatch} />
            {state.items.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-gray-500 hover:text-red-400 text-sm transition-colors cursor-pointer font-medium"
              >
                Clear All
              </button>
            )}
            <button
              onClick={handleGoToStart}
              className="text-gray-500 hover:text-white text-sm transition-colors cursor-pointer font-medium"
            >
              New List
            </button>
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-[#2a2a2a]">
              <span className="text-gray-400 text-sm">{user.displayName}</span>
              <button
                onClick={onLogout}
                className="text-gray-600 hover:text-red-400 text-xs transition-colors cursor-pointer"
              >
                Log out
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-6 flex-1">
          <div className="flex-1 min-w-0 flex flex-col">
            <TierCanvas
              ref={canvasRef}
              state={state}
              dispatch={dispatch}
              selectedItemId={selectedItemId}
              onTapTier={handleTapTier}
            />
          </div>

          <div className="md:w-[260px] lg:w-[280px] xl:w-[320px] shrink-0">
            <ItemPool
              items={state.items}
              pool={state.pool}
              dispatch={dispatch}
              selectedItemId={selectedItemId}
              onSelectItem={setSelectedItemId}
              canvasRef={canvasRef}
            />
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeItem && (
          <div className="w-16 h-16 opacity-80">
            <ItemCard item={activeItem} isDragOverlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default function App() {
  return (
    <SocketProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </SocketProvider>
  )
}
