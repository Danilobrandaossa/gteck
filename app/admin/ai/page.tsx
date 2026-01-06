/**
 * 📊 DASHBOARD INTERNO - Métricas de IA
 * 
 * Dashboard mínimo para visualizar:
 * - Custos por dia/tenant/provider/model
 * - Fallback rate
 * - Similaridade média
 * - Latência p50/p95
 * 
 * ACESSO: Apenas admin
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface AIMetrics {
  totalCostUSD: number
  totalCostBRL: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  fallbackRate: number
  averageSimilarity: number
  p50Latency: number
  p95Latency: number
  byProvider: Array<{
    provider: string
    costUSD: number
    requests: number
  }>
  byModel: Array<{
    model: string
    costUSD: number
    requests: number
  }>
}

export default function AIDashboardPage() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<AIMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('day')
  const [organizationId, setOrganizationId] = useState<string>('')
  const [siteId, setSiteId] = useState<string>('')

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      setError('Acesso negado. Apenas administradores podem acessar este dashboard.')
      setLoading(false)
      return
    }

    loadMetrics()
  }, [session, dateRange, organizationId, siteId])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        period: dateRange,
        ...(organizationId ? { organizationId } : {}),
        ...(siteId ? { siteId } : {})
      })

      const response = await fetch(`/api/admin/ai/metrics?${params}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to load metrics')
      }

      setMetrics(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (session?.user?.role !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h1 className="text-xl font-bold text-red-800">Acesso Negado</h1>
          <p className="text-red-600">Apenas administradores podem acessar este dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard de IA</h1>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Período</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'day' | 'week' | 'month')}
              className="w-full border rounded px-3 py-2"
            >
              <option value="day">Último dia</option>
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Organization ID</label>
            <input
              type="text"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              placeholder="Opcional"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Site ID</label>
            <input
              type="text"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              placeholder="Opcional"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadMetrics}
              className="w-full bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
            >
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p>Carregando métricas...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {metrics && !loading && (
        <>
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Custo Total (USD)</h3>
              <p className="text-3xl font-bold">${metrics.totalCostUSD.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total de Requisições</h3>
              <p className="text-3xl font-bold">{metrics.totalRequests.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Taxa de Fallback</h3>
              <p className="text-3xl font-bold">{(metrics.fallbackRate * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Similaridade Média</h3>
              <p className="text-3xl font-bold">{(metrics.averageSimilarity * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Latência */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Latência</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">P50 (Mediana)</h3>
                <p className="text-2xl font-bold">{metrics.p50Latency}ms</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">P95</h3>
                <p className="text-2xl font-bold">{metrics.p95Latency}ms</p>
              </div>
            </div>
          </div>

          {/* Por Provider */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Custos por Provider</h2>
            <div className="space-y-2">
              {metrics.byProvider.map((item) => (
                <div key={item.provider} className="flex justify-between items-center">
                  <span className="font-medium">{item.provider}</span>
                  <div className="text-right">
                    <p className="font-bold">${item.costUSD.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{item.requests} requisições</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Por Modelo */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Custos por Modelo</h2>
            <div className="space-y-2">
              {metrics.byModel.map((item) => (
                <div key={item.model} className="flex justify-between items-center">
                  <span className="font-medium">{item.model}</span>
                  <div className="text-right">
                    <p className="font-bold">${item.costUSD.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{item.requests} requisições</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}









