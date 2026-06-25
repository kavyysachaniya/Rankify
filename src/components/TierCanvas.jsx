import { forwardRef, useState } from 'react'
import TierRow from './TierRow'
import TierEditModal from './TierEditModal'

const TierCanvas = forwardRef(function TierCanvas({ state, dispatch, selectedItemId, onTapTier, readOnly }, ref) {
  const [editingTier, setEditingTier] = useState(null)

  function handleSaveTier(updates) {
    dispatch({ type: 'UPDATE_TIER', tierId: editingTier.id, updates })
    setEditingTier(null)
  }

  function handleDeleteTier(tierId) {
    dispatch({ type: 'REMOVE_TIER', tierId })
    setEditingTier(null)
  }

  function handleMoveUp(index) {
    if (index === 0) return
    const newTiers = [...state.tiers]
    ;[newTiers[index - 1], newTiers[index]] = [newTiers[index], newTiers[index - 1]]
    dispatch({ type: 'REORDER_TIERS', tiers: newTiers })
  }

  function handleMoveDown(index) {
    if (index === state.tiers.length - 1) return
    const newTiers = [...state.tiers]
    ;[newTiers[index], newTiers[index + 1]] = [newTiers[index + 1], newTiers[index]]
    dispatch({ type: 'REORDER_TIERS', tiers: newTiers })
  }

  return (
    <>
      <div ref={ref} className="bg-[#1a1a1a] overflow-hidden border border-[#2a2a2a] flex-1 flex flex-col">
        {state.tiers.map((tier, index) => (
          <TierRow
            key={tier.id}
            tier={tier}
            items={state.items}
            onEdit={() => setEditingTier(tier)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            onRemoveItem={(itemId) => dispatch({ type: 'REMOVE_ITEM', itemId })}
            onTapTier={onTapTier}
            selectedItemId={selectedItemId}
            readOnly={readOnly}
          />
        ))}
        {!readOnly && (
          <button
            onClick={() => dispatch({ type: 'ADD_TIER' })}
            className="w-full py-2 text-gray-500 hover:text-white hover:bg-white/[0.03] transition-all text-sm cursor-pointer border-t border-[#2a2a2a] mt-auto"
          >
            + Add Row
          </button>
        )}
      </div>

      {editingTier && (
        <TierEditModal
          tier={editingTier}
          onSave={handleSaveTier}
          onDelete={handleDeleteTier}
          onClose={() => setEditingTier(null)}
        />
      )}
    </>
  )
})

export default TierCanvas
