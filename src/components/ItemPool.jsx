import { useState, useRef, useCallback, useEffect } from 'react'
import { uuid } from '../utils/uuid'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import ItemCard from './ItemCard'
import { exportTierListAsImage } from '../utils/exportImage'
import { exportStateAsJson, importStateFromJson } from '../utils/jsonExport'
import { ASPECT_OPTIONS } from '../constants/aspectRatios'

export default function ItemPool({ items, pool, dispatch, selectedItemId, onSelectItem, canvasRef, state, readOnly }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' })
  const poolItems = pool.map(id => items.find(i => i.id === id)).filter(Boolean)

  const [aspectMode, setAspectMode] = useState('square')
  const aspectModeRef = useRef(aspectMode)
  useEffect(() => { aspectModeRef.current = aspectMode }, [aspectMode])
  const [isDragOver, setIsDragOver] = useState(false)
  const [dropStatus, setDropStatus] = useState(null)
  const fileInputRef = useRef(null)
  const jsonInputRef = useRef(null)
  const dragCounterRef = useRef(0)

  const [textModal, setTextModal] = useState(false)
  const [textLabel, setTextLabel] = useState('')
  const [textBgColor, setTextBgColor] = useState('#555555')
  const [textBgImage, setTextBgImage] = useState(null)
  const [textIcon, setTextIcon] = useState(null)

  function addImageFromSrc(src) {
    const option = ASPECT_OPTIONS.find(o => o.value === aspectModeRef.current)
    const img = new Image()
    img.onload = () => {
      let cropW, cropH
      if (option.ratio >= 1) {
        cropW = Math.min(img.width, img.height * option.ratio)
        cropH = cropW / option.ratio
      } else {
        cropH = Math.min(img.height, img.width / option.ratio)
        cropW = cropH * option.ratio
      }
      const cropX = (img.width - cropW) / 2
      const cropY = (img.height - cropH) / 2

      const canvas = document.createElement('canvas')
      canvas.width = cropW
      canvas.height = cropH
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

      let finalSrc
      try {
        finalSrc = canvas.toDataURL('image/jpeg', 0.85)
      } catch {
        finalSrc = src
      }

      dispatch({
        type: 'ADD_ITEM',
        item: {
          id: uuid(),
          type: 'image',
          src: finalSrc,
          aspectRatio: option.value,
        },
      })
      setDropStatus('added')
      setTimeout(() => setDropStatus(null), 1500)
    }
    img.onerror = () => {
      setDropStatus('error')
      setTimeout(() => setDropStatus(null), 2500)
    }
    img.src = src
  }

  function loadImageUrl(url) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      try {
        addImageFromSrc(canvas.toDataURL('image/jpeg', 0.85))
      } catch {
        addImageFromSrc(url)
      }
    }
    img.onerror = () => addImageFromSrc(url)
    img.src = url
  }

  function extractImageUrl(dt) {
    const html = dt.getData('text/html')
    if (html) {
      const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
      if (match) return match[1]
    }
    const uri = dt.getData('text/uri-list') || dt.getData('text/plain') || ''
    const trimmed = uri.trim()
    if (/^https?:\/\/.+/i.test(trimmed)) return trimmed
    return null
  }

  const handleNativeDrop = useCallback((e) => {
    const hasFiles = e.dataTransfer.types.includes('Files')
    const hasUri = e.dataTransfer.types.includes('text/uri-list') || e.dataTransfer.types.includes('text/html')
    if (!hasFiles && !hasUri) return

    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    dragCounterRef.current = 0

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) {
      files.forEach(file => {
        const reader = new FileReader()
        reader.onload = () => addImageFromSrc(reader.result)
        reader.readAsDataURL(file)
      })
      return
    }

    const url = extractImageUrl(e.dataTransfer)
    if (url) {
      setDropStatus('loading')
      loadImageUrl(url)
    }
  }, [dispatch])

  const handleNativeDragOver = useCallback((e) => {
    const hasFiles = e.dataTransfer.types.includes('Files')
    const hasUri = e.dataTransfer.types.includes('text/uri-list') || e.dataTransfer.types.includes('text/html')
    if (!hasFiles && !hasUri) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleNativeDragEnter = useCallback((e) => {
    const hasFiles = e.dataTransfer.types.includes('Files')
    const hasUri = e.dataTransfer.types.includes('text/uri-list') || e.dataTransfer.types.includes('text/html')
    if (!hasFiles && !hasUri) return
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    setIsDragOver(true)
  }, [])

  const handleNativeDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current <= 0) {
      setIsDragOver(false)
      dragCounterRef.current = 0
    }
  }, [])

  function handleImageSelect(e) {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => addImageFromSrc(reader.result)
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function handleJsonImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = importStateFromJson(reader.result)
      if (!data) {
        alert('Invalid tier list file.')
        return
      }
      if (items.length > 0 && !window.confirm('This will replace your current tier list. Continue?')) return
      dispatch({ type: 'LOAD_TEMPLATE', data })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleTextFileUpload(e, setter) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setter(reader.result)
    reader.readAsDataURL(file)
  }

  function handleTextConfirm() {
    if (!textLabel.trim()) return
    dispatch({
      type: 'ADD_ITEM',
      item: {
        id: uuid(),
        type: 'text',
        label: textLabel.trim(),
        bgColor: textBgColor,
        bgImage: textBgImage,
        icon: textIcon,
      },
    })
    setTextLabel('')
    setTextBgColor('#555555')
    setTextBgImage(null)
    setTextIcon(null)
    setTextModal(false)
  }

  return (
    <>
      <div
        ref={setNodeRef}
        onDrop={handleNativeDrop}
        onDragOver={handleNativeDragOver}
        onDragEnter={handleNativeDragEnter}
        onDragLeave={handleNativeDragLeave}
        className={`bg-[#1a1a1a] border border-[#2a2a2a] p-3 md:h-full md:sticky md:top-4 transition-colors duration-200 flex flex-col ${
          isDragOver ? 'border-amber-400 bg-amber-400/5' : isOver ? 'bg-[#222]' : ''
        }`}
        onClick={() => {
          if (selectedItemId) {
            dispatch({ type: 'MOVE_ITEM_TO_POOL', itemId: selectedItemId })
            onSelectItem(null)
          }
        }}
      >
        <h3 className="text-gray-500 text-xs font-semibold tracking-wider uppercase mb-2">Unranked</h3>

        <div className="flex-1 flex flex-col">
          <SortableContext items={pool} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-2">
              {poolItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onRemove={(itemId) => dispatch({ type: 'REMOVE_ITEM', itemId })}
                  onSelect={() => onSelectItem(selectedItemId === item.id ? null : item.id)}
                  isSelected={selectedItemId === item.id}
                />
              ))}
            </div>
          </SortableContext>

          {poolItems.length === 0 && !isDragOver && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-600 text-sm text-center px-4">
                Drag & drop images here from Google, your browser, or desktop
              </p>
            </div>
          )}

          {isDragOver && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-amber-400 font-semibold text-sm">Drop images to add</p>
            </div>
          )}

          {dropStatus === 'added' && (
            <p className="text-green-400 font-semibold text-xs text-center mt-2">Image added!</p>
          )}
          {dropStatus === 'error' && (
            <p className="text-red-400 font-semibold text-xs text-center mt-2">Failed to load image</p>
          )}
        </div>

        {!readOnly && (
          <div className="mt-3 pt-3 border-t border-[#2a2a2a] space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
              className="w-full py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] border border-dashed border-[#333] hover:border-[#555] rounded transition-colors cursor-pointer"
            >
              + Browse Files
            </button>
            <select
              value={aspectMode}
              onChange={e => { e.stopPropagation(); setAspectMode(e.target.value) }}
              className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2 text-sm cursor-pointer outline-none focus:border-[#444] rounded"
            >
              {ASPECT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={(e) => { e.stopPropagation(); setTextModal(true) }}
              className="w-full py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] border border-[#2a2a2a] rounded transition-colors cursor-pointer"
            >
              + Add Text Item
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); canvasRef.current && exportTierListAsImage(canvasRef.current) }}
              className="w-full py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] border border-[#2a2a2a] rounded transition-colors cursor-pointer"
            >
              Download PNG
            </button>
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); state && exportStateAsJson(state) }}
                className="flex-1 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] border border-[#2a2a2a] rounded transition-colors cursor-pointer"
              >
                Export JSON
              </button>
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleJsonImport}
                className="hidden"
              />
              <button
                onClick={(e) => { e.stopPropagation(); jsonInputRef.current?.click() }}
                className="flex-1 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] border border-[#2a2a2a] rounded transition-colors cursor-pointer"
              >
                Import JSON
              </button>
            </div>
          </div>
        )}
      </div>

      {textModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setTextModal(false)}>
          <div className="bg-[#141416] rounded-2xl p-6 w-80 max-w-[90vw] space-y-4 border border-white/[0.08] shadow-[0_8px_60px_rgba(0,0,0,0.6)]" onClick={e => e.stopPropagation()}>
            <h3 className="text-white text-lg font-bold">Add Text Item</h3>
            <label className="block">
              <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Label *</span>
              <input
                value={textLabel}
                onChange={e => setTextLabel(e.target.value)}
                className="mt-1 w-full bg-white/[0.05] text-white rounded-lg px-3 py-2 outline-none border border-white/[0.08] focus:border-white/20 transition-colors"
                placeholder="Enter label..."
              />
            </label>
            <label className="block">
              <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Background Color</span>
              <input type="color" value={textBgColor} onChange={e => setTextBgColor(e.target.value)} className="mt-1 block w-full h-10 rounded-lg cursor-pointer border border-white/[0.08]" />
            </label>
            <label className="block">
              <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Background Image (optional)</span>
              <input type="file" accept="image/*" onChange={e => handleTextFileUpload(e, setTextBgImage)} className="mt-1 text-gray-400 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-neutral-600 file:text-white file:text-sm file:cursor-pointer" />
            </label>
            <label className="block">
              <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Icon (optional)</span>
              <input type="file" accept="image/*" onChange={e => handleTextFileUpload(e, setTextIcon)} className="mt-1 text-gray-400 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-neutral-600 file:text-white file:text-sm file:cursor-pointer" />
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={handleTextConfirm} className="flex-1 bg-neutral-600 hover:bg-neutral-500 text-white py-2.5 rounded-xl font-semibold transition-colors cursor-pointer">
                Add
              </button>
              <button onClick={() => setTextModal(false)} className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer border border-white/[0.08]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
