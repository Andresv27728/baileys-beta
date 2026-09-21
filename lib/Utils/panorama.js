/**
 * Panorama Profile Picture Generator
 * Creates wide banner + square thumbnail for WhatsApp profile pictures
 */

import { Boom } from '@hapi/boom'
import fs from 'fs'

const loadImageProcessor = async () => {
  try {
    const sharp = (await import('sharp')).default
    return { type: 'sharp', impl: sharp }
  } catch {}
  try {
    const jimp = await import('jimp')
    return { type: 'jimp', impl: jimp }
  } catch {}
  throw new Boom('No image processing library available (install sharp or jimp)')
}

const bufferFromSource = async (mediaUpload) => {
  if (Buffer.isBuffer(mediaUpload)) return mediaUpload
  if ('url' in mediaUpload) {
    const urlStr = mediaUpload.url.toString()
    if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
      const response = await fetch(urlStr)
      return Buffer.from(await response.arrayBuffer())
    }
    return fs.readFileSync(urlStr)
  }
  if ('stream' in mediaUpload) {
    const chunks = []
    for await (const chunk of mediaUpload.stream) chunks.push(chunk)
    return Buffer.concat(chunks)
  }
  throw new Boom('Invalid media upload source')
}

export const generatePanoramaProfilePicture = async (mediaUpload, options) => {
  const { maxWidth = 720, quality = 80 } = options || {}
  const buffer = await bufferFromSource(mediaUpload)
  const lib = await loadImageProcessor()
  let img, fullImg

  if (lib.type === 'sharp') {
    const metadata = await lib.impl(buffer).metadata()
    const originalWidth = metadata.width || 640
    const originalHeight = metadata.height || 640
    const aspectRatio = originalWidth / originalHeight
    let newWidth = originalWidth
    let newHeight = originalHeight
    if (originalWidth > maxWidth) {
      newWidth = maxWidth
      newHeight = Math.round(maxWidth / aspectRatio)
    }
    fullImg = await lib.impl(buffer).resize(newWidth, newHeight, { fit: 'inside' }).jpeg({ quality }).toBuffer()
    img = await lib.impl(buffer).resize(640, 640, { fit: 'cover', position: 'center' }).jpeg({ quality: 50 }).toBuffer()
  } else if (lib.type === 'jimp') {
    const { read, MIME_JPEG } = lib.impl
    const jimpImg = await read(buffer)
    const originalWidth = jimpImg.getWidth()
    const originalHeight = jimpImg.getHeight()
    const aspectRatio = originalWidth / originalHeight
    let newWidth = originalWidth
    let newHeight = originalHeight
    if (originalWidth > maxWidth) {
      newWidth = maxWidth
      newHeight = Math.round(maxWidth / aspectRatio)
    }
    const panoramaJimp = jimpImg.clone().resize(newWidth, newHeight)
    fullImg = await panoramaJimp.quality(quality).getBufferAsync(MIME_JPEG)
    const min = Math.min(originalWidth, originalHeight)
    const xOffset = Math.floor((originalWidth - min) / 2)
    const yOffset = Math.floor((originalHeight - min) / 2)
    const croppedJimp = jimpImg.clone().crop(xOffset, yOffset, min, min).resize(640, 640)
    img = await croppedJimp.quality(50).getBufferAsync(MIME_JPEG)
  } else {
    throw new Boom('No image processing library available')
  }

  return { img, fullImg }
}

export const updatePanoramaProfilePicture = async (sock, jid, content, options) => {
  const { img, fullImg } = await generatePanoramaProfilePicture(content, options)
  await sock.query({
    tag: 'iq',
    attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'w:profile:picture' },
    content: [
      { tag: 'picture', attrs: { type: 'image' }, content: img },
      { tag: 'picture', attrs: { type: 'fullsize' }, content: fullImg }
    ]
  })
}
