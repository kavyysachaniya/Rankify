export function submitVote(room, itemId, playerId, tierIndex) {
  if (!room.votes.has(itemId)) {
    room.votes.set(itemId, new Map())
  }
  room.votes.get(itemId).set(playerId, tierIndex)

  const totalPlayers = room.players.size
  const totalVotes = room.votes.get(itemId).size
  return { totalVotes, totalPlayers, allVoted: totalVotes >= totalPlayers }
}

export function computeItemResult(room, itemId) {
  const itemVotes = room.votes.get(itemId)
  if (!itemVotes || itemVotes.size === 0) return null

  const values = Array.from(itemVotes.values())
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length
  const tierIndex = Math.round(avg)
  const clampedIndex = Math.max(0, Math.min(tierIndex, room.template.tiers.length - 1))
  const tierId = room.template.tiers[clampedIndex]?.id

  room.results.set(itemId, tierId)

  return {
    itemId,
    tierId,
    tierIndex: clampedIndex,
    average: Math.round(avg * 100) / 100,
    voteCount: values.length,
  }
}

export function getCurrentItem(room) {
  const { pool } = room.template
  if (room.currentItemIndex < 0 || room.currentItemIndex >= pool.length) return null
  const itemId = pool[room.currentItemIndex]
  return room.template.items.find(i => i.id === itemId) || null
}

export function advanceToNextItem(room) {
  room.currentItemIndex++
  if (room.currentItemIndex >= room.template.pool.length) {
    return { done: true, item: null }
  }
  return { done: false, item: getCurrentItem(room) }
}

export function computeFinalResults(room) {
  const tierPlacements = {}
  for (const tier of room.template.tiers) {
    tierPlacements[tier.id] = []
  }

  for (const [itemId, tierId] of room.results) {
    if (tierPlacements[tierId]) {
      tierPlacements[tierId].push(itemId)
    }
  }

  return tierPlacements
}
