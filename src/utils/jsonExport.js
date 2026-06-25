export function exportStateAsJson(state) {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tiers: state.tiers,
    items: state.items,
    pool: state.pool,
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = 'rankify-tierlist.json'
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function importStateFromJson(text) {
  try {
    const data = JSON.parse(text)
    if (!Array.isArray(data.tiers) || !Array.isArray(data.items) || !Array.isArray(data.pool)) {
      return null
    }
    return { tiers: data.tiers, items: data.items, pool: data.pool }
  } catch {
    return null
  }
}
