/**
 * 📊 EXEMPLO: Integração de Feedback (FASE 8 ETAPA 4)
 * 
 * Componente React para coletar feedback de usuários sobre respostas da IA
 */

import { useState } from 'react'

// ============================================================
// TYPES
// ============================================================

interface FeedbackButtonsProps {
  interactionId: string
  organizationId: string
  siteId: string
  userId?: string
  onSuccess?: () => void
}

type FeedbackReason =
  | 'INCORRECT'
  | 'INCOMPLETE'
  | 'CONFUSING'
  | 'TOO_SLOW'
  | 'TOO_GENERIC'
  | 'HELPFUL'
  | 'CLEAR'
  | 'OTHER'

// ============================================================
// COMPONENT
// ============================================================

export function AIFeedbackButtons({
  interactionId,
  organizationId,
  siteId,
  userId,
  onSuccess
}: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState(false)
  const [showReasons, setShowReasons] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submitFeedback(rating: 1 | -1, reason?: FeedbackReason) {
    setLoading(true)

    try {
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId,
          siteId,
          aiInteractionId: interactionId,
          userId,
          rating,
          reason
        })
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        setShowReasons(false)
        onSuccess?.()
      } else {
        console.error('Feedback failed:', data.error)
        alert('Erro ao enviar feedback. Tente novamente.')
      }
    } catch (error) {
      console.error('Feedback error:', error)
      alert('Erro ao enviar feedback. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Estado: feedback já enviado
  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>Obrigado pelo feedback!</span>
      </div>
    )
  }

  // Estado: selecionando motivo (feedback negativo)
  if (showReasons) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">O que aconteceu?</p>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => submitFeedback(-1, 'INCORRECT')}
            disabled={loading}
            className="px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            ❌ Resposta incorreta ou imprecisa
          </button>
          <button
            onClick={() => submitFeedback(-1, 'INCOMPLETE')}
            disabled={loading}
            className="px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            📋 Resposta incompleta
          </button>
          <button
            onClick={() => submitFeedback(-1, 'CONFUSING')}
            disabled={loading}
            className="px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            🤔 Resposta confusa
          </button>
          <button
            onClick={() => submitFeedback(-1, 'TOO_GENERIC')}
            disabled={loading}
            className="px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            💬 Muito genérica
          </button>
          <button
            onClick={() => submitFeedback(-1, 'TOO_SLOW')}
            disabled={loading}
            className="px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            🐌 Demorou demais
          </button>
          <button
            onClick={() => setShowReasons(false)}
            disabled={loading}
            className="px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 rounded disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  // Estado inicial: escolher positivo/negativo
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Esta resposta foi útil?</span>
      <button
        onClick={() => submitFeedback(1, 'HELPFUL')}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
      >
        👍 Sim
      </button>
      <button
        onClick={() => setShowReasons(true)}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      >
        👎 Não
      </button>
    </div>
  )
}

// ============================================================
// EXEMPLO DE USO
// ============================================================

export function ExampleUsage() {
  const [response, setResponse] = useState<any>(null)

  async function handleRAGQuery() {
    const res = await fetch('/api/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: 'org-123',
        siteId: 'site-456',
        query: 'Como faço para criar um novo site?',
        priority: 'medium'
      })
    })

    const data = await res.json()
    setResponse(data)
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleRAGQuery}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Perguntar à IA
      </button>

      {response && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="prose">
            <p>{response.answer}</p>
          </div>

          <AIFeedbackButtons
            interactionId={response.correlationId}
            organizationId="org-123"
            siteId="site-456"
            userId="user-abc"
            onSuccess={() => console.log('Feedback enviado com sucesso!')}
          />
        </div>
      )}
    </div>
  )
}

// ============================================================
// VARIANT: INLINE FEEDBACK (mais compacto)
// ============================================================

export function InlineFeedbackButtons({
  interactionId,
  organizationId,
  siteId,
  userId
}: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)

  async function handleClick(rating: 1 | -1, reason: FeedbackReason) {
    await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId,
        siteId,
        aiInteractionId: interactionId,
        userId,
        rating,
        reason
      })
    })

    setFeedback(rating === 1 ? 'positive' : 'negative')
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleClick(1, 'HELPFUL')}
        disabled={feedback !== null}
        className={`p-1 rounded transition-colors ${
          feedback === 'positive'
            ? 'text-green-600 bg-green-50'
            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
        } disabled:opacity-50`}
        title="Útil"
      >
        👍
      </button>
      <button
        onClick={() => handleClick(-1, 'INCORRECT')}
        disabled={feedback !== null}
        className={`p-1 rounded transition-colors ${
          feedback === 'negative'
            ? 'text-red-600 bg-red-50'
            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
        } disabled:opacity-50`}
        title="Não útil"
      >
        👎
      </button>
    </div>
  )
}

// ============================================================
// VARIANT: MODAL FEEDBACK (para capturar mais contexto)
// ============================================================

export function ModalFeedbackButtons({
  interactionId,
  organizationId,
  siteId,
  userId
}: FeedbackButtonsProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedRating, setSelectedRating] = useState<1 | -1 | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function openModal(rating: 1 | -1) {
    setSelectedRating(rating)
    setShowModal(true)
  }

  async function submitWithReason(reason: FeedbackReason) {
    if (!selectedRating) return

    await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId,
        siteId,
        aiInteractionId: interactionId,
        userId,
        rating: selectedRating,
        reason
      })
    })

    setSubmitted(true)
    setShowModal(false)
  }

  if (submitted) {
    return (
      <div className="text-sm text-gray-500">
        ✓ Feedback enviado
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => openModal(1)}
          className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded"
        >
          👍 Útil
        </button>
        <button
          onClick={() => openModal(-1)}
          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
        >
          👎 Não útil
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold">
              {selectedRating === 1 ? 'O que foi útil?' : 'O que aconteceu?'}
            </h3>

            <div className="space-y-2">
              {selectedRating === 1 ? (
                <>
                  <button
                    onClick={() => submitWithReason('HELPFUL')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded"
                  >
                    ✅ Resposta completa e precisa
                  </button>
                  <button
                    onClick={() => submitWithReason('CLEAR')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded"
                  >
                    📝 Resposta clara e objetiva
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => submitWithReason('INCORRECT')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded"
                  >
                    ❌ Resposta incorreta
                  </button>
                  <button
                    onClick={() => submitWithReason('INCOMPLETE')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded"
                  >
                    📋 Resposta incompleta
                  </button>
                  <button
                    onClick={() => submitWithReason('CONFUSING')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded"
                  >
                    🤔 Resposta confusa
                  </button>
                  <button
                    onClick={() => submitWithReason('TOO_GENERIC')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded"
                  >
                    💬 Muito genérica
                  </button>
                  <button
                    onClick={() => submitWithReason('TOO_SLOW')}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded"
                  >
                    🐌 Demorou demais
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  )
}










