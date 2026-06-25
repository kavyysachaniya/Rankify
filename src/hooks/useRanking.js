import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '../context/SocketContext'

export function useRanking() {
  const socket = useSocket()
  const [currentItem, setCurrentItem] = useState(null)
  const [itemIndex, setItemIndex] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [timerRemaining, setTimerRemaining] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [voteCounts, setVoteCounts] = useState({ totalVotes: 0, totalPlayers: 0 })
  const [lastResult, setLastResult] = useState(null)
  const [allItemResults, setAllItemResults] = useState({})
  const [finalResults, setFinalResults] = useState(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!socket) return

    function onNextItem({ item, index, total }) {
      setCurrentItem(item)
      setItemIndex(index)
      setTotalItems(total)
      setHasVoted(false)
      setSelectedTier(null)
      setVoteCounts({ totalVotes: 0, totalPlayers: 0 })
      setLastResult(null)
    }

    function onTimerTick({ remaining }) {
      setTimerRemaining(remaining)
    }

    function onVoteReceived({ totalVotes, totalPlayers }) {
      setVoteCounts({ totalVotes, totalPlayers })
    }

    function onItemResult(result) {
      setLastResult(result)
      setAllItemResults(prev => ({ ...prev, [result.itemId]: result.tierId }))
    }

    function onComplete({ results, room }) {
      setFinalResults({ results, room })
      setIsComplete(true)
      setCurrentItem(null)
    }

    socket.on('ranking:next-item', onNextItem)
    socket.on('ranking:timer-tick', onTimerTick)
    socket.on('ranking:vote-received', onVoteReceived)
    socket.on('ranking:item-result', onItemResult)
    socket.on('ranking:complete', onComplete)

    return () => {
      socket.off('ranking:next-item', onNextItem)
      socket.off('ranking:timer-tick', onTimerTick)
      socket.off('ranking:vote-received', onVoteReceived)
      socket.off('ranking:item-result', onItemResult)
      socket.off('ranking:complete', onComplete)
    }
  }, [socket])

  const submitVote = useCallback((itemId, tierIndex) => {
    if (!socket || hasVoted) return
    socket.emit('ranking:submit-vote', { itemId, tierIndex }, (res) => {
      if (res.ok) {
        setHasVoted(true)
        setSelectedTier(tierIndex)
      }
    })
  }, [socket, hasVoted])

  const reset = useCallback(() => {
    setCurrentItem(null)
    setItemIndex(0)
    setTotalItems(0)
    setTimerRemaining(0)
    setHasVoted(false)
    setSelectedTier(null)
    setVoteCounts({ totalVotes: 0, totalPlayers: 0 })
    setLastResult(null)
    setAllItemResults({})
    setFinalResults(null)
    setIsComplete(false)
  }, [])

  return {
    currentItem,
    itemIndex,
    totalItems,
    timerRemaining,
    hasVoted,
    selectedTier,
    voteCounts,
    lastResult,
    allItemResults,
    finalResults,
    isComplete,
    submitVote,
    reset,
  }
}
