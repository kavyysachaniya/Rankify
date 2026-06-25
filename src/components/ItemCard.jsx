import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ASPECT_CLASS_MAP } from '../constants/aspectRatios'

export default function ItemCard({ item, onRemove, onSelect, isSelected, isDragOverlay, compact }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isDragOverlay })

  const style = isDragOverlay ? {} : {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const aspectClass = compact
    ? 'h-full ' + (ASPECT_CLASS_MAP[item.aspectRatio] || 'aspect-square')
    : (ASPECT_CLASS_MAP[item.aspectRatio] || 'aspect-square')

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onSelect?.() }}
      className={`group relative rounded-lg overflow-hidden shadow-lg cursor-grab active:cursor-grabbing ${aspectClass} ${isSelected ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-[#09090b]' : ''} hover:ring-1 hover:ring-white/20 transition-all duration-150`}
    >
      {item.type === 'image' ? (
        <img src={item.src} alt="" className="w-full h-full object-cover" draggable={false} />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center p-1 text-white text-xs font-semibold text-center"
          style={{
            backgroundColor: item.bgColor,
            backgroundImage: item.bgImage ? `url(${item.bgImage})` : undefined,
            backgroundSize: 'cover',
          }}
        >
          {item.icon && <img src={item.icon} alt="" className="w-6 h-6 mb-1" draggable={false} />}
          <span className="break-words">{item.label}</span>
        </div>
      )}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
          className="hover-control absolute top-0 right-0 bg-black/70 hover:bg-red-600 text-white/80 hover:text-white w-5 h-5 text-xs flex items-center justify-center rounded-bl-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
        >
          ×
        </button>
      )}
    </div>
  )
}
