import React from 'react'
import { CheckCircle, AlertTriangle, Clock, X, FileText, Database, Loader, RefreshCw, Sparkles } from 'lucide-react'

interface ProgressModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  progress: {
    percentage: number
    currentStep: string
    totalSteps: number
    currentStepIndex: number
    details: string[]
    isComplete: boolean
    hasError: boolean
  }
}

export function ProgressModal({ isOpen, onClose, title, progress }: ProgressModalProps) {
  if (!isOpen) return null

  const { percentage, currentStep, totalSteps, currentStepIndex, details, isComplete, hasError } = progress

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <RefreshCw style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0
            }}>
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              {currentStep}
            </span>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: hasError ? '#dc2626' : isComplete ? '#059669' : '#3b82f6'
            }}>
              {Math.round(percentage)}%
            </span>
          </div>
          
          <div style={{
            width: '100%',
            height: '0.5rem',
            backgroundColor: '#e5e7eb',
            borderRadius: '0.25rem',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: hasError ? '#dc2626' : isComplete ? '#059669' : '#3b82f6',
              transition: 'width 0.3s ease-in-out',
              borderRadius: '0.25rem'
            }} />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem'
          }}>
            <span style={{
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
              Etapa {currentStepIndex + 1} de {totalSteps}
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {hasError ? (
                <AlertTriangle style={{ width: '1rem', height: '1rem', color: '#dc2626' }} />
              ) : isComplete ? (
                <CheckCircle style={{ width: '1rem', height: '1rem', color: '#059669' }} />
              ) : (
                <Clock style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />
              )}
              <span style={{
                fontSize: '0.75rem',
                color: hasError ? '#dc2626' : isComplete ? '#059669' : '#3b82f6',
                fontWeight: '500'
              }}>
                {hasError ? 'Erro' : isComplete ? 'Concluído' : 'Processando...'}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        {details.length > 0 && (
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <FileText style={{ width: '1rem', height: '1rem', color: '#374151' }} />
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                margin: 0
              }}>
                Detalhes do Processamento:
              </h3>
            </div>
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {details.map((detail, index) => {
                const getIcon = (text: string) => {
                  if (text.includes('Conectando') || text.includes('Preparando')) return <Database style={{ width: '0.75rem', height: '0.75rem', color: '#3b82f6' }} />
                  if (text.includes('Sincronização finalizada') || text.includes('sucesso')) return <CheckCircle style={{ width: '0.75rem', height: '0.75rem', color: '#059669' }} />
                  if (text.includes('Erro')) return <AlertTriangle style={{ width: '0.75rem', height: '0.75rem', color: '#dc2626' }} />
                  if (text.includes('carregados') || text.includes('itens')) return <Sparkles style={{ width: '0.75rem', height: '0.75rem', color: '#059669' }} />
                  if (text.includes('Página') || text.includes('página')) return <FileText style={{ width: '0.75rem', height: '0.75rem', color: '#6b7280' }} />
                  return <Loader style={{ width: '0.75rem', height: '0.75rem', color: '#6b7280' }} />
                }
                
                return (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#4b5563'
                  }}>
                    {getIcon(detail)}
                    <span style={{ lineHeight: '1.4' }}>{detail}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem'
        }}>
          {isComplete && (
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <CheckCircle style={{ width: '1rem', height: '1rem' }} />
              Concluído
            </button>
          )}
          {hasError && (
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertTriangle style={{ width: '1rem', height: '1rem' }} />
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
