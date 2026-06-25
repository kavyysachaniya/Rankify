export function getCroppedImage(imageSrc, crop) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onerror = () => reject(new Error('Failed to load image'))
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      canvas.width = crop.width * scaleX
      canvas.height = crop.height * scaleY

      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height,
      )
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    image.src = imageSrc
  })
}
