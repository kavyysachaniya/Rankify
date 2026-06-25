import html2canvas from 'html2canvas'

function convertOklabColors(clonedDoc) {
  const all = clonedDoc.querySelectorAll('*')
  const canvas = clonedDoc.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  for (const el of all) {
    const style = el.style
    const computed = clonedDoc.defaultView?.getComputedStyle(el)
    if (!computed) continue

    const props = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor']
    for (const prop of props) {
      const val = computed[prop]
      if (val && (val.includes('oklab') || val.includes('oklch') || val.includes('color('))) {
        try {
          ctx.fillStyle = val
          const rgb = ctx.fillStyle
          style.setProperty(prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase()), rgb, 'important')
        } catch {
          style.setProperty(prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase()), '#888', 'important')
        }
      }
    }
  }
}

export async function exportTierListAsImage(element) {
  element.classList.add('exporting')
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#07070a',
      useCORS: true,
      scale: 2,
      logging: false,
      onclone: (_doc, clonedEl) => {
        convertOklabColors(clonedEl.ownerDocument)
      },
    })
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'rankify-tierlist.png'
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Export failed:', err)
    alert('Failed to export image: ' + err.message)
  } finally {
    element.classList.remove('exporting')
  }
}
