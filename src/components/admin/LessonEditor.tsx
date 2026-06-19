'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import type { LessonAttachment } from '@/lib/utils/lessons'

interface VideoCaption {
  srclang: string
  label: string
}

interface LessonEditorProps {
  lessonId: string
  defaultValues: {
    title: string
    description: string
    content: string
    isPreview: boolean
  }
  initialVideoId: string | null
  initialVideoDuration: number | null
  initialAttachments: LessonAttachment[]
}

type FormValues = {
  title: string
  description: string
  content: string
  isPreview: boolean
}

const INPUT_CLASS =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'

const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1'

const ERROR_CLASS = 'mt-1 text-xs text-red-600'

const LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID

const CAPTION_LANGUAGE_OPTIONS = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
] as const

function getEmbedUrl(videoId: string): string {
  return `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}`
}

function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function LessonEditor({
  lessonId,
  defaultValues,
  initialVideoId,
  initialVideoDuration,
  initialAttachments,
}: LessonEditorProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues })

  const [videoId, setVideoId] = useState<string | null>(initialVideoId)
  const [videoDuration, setVideoDuration] = useState<number | null>(initialVideoDuration)
  const [attachments, setAttachments] = useState<LessonAttachment[]>(initialAttachments)

  const addAttachment = () => setAttachments(prev => [...prev, { label: '', url: '' }])

  const updateAttachment = (index: number, field: keyof LessonAttachment, value: string) => {
    setAttachments(prev => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)))
  }

  const removeAttachment = (index: number) => setAttachments(prev => prev.filter((_, i) => i !== index))
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>(
    initialVideoId ? 'manual' : 'upload'
  )
  const [manualVideoId, setManualVideoId] = useState(initialVideoId ?? '')

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [captionLanguage, setCaptionLanguage] = useState<string>('')
  const [captionUploading, setCaptionUploading] = useState(false)
  const [captionError, setCaptionError] = useState<string | null>(null)
  const [captionSuccess, setCaptionSuccess] = useState<string | null>(null)
  const captionFileInputRef = useRef<HTMLInputElement>(null)

  const [captions, setCaptions] = useState<VideoCaption[]>([])
  const [captionsLoading, setCaptionsLoading] = useState(false)
  const [captionsListError, setCaptionsListError] = useState<string | null>(null)
  const [deletingLanguage, setDeletingLanguage] = useState<string | null>(null)

  const fetchCaptions = useCallback(async (id: string) => {
    setCaptionsLoading(true)
    setCaptionsListError(null)
    try {
      const res = await fetch(`/api/admin/videos/${id}/captions`)
      const data = await res.json()
      if (!res.ok) {
        setCaptionsListError(data.error ?? 'Falha ao carregar legendas.')
        return
      }
      setCaptions(data.captions ?? [])
    } catch {
      setCaptionsListError('Falha de conexão ao carregar legendas.')
    } finally {
      setCaptionsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (videoId) fetchCaptions(videoId)
  }, [videoId, fetchCaptions])

  const handleDeleteCaption = async (srclang: string) => {
    if (!videoId) return
    if (!window.confirm(`Excluir a legenda "${srclang}" deste vídeo no Bunny Stream?`)) return

    setDeletingLanguage(srclang)
    setCaptionsListError(null)
    try {
      const res = await fetch(`/api/admin/videos/${videoId}/captions/${srclang}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setCaptionsListError(data.error ?? 'Falha ao excluir a legenda.')
        return
      }
      setCaptions(prev => prev.filter(c => c.srclang !== srclang))
    } catch {
      setCaptionsListError('Falha de conexão ao excluir a legenda.')
    } finally {
      setDeletingLanguage(null)
    }
  }

  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileSelected = (file: File) => {
    setUploadError(null)
    setUploadProgress(0)
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', defaultValues.title)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/videos/upload')

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      setUploading(false)
      if (xhr.status < 200 || xhr.status >= 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          setUploadError(data.error ?? 'Falha ao enviar o vídeo.')
        } catch {
          setUploadError('Falha ao enviar o vídeo.')
        }
        return
      }
      const data = JSON.parse(xhr.responseText)
      setVideoId(data.videoId)
      setVideoDuration(data.videoDuration ?? null)
      setManualVideoId(data.videoId)
    }

    xhr.onerror = () => {
      setUploading(false)
      setUploadError('Falha de conexão ao enviar o vídeo.')
    }

    xhr.send(formData)
  }

  const handleCaptionSelected = async (file: File) => {
    if (!videoId) return

    const selectedOption = CAPTION_LANGUAGE_OPTIONS.find(o => o.value === captionLanguage)
    if (!selectedOption) {
      setCaptionError('Selecione um idioma antes de enviar o arquivo.')
      return
    }

    setCaptionError(null)
    setCaptionSuccess(null)
    setCaptionUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('language', selectedOption.value)
      formData.append('label', selectedOption.label)

      const res = await fetch(`/api/admin/videos/${videoId}/captions`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        setCaptionError(data.error ?? 'Falha ao enviar a legenda.')
        return
      }

      setCaptionSuccess(`Legenda "${data.label}" (${data.language}) enviada com sucesso.`)
      setCaptionLanguage('')
      if (captionFileInputRef.current) captionFileInputRef.current.value = ''
      fetchCaptions(videoId)
    } catch {
      setCaptionError('Falha de conexão ao enviar a legenda.')
    } finally {
      setCaptionUploading(false)
    }
  }

  const handleManualSave = () => {
    const trimmed = manualVideoId.trim()
    if (!trimmed) return
    setVideoId(trimmed)
    setVideoDuration(null)
  }

  const submit = async (data: FormValues) => {
    setSaving(true)
    setServerError(null)
    setSuccess(null)

    try {
      const cleanedAttachments = attachments
        .map(a => ({ label: a.label.trim(), url: a.url.trim() }))
        .filter(a => a.label || a.url)

      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description.trim() ? data.description : null,
          content: data.content.trim() ? data.content : null,
          isPreview: data.isPreview,
          videoId,
          videoDuration,
          attachments: cleanedAttachments,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? 'Ocorreu um erro. Tente novamente.')
        return
      }

      setSuccess('Aula salva com sucesso.')
    } catch {
      setServerError('Falha de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const durationLabel = formatDuration(videoDuration)
  const availableCaptionLanguages = CAPTION_LANGUAGE_OPTIONS.filter(
    option => !captions.some(c => c.srclang === option.value)
  )

  return (
    <div className="max-w-2xl">
      {serverError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {serverError}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className={LABEL_CLASS} htmlFor="title">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            placeholder="Ex: Introdução aos hooks"
            className={INPUT_CLASS}
            {...register('title', { required: 'Título é obrigatório' })}
          />
          {errors.title && <p className={ERROR_CLASS}>{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className={LABEL_CLASS} htmlFor="description">
            Descrição
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="Resumo curto da aula..."
            className={`${INPUT_CLASS} resize-y`}
            {...register('description')}
          />
        </div>

        {/* Content */}
        <div>
          <label className={LABEL_CLASS} htmlFor="content">
            Conteúdo{' '}
            <span className="font-normal text-gray-400">(suporta Markdown)</span>
          </label>
          <textarea
            id="content"
            rows={10}
            placeholder="Conteúdo textual da aula..."
            className={`${INPUT_CLASS} resize-y font-mono text-xs`}
            {...register('content')}
          />
        </div>

        {/* Is Preview */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="isPreview"
            className="relative inline-flex items-center cursor-pointer"
          >
            <input
              id="isPreview"
              type="checkbox"
              className="sr-only peer"
              {...register('isPreview')}
            />
            <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition-colors" />
            <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
          </label>
          <span className="text-sm text-gray-700">
            Aula de preview (acessível sem assinatura)
          </span>
        </div>

        {/* Video section */}
        <div>
          <span className={LABEL_CLASS}>Vídeo</span>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={[
                  'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'upload'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700',
                ].join(' ')}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={[
                  'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'manual'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700',
                ].join(' ')}
              >
                Inserir ID do Bunny Stream
              </button>
            </div>

            <div className="p-4 space-y-3">
              {activeTab === 'upload' ? (
                <div key="upload">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    disabled={uploading}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelected(file)
                    }}
                    className="block w-full text-sm text-gray-600"
                  />
                  {uploading && (
                    <div className="mt-3">
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-blue-600 transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Enviando... {uploadProgress}%
                      </p>
                    </div>
                  )}
                  {uploadError && (
                    <p className="mt-2 text-xs text-red-600">{uploadError}</p>
                  )}
                </div>
              ) : (
                <div key="manual" className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manualVideoId}
                    onChange={e => setManualVideoId(e.target.value)}
                    placeholder="GUID do vídeo no Bunny Stream"
                    className={INPUT_CLASS}
                  />
                  <button
                    type="button"
                    onClick={handleManualSave}
                    disabled={!manualVideoId.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Salvar
                  </button>
                </div>
              )}

              {/* Preview player */}
              {videoId && (
                <div>
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={getEmbedUrl(videoId)}
                      loading="lazy"
                      className="w-full h-full"
                      allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                      allowFullScreen
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    ID: <span className="font-mono">{videoId}</span>
                    {durationLabel && <> · Duração: {durationLabel}</>}
                  </p>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className={LABEL_CLASS}>Legenda (.vtt)</span>

                    {captionsLoading && (
                      <p className="text-xs text-gray-400 mb-2">Carregando legendas...</p>
                    )}
                    {captionsListError && (
                      <p className="text-xs text-red-600 mb-2">{captionsListError}</p>
                    )}
                    {!captionsLoading && captions.length > 0 && (
                      <ul className="mb-3 space-y-1">
                        {captions.map(c => (
                          <li
                            key={c.srclang}
                            className="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                          >
                            <span className="text-gray-700">
                              {c.label}{' '}
                              <span className="text-gray-400 font-mono text-xs">({c.srclang})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCaption(c.srclang)}
                              disabled={deletingLanguage === c.srclang}
                              aria-label={`Excluir legenda ${c.srclang}`}
                              className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            >
                              {deletingLanguage === c.srclang ? (
                                'Excluindo...'
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9.5 7V4a1 1 0 011-1h3a1 1 0 011 1v3M4 7h16"
                                  />
                                </svg>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {!captionsLoading && availableCaptionLanguages.length === 0 ? (
                      <p className="text-xs text-gray-400">
                        Todos os idiomas disponíveis já têm legenda enviada.
                      </p>
                    ) : (
                      <>
                        <select
                          value={captionLanguage}
                          onChange={e => setCaptionLanguage(e.target.value)}
                          className={`${INPUT_CLASS} mb-2`}
                        >
                          <option value="" disabled>
                            Selecione um idioma
                          </option>
                          {availableCaptionLanguages.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <label className="sr-only" htmlFor="caption-upload">
                          Arquivo de legenda
                        </label>
                        <input
                          ref={captionFileInputRef}
                          id="caption-upload"
                          type="file"
                          accept=".vtt"
                          disabled={captionUploading || !captionLanguage}
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) handleCaptionSelected(file)
                          }}
                          className="block w-full text-sm text-gray-600"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          Se já existir uma legenda nesse código de idioma, ela será substituída.
                        </p>
                        {captionUploading && (
                          <p className="mt-1 text-xs text-gray-500">Enviando legenda...</p>
                        )}
                        {captionError && <p className="mt-1 text-xs text-red-600">{captionError}</p>}
                        {captionSuccess && (
                          <p className="mt-1 text-xs text-green-600">{captionSuccess}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <span className={LABEL_CLASS}>Materiais complementares</span>
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Rótulo (ex: Slides da aula)"
                  value={attachment.label}
                  onChange={e => updateAttachment(index, 'label', e.target.value)}
                  className={`${INPUT_CLASS} flex-1`}
                />
                <input
                  type="text"
                  placeholder="URL (https://...)"
                  value={attachment.url}
                  onChange={e => updateAttachment(index, 'url', e.target.value)}
                  className={`${INPUT_CLASS} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  aria-label="Remover anexo"
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addAttachment}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            + Adicionar material
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          disabled={saving}
          onClick={handleSubmit(submit)}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
