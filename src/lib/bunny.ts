const API_BASE = 'https://video.bunnycdn.com'
const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID!
const API_KEY = process.env.BUNNY_STREAM_API_KEY!
const CDN_HOSTNAME = process.env.BUNNY_STREAM_CDN_HOSTNAME!

interface BunnyVideo {
  guid: string
  title: string
  status: number
}

interface BunnyVideoInfo extends BunnyVideo {
  length: number
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

export async function uploadVideo(videoGuid: string, buffer: ArrayBuffer): Promise<void> {
  const res = await fetch(`${API_BASE}/library/${LIBRARY_ID}/videos/${videoGuid}`, {
    method: 'PUT',
    headers: {
      AccessKey: API_KEY,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bunny Stream uploadVideo falhou (${res.status}): ${text}`)
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

export function getEmbedUrl(videoGuid: string): string {
  return `https://${CDN_HOSTNAME}/${videoGuid}/play`
}

export function getThumbnailUrl(videoGuid: string): string {
  return `https://${CDN_HOSTNAME}/${videoGuid}/thumbnail.jpg`
}
