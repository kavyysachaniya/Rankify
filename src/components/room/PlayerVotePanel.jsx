export default function PlayerVotePanel({ tiers, onVote, hasVoted, selectedTier }) {
  return (
    <div className="space-y-2">
      {tiers.map((tier, index) => (
        <button
          key={tier.id}
          onClick={() => !hasVoted && onVote(index)}
          disabled={hasVoted}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer ${
            selectedTier === index
              ? 'border-white/30 bg-white/[0.08] scale-[1.01]'
              : hasVoted
                ? 'border-white/[0.04] bg-white/[0.02] opacity-50 cursor-not-allowed'
                : 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12]'
          }`}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-black/80 shrink-0"
            style={{ backgroundColor: tier.color }}
          >
            {tier.name[0]}
          </div>
          <span className="text-white font-medium text-sm">{tier.name}</span>
          {selectedTier === index && (
            <svg className="w-5 h-5 text-green-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      ))}
    </div>
  )
}
