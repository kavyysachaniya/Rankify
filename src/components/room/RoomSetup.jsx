import { useRef, useState, useCallback } from 'react'
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
import { useTierList } from '../../hooks/useTierList'
import TierCanvas from '../TierCanvas'
import ItemPool from '../ItemPool'
import ItemCard from '../ItemCard'
import CommunityTemplates from '../CommunityTemplates'

function collisionDetection(args) {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions
  return rectIntersection(args)
}

const TIMER_OPTIONS = [
  { value: 15, label: '15 sec' },
  { value: 30, label: '30 sec' },
  { value: 45, label: '45 sec' },
  { value: 60, label: '60 sec' },
  { value: 90, label: '90 sec' },
  { value: 120, label: '2 min' },
]

export default function RoomSetup({ room, isAdmin, onUpdateTemplate, onUpdateTimer, onAdvance }) {
  if (isAdmin) {
    return <AdminSetup room={room} onUpdateTemplate={onUpdateTemplate} onUpdateTimer={onUpdateTimer} onAdvance={onAdvance} />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Setting Up...</h2>
        <p className="text-gray-500">The admin is preparing the template</p>
      </div>
      {room.template.tiers.length > 0 && (
        <div className="w-full max-w-2xl">
          <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-2 text-center">Preview</p>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
            {room.template.tiers.map(tier => (
              <div key={tier.id} className="flex items-center border-b border-[#2a2a2a] last:border-b-0">
                <div className="w-20 h-10 flex items-center justify-center font-bold text-xs text-black/80 shrink-0" style={{ backgroundColor: tier.color }}>
                  {tier.name}
                </div>
                <div className="flex-1 px-2 py-1 text-gray-600 text-xs">
                  {tier.items.length > 0 ? `${tier.items.length} items` : ''}
                </div>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-xs text-center mt-2">{room.template.pool.length} items in pool</p>
        </div>
      )}
    </div>
  )
}

function AdminSetup({ room, onUpdateTemplate, onUpdateTimer, onAdvance }) {
  const { state, dispatch } = useTierList('room-setup')
  const canvasRef = useRef(null)
  const [activeId, setActiveId] = useState(null)
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [timerSeconds, setTimerSeconds] = useState(room.timerSeconds || 30)
  const [showTemplates, setShowTemplates] = useState(false)

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

  const handleTapTier = useCallback((tierId) => {
    if (selectedItemId && window.innerWidth < 768) {
      dispatch({ type: 'MOVE_ITEM_TO_TIER', itemId: selectedItemId, tierId })
      setSelectedItemId(null)
    }
  }, [selectedItemId, dispatch])

  function handleLoadTemplate(data) {
    dispatch({ type: 'LOAD_TEMPLATE', data })
    setShowTemplates(false)
  }

  function handleStartRanking() {
    if (state.pool.length === 0) {
      alert('Add at least one item to the pool before starting')
      return
    }
    const template = {
      tiers: state.tiers.map(t => ({ ...t, items: [] })),
      items: state.items,
      pool: state.pool,
    }
    onUpdateTemplate(template)
    onUpdateTimer(timerSeconds)
    setTimeout(() => onAdvance(), 300)
  }

  if (showTemplates) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Load a Template</h2>
          <button
            onClick={() => setShowTemplates(false)}
            className="text-gray-500 hover:text-white text-sm transition-colors cursor-pointer"
          >
            Back to Editor
          </button>
        </div>
        <CommunityTemplates onLoadTemplate={handleLoadTemplate} />
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 hover:text-white text-sm font-medium rounded-xl border border-white/[0.08] transition-colors cursor-pointer"
          >
            Load Template
          </button>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Timer:</span>
            <select
              value={timerSeconds}
              onChange={e => setTimerSeconds(Number(e.target.value))}
              className="bg-[#111] border border-[#2a2a2a] text-white px-3 py-1.5 text-sm rounded cursor-pointer outline-none"
            >
              {TIMER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleStartRanking}
            className="ml-auto px-6 py-2.5 bg-gradient-to-br from-green-600 to-green-700 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] cursor-pointer"
          >
            Start Ranking
          </button>
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
