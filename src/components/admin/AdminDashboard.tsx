'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Metrics {
  totalStudents: number
  activeSubscriptions: number
  basicSubscriptions: number
  premiumSubscriptions: number
  publishedCourses: number
  newStudentsLast30Days: number
  mrr: number
  churnRate: number
  ltvByPlan: { basic: number; premium: number }
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatPercentage(value: number): string {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-7 bg-gray-100 rounded w-16" />
        <div className="h-4 bg-gray-100 rounded w-32" />
      </div>
    </div>
  )
}

const QUICK_LINKS = [
  { href: '/admin/cursos', label: 'Gerenciar Cursos', description: 'Criar, editar e publicar cursos' },
  { href: '/admin/usuarios', label: 'Gerenciar Usuários', description: 'Alunos, instrutores e admins' },
  { href: '/admin/assinaturas', label: 'Ver Assinaturas', description: 'Assinaturas ativas e status' },
]

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(setMetrics)
      .catch(() => setError('Não foi possível carregar as métricas.'))
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <lui-heading level="1" size="xl">Dashboard</lui-heading>
        <p className="text-sm text-gray-500 mt-1">Visão geral da plataforma</p>
      </div>

      {/* Error */}
      {error && (
        <lui-alert variant="danger" title="Erro" content={error} className="mb-6" />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {metrics === null ? (
          Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <MetricCard
              label="Total de Alunos"
              value={metrics.totalStudents.toLocaleString('pt-BR')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <MetricCard
              label="Assinaturas Ativas"
              value={metrics.activeSubscriptions.toLocaleString('pt-BR')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <MetricCard
              label="Plano Básico"
              value={metrics.basicSubscriptions.toLocaleString('pt-BR')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            />
            <MetricCard
              label="Plano Premium"
              value={metrics.premiumSubscriptions.toLocaleString('pt-BR')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              }
            />
            <MetricCard
              label="Cursos Publicados"
              value={metrics.publishedCourses.toLocaleString('pt-BR')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            />
            <MetricCard
              label="Novos Alunos (30 dias)"
              value={metrics.newStudentsLast30Days.toLocaleString('pt-BR')}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
            />
            <MetricCard
              label="MRR"
              value={formatCurrency(metrics.mrr)}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <MetricCard
              label="Churn mensal"
              value={formatPercentage(metrics.churnRate)}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              }
            />
            <MetricCard
              label="LTV médio por plano"
              value={
                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-medium text-gray-400 w-16">Básico</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(metrics.ltvByPlan.basic)}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-medium text-gray-400 w-16">Premium</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(metrics.ltvByPlan.premium)}</span>
                  </div>
                </div>
              }
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Acesso rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUICK_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{link.label}</p>
              <p className="text-xs text-gray-500 mt-1">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
