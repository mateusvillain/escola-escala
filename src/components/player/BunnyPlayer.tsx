'use client'

import { useEffect, useRef } from 'react'

interface BunnyPlayerProps {
  videoId: string
  lessonId: string
}

const LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID
const EMBED_ORIGIN = 'https://iframe.mediadelivery.net'
const PLAYER_CONTEXT = 'player.js'
const REPORT_INTERVAL_MS = 10000

function getEmbedUrl(videoId: string): string {
  return `${EMBED_ORIGIN}/embed/${LIBRARY_ID}/${videoId}`
}

export function BunnyPlayer({ videoId, lessonId }: BunnyPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const lastReportedAtRef = useRef(0)
  const latestPercentageRef = useRef(0)

  useEffect(() => {
    function postToPlayer(method: string, value?: string) {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ context: PLAYER_CONTEXT, method, value }),
        EMBED_ORIGIN
      )
    }

    function reportProgress(percentage: number) {
      lastReportedAtRef.current = Date.now()
      fetch(`/api/progress/${lessonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchPercentage: percentage }),
      }).catch(() => {})
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== EMBED_ORIGIN) return

      let data: unknown
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return
      }

      if (typeof data !== 'object' || data === null || !('event' in data)) return
      const message = data as { event: unknown; value?: unknown }

      if (message.event === 'ready') {
        postToPlayer('addEventListener', 'timeupdate')
        postToPlayer('addEventListener', 'pause')
        postToPlayer('addEventListener', 'ended')
        return
      }

      if (message.event === 'timeupdate') {
        const value = message.value
        if (typeof value !== 'object' || value === null || !('seconds' in value) || !('duration' in value)) return
        const { seconds, duration } = value as { seconds: unknown; duration: unknown }
        if (typeof seconds !== 'number' || typeof duration !== 'number' || duration <= 0) return

        const percentage = Math.min(100, Math.round((seconds / duration) * 100))
        latestPercentageRef.current = percentage

        if (Date.now() - lastReportedAtRef.current >= REPORT_INTERVAL_MS) {
          reportProgress(percentage)
        }
        return
      }

      if (message.event === 'pause' || message.event === 'ended') {
        if (Date.now() - lastReportedAtRef.current < 1000) return
        reportProgress(latestPercentageRef.current)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
      if (latestPercentageRef.current > 0) {
        reportProgress(latestPercentageRef.current)
      }
    }
  }, [lessonId])

  return (
    <div className="w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
      <iframe
        ref={iframeRef}
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
