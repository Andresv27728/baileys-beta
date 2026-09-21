/**
 * Panorama Profile Picture Generator
 * Ported from @innovatorssoft/baileys
 * Creates wide banner + square thumbnail for WhatsApp profile pictures
 */

import { getImageProcessingLibrary, toBuffer } from './messages-media.js'
import { Boom } from '@hapi/boom'
import fs from 'fs'

/**
 * Generate panorama profile picture (wide banner + square thumbnail)
 * @param {Buffer|{url:string}|{stream:Readable}} mediaUpload - The image source
 * @param {{maxWidth?: number, quality?: number}} [options] - Panorama options
 * @returns {Promise<{img: Buffer, fullImg: Buffer}>}
 */
export const generatePanoramaProfilePicture = async (mediaUpload, options) => {
  let buffer
  const { maxWidth = 720, quality = 80 } = options || {}

  if (Buffer.isBuffer(mediaUpload)) {
    buffer = mediaUpload
  } else if ('url' in mediaUpload) {
    const urlStr = mediaUpload.url.toString()
    if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
      const response = await fetch(urlStr)
      buffer = Buffer.from(await response.arrayBuffer())
    } else {
      buffer = await toBuffer(fs.createReadStream(urlStr))
    }
  } else {
    buffer = await toBuffer(mediaUpload.stream)
  }

  const lib = await getImageProcessingLibrary()
  let img
  let fullImg

  if ('sharp' in lib && typeof lib.sharp?.default === 'function') {
    const sharpInstance = lib.sharp.default(buffer)
    const metadata = await sharpInstance.metadata()
    const originalWidth = metadata.width || 640
    const originalHeight = metadata.height || 640
    const aspectRatio = originalWidth / originalHeight
    let newWidth = originalWidth
    let newHeight = originalHeight
    if (originalWidth > maxWidth) {
      newWidth = maxWidth
      newHeight = Math.round(maxWidth / aspectRatio)
    }
    fullImg = await lib.sharp.default(buffer)
      .resize(newWidth, newHeight, { fit: 'inside' })
      .jpeg({ quality })
      .toBuffer()
    img = await lib.sharp.default(buffer)
      .resize(640, 640, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 50 })
      .toBuffer()
  } else if ('jimp' in lib && typeof lib.jimp?.read === 'function') {
    const { read, MIME_JPEG } = lib.jimp
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

/**
 * Update panorama profile picture for a JID
 * @param {object} sock - WhatsApp socket
 * @param {string} jid - Target JID
 * @param {Buffer|{url:string}|{stream:Readable}} content - Image source
 * @param {{maxWidth?: number, quality?: number}} [options]
 */
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
