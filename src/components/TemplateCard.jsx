const CATEGORY_COLORS = {
  movies: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  games: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  sports: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  music: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  anime: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  food: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
}

export default function TemplateCard({ template, onUse }) {
  const colors = CATEGORY_COLORS[template.category] || CATEGORY_COLORS.movies
  const tierPreview = template.data.tiers.slice(0, 5)

  return (
    <button
      onClick={() => onUse(template.data)}
      className="group w-full text-left bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.12] hover:scale-[1.02] cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1">
          {tierPreview.map(tier => (
            <div
              key={tier.id}
              className="w-5 h-5 rounded-md text-[9px] font-bold flex items-center justify-center text-white/80"
              style={{ backgroundColor: tier.color }}
            >
              {tier.name[0]}
            </div>
          ))}
        </div>
      </div>

      <h3 className="text-white font-semibold text-sm mb-2 group-hover:text-white/90 leading-tight">
        {template.name}
      </h3>

      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
          {template.category}
        </span>
        <span className="text-gray-600 text-xs">
          {template.itemCount} items
        </span>
      </div>
    </button>
  )
}
