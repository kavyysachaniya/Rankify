import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRoom } from '../../hooks/useRoom'
import { useRanking } from '../../hooks/useRanking'
import RoomHeader from './RoomHeader'
import RoomLobby from './RoomLobby'
import RoomSetup from './RoomSetup'
import RankingPhase from './RankingPhase'
import ResultsScreen from './ResultsScreen'

export default function RoomView() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { room, error, isAdmin, joinRoom, createRoom, advancePhase, updateTemplate, updateTimer } = useRoom()
  const ranking = useRanking()
  const [joinName, setJoinName] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState(null)

  const isCreating = slug === 'new'

  async function handleJoin(e) {
    e.preventDefault()
    if (!joinName.trim()) return
    setJoining(true)
    setJoinError(null)

    if (isCreating) {
      const res = await createRoom(joinName.trim())
      if (res.ok) {
        window.history.replaceState(null, '', `/room/${res.room.slug}`)
      } else {
        setJoinError(res.error || 'Failed to create room')
      }
    } else {
      const res = await joinRoom(slug, joinName.trim())
      if (!res.ok) {
        setJoinError(res.error || 'Failed to join room')
      }
    }
    setJoining(false)
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <form onSubmit={handleJoin} className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-4xl font-extrabold text-white">Rankify</h1>
            <p className="text-gray-500">{isCreating ? 'Create a new room' : `Join room ${slug}`}</p>
          </div>

          <input
            value={joinName}
            onChange={e => setJoinName(e.target.value)}
            placeholder="Your display name"
            className="w-full bg-white/[0.05] text-white rounded-xl px-4 py-3 outline-none border border-white/[0.08] focus:border-white/20 transition-colors"
            autoFocus
          />

          {(joinError || error) && (
            <p className="text-red-400 text-sm text-center">{joinError || error}</p>
          )}

          <button
            type="submit"
            disabled={joining || !joinName.trim()}
            className="w-full py-3 bg-gradient-to-br from-neutral-700 to-neutral-800 text-white text-lg font-semibold rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.08)] hover:scale-[1.01] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {joining ? 'Connecting...' : isCreating ? 'Create Room' : 'Join Room'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2 text-gray-500 hover:text-white text-sm transition-colors cursor-pointer"
          >
            Back to Home
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <RoomHeader slug={room.slug} phase={room.phase} playerCount={room.players.length} />

      <div className="flex-1">
        {room.phase === 'LOBBY' && (
          <RoomLobby room={room} isAdmin={isAdmin} onAdvance={advancePhase} />
        )}

        {room.phase === 'SETUP' && (
          <RoomSetup
            room={room}
            isAdmin={isAdmin}
            onUpdateTemplate={updateTemplate}
            onUpdateTimer={updateTimer}
            onAdvance={advancePhase}
          />
        )}

        {room.phase === 'RANKING' && !ranking.isComplete && (
          <RankingPhase room={room} ranking={ranking} />
        )}

        {(room.phase === 'RESULTS' || ranking.isComplete) && (
          <ResultsScreen
            room={room}
            finalResults={ranking.finalResults}
          />
        )}
      </div>
    </div>
  )
}
