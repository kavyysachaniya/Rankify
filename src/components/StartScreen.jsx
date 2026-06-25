import { useNavigate } from 'react-router-dom'
import CommunityTemplates from './CommunityTemplates'

export default function StartScreen({ onNewList, onLoadTemplate, user, onLogout }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-12 bg-transparent">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="text-gray-500 text-sm">{user.displayName}</span>
        <button
          onClick={onLogout}
          className="text-gray-600 hover:text-red-400 text-xs transition-colors cursor-pointer"
        >
          Log out
        </button>
      </div>

      <div className="text-center space-y-3 mt-8 mb-10">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
          Rankify
        </h1>
        <p className="text-gray-500 text-base tracking-wide uppercase font-medium">
          Rank anything. Your way.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-12">
        <button
          onClick={onNewList}
          className="group relative px-8 py-4 bg-gradient-to-br from-neutral-700 to-neutral-800 text-white text-lg font-semibold rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.08)] hover:scale-[1.02] cursor-pointer"
        >
          New Tier List
        </button>
        <button
          onClick={() => navigate('/room/new')}
          className="px-8 py-4 bg-white/[0.04] backdrop-blur text-gray-300 text-lg font-semibold rounded-2xl border border-white/10 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:text-white cursor-pointer"
        >
          Start Multiplayer
        </button>
      </div>

      <CommunityTemplates onLoadTemplate={onLoadTemplate} />
    </div>
  )
}
