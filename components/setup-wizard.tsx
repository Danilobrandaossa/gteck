'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useOrganization } from '@/contexts/organization-context'
import { usePermissions } from '@/hooks/use-permissions'
import { Modal } from '@/components/ui/modal'
import { 
  Building2, 
  Globe, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  Shield,
  AlertCircle,
  Info
} from 'lucide-react'

interface SetupWizardProps {
  isOpen: boolean
  onClose: () => void
}

export function SetupWizard({ isOpen, onClose }: SetupWizardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { organizations, sites } = useOrganization()
  const { canCreateOrganizations, canCreateSites, canManageUsers } = usePermissions()
  const [currentStep, setCurrentStep] = useState(1)

  const steps = [
    {
      id: 1,
      title: 'Organizações',
      description: 'Crie organizações para estruturar seu sistema',
      icon: Building2,
      path: '/organizations',
      required: true,
      canAccess: canCreateOrganizations,
      completed: organizations.length > 0
    },
    {
      id: 2,
      title: 'Sites',
      description: 'Adicione sites WordPress às organizações',
      icon: Globe,
      path: '/sites',
      required: true,
      canAccess: canCreateSites,
      completed: sites.length > 0
    },
    {
      id: 3,
      title: 'Usuários',
      description: 'Configure usuários e suas permissões',
      icon: Users,
      path: '/users',
      required: false,
      canAccess: canManageUsers,
      completed: false // Será implementado
    }
  ]

  const currentStepData = steps.find(step => step.id === currentStep)
  const nextStep = steps.find(step => step.id === currentStep + 1)
  const isLastStep = currentStep === steps.length

  const handleNext = () => {
    if (nextStep) {
      setCurrentStep(nextStep.id)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleGoToStep = (stepId: number) => {
    setCurrentStep(stepId)
  }

  const handleComplete = () => {
    onClose()
    router.push('/dashboard')
  }

  const getStepStatus = (step: typeof steps[0]) => {
    if (!step.canAccess) {
      return { status: 'restricted', color: 'var(--gray-400)', icon: Shield }
    }
    if (step.completed) {
      return { status: 'completed', color: 'var(--green-500)', icon: CheckCircle }
    }
    if (step.required) {
      return { status: 'required', color: 'var(--blue-500)', icon: AlertCircle }
    }
    return { status: 'optional', color: 'var(--gray-500)', icon: Info }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuração Inicial" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Progress Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(step)
            const Icon = stepStatus.icon
            
            return (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    onClick={() => handleGoToStep(step.id)}
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      backgroundColor: stepStatus.status === 'completed' ? 'var(--green-100)' : 
                                        stepStatus.status === 'required' ? 'var(--blue-100)' :
                                        stepStatus.status === 'restricted' ? 'var(--gray-100)' : 'var(--gray-50)',
                      border: `2px solid ${stepStatus.color}`,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: stepStatus.status === 'restricted' ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon style={{ width: '1rem', height: '1rem', color: stepStatus.color }} />
                  </div>
                  <div style={{ marginLeft: '0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      {stepStatus.status === 'completed' ? 'Concluído' :
                       stepStatus.status === 'required' ? 'Obrigatório' :
                       stepStatus.status === 'restricted' ? 'Restrito' : 'Opcional'}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight style={{ 
                    width: '1rem', 
                    height: '1rem', 
                    color: 'var(--gray-400)',
                    margin: '0 1rem'
                  }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Current Step Content */}
        {currentStepData && (
          <div style={{ 
            padding: '2rem', 
            backgroundColor: 'var(--gray-50)', 
            borderRadius: '0.5rem',
            border: '1px solid var(--gray-200)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: 'var(--primary-light)',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <currentStepData.icon style={{ width: '1.5rem', height: '1.5rem', color: 'var(--primary)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-900)', margin: 0 }}>
                  {currentStepData.title}
                </h3>
                <p style={{ color: 'var(--gray-600)', margin: 0 }}>
                  {currentStepData.description}
                </p>
              </div>
            </div>

            {/* Step Status */}
            <div style={{ marginBottom: '1.5rem' }}>
              {!currentStepData.canAccess ? (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--yellow-50)',
                  border: '1px solid var(--yellow-200)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--yellow-700)'
                }}>
                  <Shield style={{ width: '1rem', height: '1rem' }} />
                  Apenas administradores podem acessar esta funcionalidade
                </div>
              ) : currentStepData.completed ? (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--green-50)',
                  border: '1px solid var(--green-200)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--green-700)'
                }}>
                  <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                  {currentStepData.title} configurado com sucesso!
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--blue-50)',
                  border: '1px solid var(--blue-200)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--blue-700)'
                }}>
                  <AlertCircle style={{ width: '1rem', height: '1rem' }} />
                  {currentStepData.required ? 'Obrigatório' : 'Recomendado'} - Clique em "Ir para {currentStepData.title}" para configurar
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid var(--gray-300)',
                    backgroundColor: 'white',
                    color: 'var(--gray-700)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Anterior
                </button>
              )}
              
              {currentStepData.canAccess && (
                <button
                  onClick={() => {
                    onClose()
                    router.push(currentStepData.path)
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--primary)',
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
                  Ir para {currentStepData.title}
                  <ArrowRight style={{ width: '1rem', height: '1rem' }} />
                </button>
              )}
              
              {!isLastStep && nextStep && (
                <button
                  onClick={handleNext}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--gray-600)',
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
                  Próximo
                  <ArrowRight style={{ width: '1rem', height: '1rem' }} />
                </button>
              )}
              
              {isLastStep && (
                <button
                  onClick={handleComplete}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--green-600)',
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
                  Concluir Configuração
                  <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        <div style={{
          padding: '1rem',
          backgroundColor: 'var(--gray-50)',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: 'var(--gray-600)'
        }}>
          <strong>Fluxo recomendado:</strong> Organizações → Sites → Usuários
          <br />
          <strong>Usuário atual:</strong> {user?.name} ({user?.role})
        </div>
      </div>
    </Modal>
  )
}




