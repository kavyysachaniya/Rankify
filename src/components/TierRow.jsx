import { useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import ItemCard from './ItemCard'

export default function TierRow({ tier, items, onEdit, onMoveUp, onMoveDown, onRemoveItem, onTapTier, selectedItemId, readOnly }) {
  const { setNodeRef, isOver } = useDroppable({ id: `tier-${tier.id}` })

  const tierItems = tier.items.map(id => items.find(i => i.id === id)).filter(Boolean)

  function renderLabel() {
    const base = "w-[100px] md:w-[90px] min-h-[90px] md:min-h-[80px] flex items-center justify-center font-bold text-base lg:text-sm shrink-0 relative group/label select-none"

    if (tier.visualMode === 'bgImage' && tier.bgImage) {
      return (
        <div className={base} style={{ backgroundImage: `url(${tier.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <span className="relative z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] text-white">{tier.name}</span>
          {!readOnly && <EditOverlay onEdit={onEdit} />}
        </div>
      )
    }
    if (tier.visualMode === 'icon' && tier.icon) {
      return (
        <div className={base} style={{ backgroundColor: tier.color }}>
          <div className="flex flex-col items-center gap-1">
            <img src={tier.icon} alt="" className="w-8 h-8 object-contain" draggable={false} />
            <span className="text-xs font-semibold text-black/80">{tier.name}</span>
          </div>
          {!readOnly && <EditOverlay onEdit={onEdit} />}
        </div>
      )
    }
    return (
      <div className={base} style={{ backgroundColor: tier.color }}>
        <span className="text-black/80">{tier.name || '?'}</span>
        {!readOnly && <EditOverlay onEdit={onEdit} />}
      </div>
    )
  }

  return (
    <div
      className="flex border-b border-[#2a2a2a] min-h-[90px] md:min-h-[80px]"
      onClick={() => onTapTier?.(tier.id)}
    >
      {renderLabel()}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-wrap items-center gap-1 p-1 min-h-[90px] md:min-h-[80px] transition-colors duration-200 ${isOver ? 'bg-white/[0.04]' : ''}`}
      >
        <SortableContext items={tier.items} strategy={horizontalListSortingStrategy}>
          {tierItems.map(item => (
            <div key={item.id} className="h-[80px] md:h-[72px]">
              <ItemCard
                item={item}
                onRemove={onRemoveItem}
                isSelected={selectedItemId === item.id}
                compact
              />
            </div>
          ))}
        </SortableContext>
      </div>
      {!readOnly && (
        <div className="hover-control flex items-center gap-0.5 px-1 shrink-0 bg-black/40">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="text-white/70 hover:text-white p-1 transition-colors cursor-pointer"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M8.34 1.804A1 1 0 019.32 1h1.36a1 1 0 01.98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 011.262.125l.962.962a1 1 0 01.125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 01.804.98v1.362a1 1 0 01-.804.98l-1.473.295a6.95 6.95 0 01-.587 1.416l.834 1.25a1 1 0 01-.125 1.262l-.962.962a1 1 0 01-1.262.125l-1.25-.834a6.953 6.953 0 01-1.416.587l-.294 1.473a1 1 0 01-.98.804H9.32a1 1 0 01-.98-.804l-.295-1.473a6.957 6.957 0 01-1.416-.587l-1.25.834a1 1 0 01-1.262-.125l-.962-.962a1 1 0 01-.125-1.262l.834-1.25a6.957 6.957 0 01-.587-1.416l-1.473-.294A1 1 0 011 10.68V9.32a1 1 0 01.804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 01.125-1.262l.962-.962A1 1 0 015.38 3.03l1.25.834a6.957 6.957 0 011.416-.587l.294-1.473zM13 10a3 3 0 11-6 0 3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex flex-col">
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp() }}
              className="text-white/70 hover:text-white p-0.5 transition-colors cursor-pointer"
              title="Move up"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown() }}
              className="text-white/70 hover:text-white p-0.5 transition-colors cursor-pointer"
              title="Move down"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EditOverlay({ onEdit }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onEdit() }}
      className="hover-control absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/label:opacity-100 transition-opacity cursor-pointer text-white/80 hover:text-white"
    >
      ✏️
    </button>
  )
}
