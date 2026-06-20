import crypto from 'crypto'

const API_BASE = 'https://video.bunnycdn.com'
const TUS_UPLOAD_ENDPOINT = 'https://video.bunnycdn.com/tusupload'
const TUS_SIGNATURE_TTL_SECONDS = 60 * 60 // 1h
const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID!
const API_KEY = process.env.BUNNY_STREAM_API_KEY!
const CDN_HOSTNAME = process.env.BUNNY_STREAM_CDN_HOSTNAME!

interface BunnyVideo {
  guid: string
  title: string
  status: number
}

interface BunnyCaption {
  srclang: string
  label: string
}

interface BunnyVideoInfo extends BunnyVideo {
  length: number
  captions: BunnyCaption[]
}

export async function createVideo(title: string): Promise<BunnyVideo> {
  const res = await fetch(`${API_BASE}/library/${LIBRARY_ID}/videos`, {
    method: 'POST',
    headers: {
      AccessKey: API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bunny Stream createVideo falhou (${res.status}): ${text}`)
  }

  return res.json()
}

export interface TusCredentials {
  videoId: string
  libraryId: string
  uploadEndpoint: string
  authorizationSignature: string
  authorizationExpire: number
}

export function generateTusCredentials(videoGuid: string): TusCredentials {
  const authorizationExpire = Math.floor(Date.now() / 1000) + TUS_SIGNATURE_TTL_SECONDS
  const authorizationSignature = crypto
    .createHash('sha256')
    .update(`${LIBRARY_ID}${API_KEY}${authorizationExpire}${videoGuid}`)
    .digest('hex')

  return {
    videoId: videoGuid,
    libraryId: LIBRARY_ID,
    uploadEndpoint: TUS_UPLOAD_ENDPOINT,
    authorizationSignature,
    authorizationExpire,
  }
}

export async function getVideoInfo(videoGuid: string): Promise<BunnyVideoInfo> {
  const res = await fetch(`${API_BASE}/library/${LIBRARY_ID}/videos/${videoGuid}`, {
    headers: { AccessKey: API_KEY },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bunny Stream getVideoInfo falhou (${res.status}): ${text}`)
  }

  return res.json()
}

export async function uploadCaption(
  videoGuid: string,
  language: string,
  vttContent: string,
  label?: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/library/${LIBRARY_ID}/videos/${videoGuid}/captions/${language}`, {
    method: 'POST',
    headers: {
      AccessKey: API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      srclang: language,
      label: label || language,
      captionsFile: Buffer.from(vttContent, 'utf-8').toString('base64'),
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bunny Stream uploadCaption falhou (${res.status}): ${text}`)
  }
}

export async function deleteCaption(videoGuid: string, language: string): Promise<void> {
  const res = await fetch(`${API_BASE}/library/${LIBRARY_ID}/videos/${videoGuid}/captions/${language}`, {
    method: 'DELETE',
    headers: { AccessKey: API_KEY },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bunny Stream deleteCaption falhou (${res.status}): ${text}`)
  }
}

export function getEmbedUrl(videoGuid: string): string {
  return `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoGuid}`
}

export function getThumbnailUrl(videoGuid: string): string {
  return `https://${CDN_HOSTNAME}/${videoGuid}/thumbnail.jpg`
}
