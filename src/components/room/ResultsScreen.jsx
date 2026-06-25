import { useRef } from 'react'
import { exportTierListAsImage } from '../../utils/exportImage'

export default function ResultsScreen({ room, finalResults, onPlayAgain }) {
  const canvasRef = useRef(null)

  if (!finalResults) return null

  const { results: tierPlacements, room: finalRoom } = finalResults
  const tiers = finalRoom?.template?.tiers || room.template.tiers
  const items = finalRoom?.template?.items || room.template.items

  function getItem(itemId) {
    return items.find(i => i.id === itemId)
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Results</h2>
        <p className="text-gray-500">Here's how everyone ranked the items</p>
      </div>

      <div ref={canvasRef} className="bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden">
        {tiers.map(tier => {
          const placedItemIds = tierPlacements[tier.id] || []
          return (
            <div key={tier.id} className="flex border-b border-[#2a2a2a] last:border-b-0 min-h-[70px]">
              <div
                className="w-[90px] flex items-center justify-center font-bold text-sm text-black/80 shrink-0"
                style={{ backgroundColor: tier.color }}
              >
                {tier.name}
              </div>
              <div className="flex-1 flex flex-wrap items-center gap-1.5 p-2">
                {placedItemIds.map(itemId => {
                  const item = getItem(itemId)
                  if (!item) return null
                  return (
                    <div key={itemId} className="h-[60px] w-[60px]">
                      {item.type === 'image' ? (
                        <img src={item.src} alt="" className="w-full h-full object-cover rounded" />
                      ) : (
                        <div
                          className="w-full h-full rounded flex items-center justify-center p-1"
                          style={{ backgroundColor: item.bgColor || '#555' }}
                        >
                          <span className="text-white text-[10px] font-medium text-center leading-tight truncate">
                            {item.label}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => canvasRef.current && exportTierListAsImage(canvasRef.current)}
          className="px-6 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium rounded-xl border border-white/[0.08] transition-colors cursor-pointer"
        >
          Export PNG
        </button>
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="px-6 py-2.5 bg-gradient-to-br from-neutral-700 to-neutral-800 text-white font-medium rounded-xl transition-all hover:scale-[1.02] cursor-pointer"
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  )
}
