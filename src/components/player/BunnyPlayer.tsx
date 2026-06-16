'use client'

import { useEffect } from 'react'

interface BunnyPlayerProps {
  videoId: string
  onProgress?: (percentage: number) => void
}

const LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID
const EMBED_ORIGIN = 'https://iframe.mediadelivery.net'

function getEmbedUrl(videoId: string): string {
  return `${EMBED_ORIGIN}/embed/${LIBRARY_ID}/${videoId}`
}

export function BunnyPlayer({ videoId, onProgress }: BunnyPlayerProps) {
  useEffect(() => {
    if (!onProgress) return
    const reportProgress = onProgress

    function handleMessage(event: MessageEvent) {
      if (event.origin !== EMBED_ORIGIN) return

      let data: unknown
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return
      }

      if (
        typeof data === 'object' &&
        data !== null &&
        'event' in data &&
        (data as { event: unknown }).event === 'percentageWatched' &&
        'percentage' in data
      ) {
        const percentage = (data as { percentage: unknown }).percentage
        if (typeof percentage === 'number') reportProgress(percentage)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onProgress])

  return (
    <div className="w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
      <iframe
        src={getEmbedUrl(videoId)}
        loading="lazy"
        className="w-full h-full"
        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
