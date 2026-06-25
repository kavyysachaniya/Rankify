export const ASPECT_OPTIONS = [
  { value: 'square', label: 'Square (1:1)', ratio: 1 },
  { value: 'landscape', label: 'Landscape (16:9)', ratio: 16 / 9 },
  { value: 'landscape-4-3', label: 'Landscape (4:3)', ratio: 4 / 3 },
  { value: 'portrait', label: 'Portrait (9:16)', ratio: 9 / 16 },
  { value: 'portrait-3-4', label: 'Portrait (3:4)', ratio: 3 / 4 },
]

export const ASPECT_CLASS_MAP = {
  landscape: 'aspect-video',
  portrait: 'aspect-[9/16]',
  'landscape-4-3': 'aspect-[4/3]',
  'portrait-3-4': 'aspect-[3/4]',
}
