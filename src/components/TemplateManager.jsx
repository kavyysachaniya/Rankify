import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function TemplateManager({ state, dispatch }) {
  const { getTemplates, saveTemplate, deleteTemplate, loadTemplate } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [tab, setTab] = useState('save')
  const templates = getTemplates()

  function handleSave() {
    if (!saveName.trim()) return
    saveTemplate(saveName.trim(), state)
    setSaveName('')
    setTab('load')
  }

  function handleLoad(templateId) {
    const data = loadTemplate(templateId)
    if (!data) return
    if (state.items.length > 0 && !window.confirm('This will replace your current tier list. Continue?')) return
    dispatch({ type: 'LOAD_TEMPLATE', data })
    setShowModal(false)
  }

  function handleDelete(templateId) {
    if (!window.confirm('Delete this template?')) return
    deleteTemplate(templateId)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-gray-500 hover:text-amber-400 text-sm transition-colors cursor-pointer font-medium"
      >
        Templates
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-[#141416] rounded-2xl p-6 w-96 max-w-[90vw] max-h-[80vh] flex flex-col border border-white/[0.08] shadow-[0_8px_60px_rgba(0,0,0,0.6)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-white text-lg font-bold mb-4">My Templates</h3>

            <div className="flex gap-1 mb-4 bg-white/[0.04] rounded-lg p-1">
              <button
                onClick={() => setTab('save')}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ${tab === 'save' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
              >
                Save
              </button>
              <button
                onClick={() => setTab('load')}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ${tab === 'load' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
              >
                Load ({templates.length})
              </button>
            </div>

            {tab === 'save' && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder="Template name..."
                  className="w-full bg-white/[0.05] text-white rounded-lg px-3 py-2.5 outline-none border border-white/[0.08] focus:border-white/20 transition-colors placeholder:text-gray-600"
                />
                <p className="text-gray-600 text-xs">
                  Saves current tiers, items, and rankings to your account.
                </p>
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim()}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Save Template
                </button>
              </div>
            )}

            {tab === 'load' && (
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {templates.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-8">No saved templates yet</p>
                ) : (
                  templates.map(t => (
                    <div key={t.id} className="flex items-center gap-3 bg-white/[0.04] rounded-lg p-3 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{t.name}</p>
                        <p className="text-gray-600 text-xs">
                          {t.data.items.length} items &middot; {new Date(t.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleLoad(t.id)}
                        className="px-3 py-1 bg-white/[0.06] hover:bg-amber-500 hover:text-black text-gray-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="px-2 py-1 text-gray-600 hover:text-red-400 text-xs transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 py-2 rounded-xl font-semibold transition-colors cursor-pointer border border-white/[0.08]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
