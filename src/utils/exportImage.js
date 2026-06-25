import { toPng } from 'html-to-image'

export async function exportTierListAsImage(element) {
  element.classList.add('exporting')
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#07070a',
      pixelRatio: 2,
      cacheBust: true,
    })
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
