import { useState, useRef } from 'react'
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
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import TierRow from '../TierRow'
import ItemCard from '../ItemCard'

function collisionDetection(args) {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions
  return rectIntersection(args)
}

export default function RankingPhase({ room, ranking }) {
  const { currentItem, itemIndex, totalItems, timerRemaining, hasVoted, submitVote, allItemResults } = ranking
  const progress = totalItems > 0 ? ((itemIndex + 1) / totalItems) * 100 : 0

  const [myPlacement, setMyPlacement] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const prevItemIdRef = useRef(currentItem?.id)

  if (prevItemIdRef.current !== currentItem?.id) {
    prevItemIdRef.current = currentItem?.id
    if (myPlacement !== null) setMyPlacement(null)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const tiers = room.template.tiers
  const allItems = room.template.items

  const tiersForDisplay = tiers.map(tier => {
    const rankedItemIds = Object.entries(allItemResults)
      .filter(([, tierId]) => tierId === tier.id)
      .map(([itemId]) => itemId)

    const myItemIds = myPlacement && myPlacement.tierId === tier.id
      && !allItemResults[myPlacement.itemId]
      ? [myPlacement.itemId]
      : []

    return {
      ...tier,
      items: [...rankedItemIds, ...myItemIds],
    }
  })

  const showInPool = currentItem && !myPlacement

  function handleDragStart(event) {
    setActiveId(event.active.id)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)
    if (!over || !currentItem || hasVoted) return
    if (active.id !== currentItem.id) return

    let targetTierId = null

    if (typeof over.id === 'string' && over.id.startsWith('tier-')) {
      targetTierId = over.id.replace('tier-', '')
    } else {
      for (const tier of tiersForDisplay) {
        if (tier.items.includes(over.id)) {
          targetTierId = tier.id
          break
        }
      }
    }

    if (!targetTierId) return

    const tierIndex = tiers.findIndex(t => t.id === targetTierId)
    if (tierIndex === -1) return

    setMyPlacement({ itemId: currentItem.id, tierId: targetTierId })
    submitVote(currentItem.id, tierIndex)
  }

  const activeItem = activeId ? allItems.find(i => i.id === activeId) : null

  return (
    <div className="mx-auto p-4 md:p-6 space-y-4 md:space-y-6 max-w-[1600px] min-h-screen flex flex-col">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 font-medium">Item {itemIndex + 1} of {totalItems}</span>
          <TimerDisplay remaining={timerRemaining} total={room.timerSeconds} />
        </div>
        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        {hasVoted && (
          <p className="text-amber-400/80 text-xs text-center font-medium">Waiting for other players...</p>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-6 flex-1">
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="bg-[#1a1a1a] overflow-hidden border border-[#2a2a2a] flex-1 flex flex-col">
              {tiersForDisplay.map(tier => (
                <TierRow
                  key={tier.id}
                  tier={tier}
                  items={allItems}
                  readOnly
                  onEdit={() => {}}
                  onMoveUp={() => {}}
                  onMoveDown={() => {}}
                  onRemoveItem={() => {}}
                />
              ))}
            </div>
          </div>

          <div className="md:w-[260px] lg:w-[280px] xl:w-[320px] shrink-0">
            <RankingPool
              currentItem={showInPool ? currentItem : null}
              hasVoted={hasVoted}
            />
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
    </div>
  )
}

function RankingPool({ currentItem, hasVoted }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' })
  const poolItems = currentItem ? [currentItem.id] : []

  return (
    <div
      ref={setNodeRef}
      className={`bg-[#1a1a1a] border border-[#2a2a2a] p-3 md:h-full md:sticky md:top-4 transition-colors duration-200 flex flex-col ${
        isOver ? 'bg-[#222]' : ''
      }`}
    >
      <h3 className="text-gray-500 text-xs font-semibold tracking-wider uppercase mb-2">Unranked</h3>

      <div className="flex-1 flex flex-col">
        <SortableContext items={poolItems} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-2">
            {currentItem && (
              <ItemCard
                key={currentItem.id}
                item={currentItem}
                onRemove={() => {}}
              />
            )}
          </div>
        </SortableContext>

        {!currentItem && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-600 text-sm text-center px-4">
              {hasVoted ? 'Waiting for others...' : 'Waiting for next item...'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function TimerDisplay({ remaining, total }) {
  const pct = total > 0 ? (remaining / total) * 100 : 0
  const isLow = remaining <= 5
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${isLow ? 'bg-red-500' : 'bg-amber-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-mono font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
        {remaining}s
      </span>
    </div>
  )
}
