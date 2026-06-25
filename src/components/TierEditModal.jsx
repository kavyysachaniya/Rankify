import { useState } from 'react'

export default function TierEditModal({ tier, onSave, onDelete, onClose }) {
  const [name, setName] = useState(tier.name)
  const [color, setColor] = useState(tier.color)
  const [visualMode, setVisualMode] = useState(tier.visualMode)
  const [bgImage, setBgImage] = useState(tier.bgImage)
  const [icon, setIcon] = useState(tier.icon)

  function handleFileUpload(e, setter) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setter(reader.result)
    reader.readAsDataURL(file)
  }

  function handleSave() {
    onSave({ name, color, visualMode, bgImage, icon })
  }

  function handleDelete() {
    if (window.confirm(`Delete tier "${tier.name || 'Untitled'}"? Items will move to the pool.`)) {
      onDelete(tier.id)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#141416] rounded-2xl p-6 w-80 max-w-[90vw] space-y-4 border border-white/[0.08] shadow-[0_8px_60px_rgba(0,0,0,0.6)]" onClick={e => e.stopPropagation()}>
        <h3 className="text-white text-lg font-bold">Edit Tier</h3>

        <label className="block">
          <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Name</span>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tier name..."
            className="mt-1 w-full bg-white/[0.05] text-white rounded-lg px-3 py-2 outline-none border border-white/[0.08] focus:border-white/20 transition-colors"
          />
        </label>

        <label className="block">
          <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Color</span>
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="mt-1 block w-full h-10 rounded-lg cursor-pointer border border-white/[0.08]"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Visual Mode</legend>
          {['color', 'bgImage', 'icon'].map(mode => (
            <label key={mode} className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer hover:text-white transition-colors">
              <input
                type="radio"
                name="visualMode"
                value={mode}
                checked={visualMode === mode}
                onChange={() => setVisualMode(mode)}
                className="accent-neutral-400"
              />
              {mode === 'color' ? 'Color only' : mode === 'bgImage' ? 'Background image' : 'Icon + text'}
            </label>
          ))}
        </fieldset>

        {visualMode === 'bgImage' && (
          <label className="block">
            <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Background Image</span>
            <input type="file" accept="image/*" onChange={e => handleFileUpload(e, setBgImage)} className="mt-1 text-gray-400 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-neutral-600 file:text-white file:text-sm file:cursor-pointer" />
            {bgImage && <img src={bgImage} alt="" className="mt-2 w-16 h-16 object-cover rounded-lg" />}
          </label>
        )}

        {visualMode === 'icon' && (
          <label className="block">
            <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Icon</span>
            <input type="file" accept="image/*" onChange={e => handleFileUpload(e, setIcon)} className="mt-1 text-gray-400 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-neutral-600 file:text-white file:text-sm file:cursor-pointer" />
            {icon && <img src={icon} alt="" className="mt-2 w-8 h-8 object-contain" />}
          </label>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} className="flex-1 bg-neutral-600 hover:bg-neutral-500 text-white py-2.5 rounded-xl font-semibold transition-colors cursor-pointer">
            Save
          </button>
          <button onClick={onClose} className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer border border-white/[0.08]">
            Cancel
          </button>
        </div>

        <button
          onClick={handleDelete}
          className="w-full text-red-400/60 hover:text-red-400 text-sm transition-colors cursor-pointer pt-1"
        >
          Delete this tier
        </button>
      </div>
    </div>
  )
}
