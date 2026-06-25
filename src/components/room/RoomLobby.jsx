import { useState } from 'react'
import PlayerList from './PlayerList'

export default function RoomLobby({ room, isAdmin, onAdvance }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${window.location.origin}/room/${room.slug}`

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Waiting Room</h2>
        <p className="text-gray-500">Share the link to invite players</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
          <span className="text-white text-sm truncate flex-1 font-mono">{shareUrl}</span>
          <button
            onClick={copyLink}
            className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer bg-white/[0.08] hover:bg-white/[0.12] text-white"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-3">Players ({room.players.length})</h3>
          <PlayerList players={room.players} adminId={room.adminId} />
        </div>

        {isAdmin && (
          <button
            onClick={onAdvance}
            disabled={room.players.length < 1}
            className="w-full py-3 bg-gradient-to-br from-neutral-700 to-neutral-800 text-white text-lg font-semibold rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.08)] hover:scale-[1.01] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start Setup
          </button>
        )}

        {!isAdmin && (
          <p className="text-gray-500 text-sm text-center">Waiting for admin to start setup...</p>
        )}
      </div>
    </div>
  )
}
