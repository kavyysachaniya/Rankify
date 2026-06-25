export default function PlayerList({ players, adminId, votedPlayerIds }) {
  return (
    <div className="space-y-1.5">
      {players.map(player => (
        <div
          key={player.id}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03]"
        >
          <div className={`w-2 h-2 rounded-full ${player.connected !== false ? 'bg-green-400' : 'bg-gray-600'}`} />
          <span className="text-sm text-white truncate">{player.displayName}</span>
          {player.id === adminId && (
            <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Admin
            </span>
          )}
          {votedPlayerIds && votedPlayerIds.has(player.id) && (
            <svg className="w-4 h-4 text-green-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      ))}
    </div>
  )
}
