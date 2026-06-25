const PHASE_LABELS = {
  LOBBY: 'Lobby',
  SETUP: 'Setup',
  RANKING: 'Ranking',
  RESULTS: 'Results',
}

const PHASE_COLORS = {
  LOBBY: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  SETUP: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  RANKING: 'bg-green-500/10 text-green-400 border-green-500/20',
  RESULTS: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export default function RoomHeader({ slug, phase, playerCount }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#111] border-b border-[#2a2a2a]">
      <h1 className="text-xl font-extrabold text-white">Rankify</h1>
      <div className="flex items-center gap-2 ml-auto">
        <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-full border ${PHASE_COLORS[phase] || PHASE_COLORS.LOBBY}`}>
          {PHASE_LABELS[phase] || phase}
        </span>
        <span className="text-gray-500 text-sm">{playerCount} player{playerCount !== 1 ? 's' : ''}</span>
        <span className="text-gray-600 text-xs font-mono bg-white/[0.04] px-2 py-1 rounded">{slug}</span>
      </div>
    </div>
  )
}
