import { describe, it, expect, beforeEach, vi } from 'vitest'
import crypto from 'crypto'

describe('generateTusCredentials', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.BUNNY_STREAM_LIBRARY_ID = 'lib-123'
    process.env.BUNNY_STREAM_API_KEY = 'api-key-abc'
    process.env.BUNNY_STREAM_CDN_HOSTNAME = 'cdn.example.com'
  })

  it('assinatura segue o spec do Bunny: SHA256(libraryId + apiKey + expire + videoId) em hex', async () => {
    const { generateTusCredentials } = await import('../bunny')
    const credentials = generateTusCredentials('video-guid-1')

    const expectedSignature = crypto
      .createHash('sha256')
      .update(`lib-123api-key-abc${credentials.authorizationExpire}video-guid-1`)
      .digest('hex')

    expect(credentials.authorizationSignature).toBe(expectedSignature)
  })

  it('retorna videoId, libraryId e o endpoint fixo de upload do Bunny Stream', async () => {
    const { generateTusCredentials } = await import('../bunny')
    const credentials = generateTusCredentials('video-guid-1')

    expect(credentials.videoId).toBe('video-guid-1')
    expect(credentials.libraryId).toBe('lib-123')
    expect(credentials.uploadEndpoint).toBe('https://video.bunnycdn.com/tusupload')
  })

  it('expira aproximadamente 1h no futuro', async () => {
    const { generateTusCredentials } = await import('../bunny')
    const before = Math.floor(Date.now() / 1000)
    const credentials = generateTusCredentials('video-guid-1')

    expect(credentials.authorizationExpire).toBeGreaterThanOrEqual(before + 3600 - 2)
    expect(credentials.authorizationExpire).toBeLessThanOrEqual(before + 3600 + 2)
  })

  it('gera assinaturas diferentes para vídeos diferentes', async () => {
    const { generateTusCredentials } = await import('../bunny')
    const a = generateTusCredentials('video-a')
    const b = generateTusCredentials('video-b')

    expect(a.authorizationSignature).not.toBe(b.authorizationSignature)
  })
})
