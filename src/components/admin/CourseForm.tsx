'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'

interface Instructor {
  id: string
  user: { name: string; email: string }
}

type FormData = {
  title: string
  description: string
  thumbnailUrl: string
  instructorId: string
  planAccess: 'basic' | 'premium'
}

interface CourseFormProps {
  courseId?: string
  slug?: string
  canPublish?: boolean
  defaultValues?: Partial<FormData>
}

const INPUT_CLASS =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'

const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1'

const ERROR_CLASS = 'mt-1 text-xs text-red-600'

export function CourseForm({ courseId, slug, canPublish = false, defaultValues }: CourseFormProps) {
  const router = useRouter()
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loadingInstructors, setLoadingInstructors] = useState(true)
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [thumbError, setThumbError] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      thumbnailUrl: '',
      instructorId: '',
      planAccess: 'basic',
      ...defaultValues,
    },
  })

  const thumbnailUrl = watch('thumbnailUrl')

  useEffect(() => {
    fetch('/api/admin/users?role=instructor')
      .then(r => r.json())
      .then(d => setInstructors(d.users ?? []))
      .catch(() => {})
      .finally(() => setLoadingInstructors(false))
  }, [])

  // reset thumb error whenever url changes
  useEffect(() => {
    setThumbError(false)
  }, [thumbnailUrl])

  const submit = async (data: FormData, targetStatus: 'draft' | 'published') => {
    setSaving(targetStatus === 'draft' ? 'draft' : 'publish')
    setServerError(null)
    setSuccess(null)

    const payload: Record<string, unknown> = { ...data, status: targetStatus }
    if (!data.thumbnailUrl.trim()) {
      payload.thumbnailUrl = null
    }

    try {
      let res: Response
      if (courseId) {
        res = await fetch(`/api/admin/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? 'Ocorreu um erro. Tente novamente.')
        return
      }

      if (!courseId) {
        router.push(`/admin/cursos/${json.course.id}`)
        return
      }

      setSuccess(targetStatus === 'published' ? 'Curso publicado com sucesso!' : 'Rascunho salvo.')
    } catch {
      setServerError('Falha de conexão. Tente novamente.')
    } finally {
      setSaving(null)
    }
  }

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
            placeholder="Ex: Introdução ao Next.js"
            className={INPUT_CLASS}
            {...register('title', { required: 'Título é obrigatório' })}
          />
          {errors.title && <p className={ERROR_CLASS}>{errors.title.message}</p>}
          {slug && (
            <p className="mt-1 text-xs text-gray-400">
              Slug: <span className="font-mono text-gray-500">{slug}</span>
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className={LABEL_CLASS} htmlFor="description">
            Descrição{' '}
            <span className="font-normal text-gray-400">(suporta Markdown)</span>
          </label>
          <textarea
            id="description"
            rows={5}
            placeholder="Descreva o conteúdo do curso..."
            className={`${INPUT_CLASS} resize-y`}
            {...register('description')}
          />
        </div>

        {/* Thumbnail */}
        <div>
          <label className={LABEL_CLASS} htmlFor="thumbnailUrl">
            Thumbnail (URL)
          </label>
          <input
            id="thumbnailUrl"
            type="url"
            placeholder="https://exemplo.com/imagem.jpg"
            className={INPUT_CLASS}
            {...register('thumbnailUrl')}
          />
          {thumbnailUrl && !thumbError && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt="Preview do thumbnail"
              onError={() => setThumbError(true)}
              className="mt-2 w-full max-w-xs h-auto rounded-lg border border-gray-200 object-cover"
            />
          )}
          {thumbnailUrl && thumbError && (
            <p className="mt-1 text-xs text-amber-600">
              Não foi possível carregar a imagem desta URL.
            </p>
          )}
        </div>

        {/* Instructor */}
        <div>
          <label className={LABEL_CLASS} htmlFor="instructorId">
            Instrutor <span className="text-red-500">*</span>
          </label>
          <select
            id="instructorId"
            className={INPUT_CLASS}
            disabled={loadingInstructors}
            {...register('instructorId', { required: 'Selecione um instrutor' })}
          >
            <option value="">
              {loadingInstructors ? 'Carregando...' : 'Selecione um instrutor'}
            </option>
            {instructors.map(inst => (
              <option key={inst.id} value={inst.id}>
                {inst.user.name} — {inst.user.email}
              </option>
            ))}
          </select>
          {errors.instructorId && (
            <p className={ERROR_CLASS}>{errors.instructorId.message}</p>
          )}
        </div>

        {/* Plan Access */}
        <div>
          <span className={LABEL_CLASS}>Plano de acesso</span>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="basic"
                {...register('planAccess')}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700">Básico</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="premium"
                {...register('planAccess')}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700">Premium</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          disabled={saving !== null}
          onClick={handleSubmit(data => submit(data, 'draft'))}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving === 'draft' ? 'Salvando...' : 'Salvar rascunho'}
        </button>

        <button
          type="button"
          disabled={saving !== null || !canPublish}
          onClick={handleSubmit(data => submit(data, 'published'))}
          title={
            !canPublish
              ? 'Adicione ao menos 1 módulo com 1 aula antes de publicar'
              : undefined
          }
          className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving === 'publish' ? 'Publicando...' : 'Publicar'}
        </button>

        {!canPublish && courseId && (
          <p className="text-xs text-gray-400">
            Adicione ao menos 1 módulo com 1 aula para publicar.
          </p>
        )}
      </div>
    </div>
  )
}
