import { readAndCompressImage } from 'browser-image-resizer'

export default async (file) => {
  const config = {
    quality: 0.5,
    maxWidth: 300,
    maxHeight: 300,
    autoRotate: true
  }
  let thumbnail
  if (file.size > 10 * 1024) thumbnail = await readAndCompressImage(file, config)
  else thumbnail = file
  return thumbnail
}
