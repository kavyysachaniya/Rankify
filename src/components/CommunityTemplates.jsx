import { useState } from 'react'
import templates from '../data/community-templates.json'
import TemplateCard from './TemplateCard'

const CATEGORIES = ['all', ...new Set(templates.map(t => t.category))]

export default function CommunityTemplates({ onLoadTemplate }) {
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = activeCategory === 'all'
    ? templates
    : templates.filter(t => t.category === activeCategory)

  return (
    <div className="w-full max-w-3xl">
      <h2 className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-4 text-center">
        Templates
      </h2>

      <div className="flex justify-center gap-2 mb-5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer capitalize ${
              activeCategory === cat
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={onLoadTemplate}
          />
        ))}
      </div>
    </div>
  )
}
