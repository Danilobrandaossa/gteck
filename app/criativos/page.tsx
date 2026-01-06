'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useOrganization } from '@/contexts/organization-context'
import { useAuth } from '@/contexts/auth-context'
import { 
  Sparkles, 
  Image, 
  Loader2,
  XCircle,
  ExternalLink,
  Settings,
  ChevronDown,
  ChevronUp,
  Save,
  FolderOpen,
  Bookmark,
  Download
} from 'lucide-react'

interface CreativeResult {
  status: 'success' | 'failed'
  copy?: string
  imagePrompt?: string
  imageUrl?: string
  revisedPrompt?: string
  conceptualImages?: Array<{
    url: string
    prompt: string
    revisedPrompt?: string
    model: string
    variation: number
  }>
  commercialImages?: Array<{
    url: string
    prompt: string
    model: string
    variation: number
  }>
  conceptualImage?: {
    url: string
    prompt: string
    revisedPrompt?: string
    model: string
  }
  commercialImage?: {
    url: string
    prompt: string
    model: string
  }
  explanation?: string
  failureReason?: string
  bestImage?: {
    url: string
    index: number
    score?: {
      realismo: number
      estetica: number
      alinhamento: number
      limpeza: number
      caraDeIA: number
      total: number
    }
  }
  scoringBreakdown?: {
    realismo: { avg: number; best: number }
    estetica: { avg: number; best: number }
    alinhamento: { avg: number; best: number }
    limpeza: { avg: number; best: number }
    caraDeIA: { avg: number; best: number }
  }
  metadata?: {
    characterCount?: number
    tone?: string
    platform?: string
    qualityTier?: 'draft' | 'production'
    model?: string
    fallbackApplied?: boolean
    timing?: {
      prompt: number
      generate: number
      refine?: number
      total: number
    }
    estimatedCost?: number
  }
}

export default function CriativosPage() {
  const { currentSite, currentOrganization } = useOrganization()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<CreativeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form fields simplificados - apenas o essencial
  const [prompt, setPrompt] = useState('') // Prompt principal (como chat do Gemini)
  const [imageReferences, setImageReferences] = useState<Array<{url?: string, file?: File, role: 'style' | 'produto' | 'inspiração', description?: string, analyzed?: boolean}>>([])
  const [imageRatio, setImageRatio] = useState<'1:1' | '4:5' | '9:16' | '16:9'>('9:16')
  const [variations, setVariations] = useState(2)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Novos campos V2.2
  const [qualityTier, setQualityTier] = useState<'draft' | 'production'>('draft')
  const [includeTextInImage, setIncludeTextInImage] = useState(false) // Default: false (overlay no frontend)
  
  // Campos para tipo de criativo e modelo
  const [creativeType, setCreativeType] = useState<'image' | 'video'>('image')
  const [imageModel, setImageModel] = useState<'nano' | 'pro'>('nano')
  const [videoModel, setVideoModel] = useState<'veo3' | 'veo31'>('veo3')
  const [aiProvider, setAiProvider] = useState<'openai' | 'gemini'>('gemini') // IA para gerar criativos
  const [videoDuration, setVideoDuration] = useState<4 | 6 | 8>(6)
  const [videoAspectRatio, setVideoAspectRatio] = useState<'9:16' | '16:9'>('9:16')
  const [videoVariations, setVideoVariations] = useState(1)
  const [videoJobId, setVideoJobId] = useState<string | null>(null)
  const [videoStatus, setVideoStatus] = useState<'queued' | 'running' | 'done' | 'failed' | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  
  // Performance Creative Engine - Campos
  const [usePerformanceMode, setUsePerformanceMode] = useState(false)
  const [performanceNiche, setPerformanceNiche] = useState<'e-commerce' | 'infoprodutos' | 'saúde' | 'beleza' | 'fitness' | 'finanças' | 'educação' | 'tecnologia' | 'serviços' | 'imobiliário' | 'dorama'>('e-commerce')
  const [performancePlatform, setPerformancePlatform] = useState<'meta-ads' | 'google-ads' | 'tiktok-ads' | 'youtube-ads' | 'display'>('meta-ads')
  const [performanceObjective, setPerformanceObjective] = useState<'conversão' | 'CTR' | 'retenção visual' | 'clareza da oferta'>('conversão')
  const [performanceLanguage, setPerformanceLanguage] = useState<'pt-BR' | 'en-US' | 'es-ES'>('pt-BR')
  const [productName, setProductName] = useState('')
  const [offer, setOffer] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [painPoint, setPainPoint] = useState('')
  const [performanceResult, setPerformanceResult] = useState<any>(null)
  
  // Gerenciamento de prompts salvos
  const [savedPrompts, setSavedPrompts] = useState<Array<{
    id: string
    name: string
    prompt: string
    imageRatio: '1:1' | '4:5' | '9:16' | '16:9'
    variations: number
    qualityTier: 'draft' | 'production'
    includeTextInImage: boolean
    createdAt: string
  }>>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [promptName, setPromptName] = useState('')

  const handleAddImageReference = () => {
    setImageReferences([...imageReferences, { role: 'inspiração', description: '', analyzed: false }])
  }

  const handleRemoveImageReference = (index: number) => {
    setImageReferences(imageReferences.filter((_, i) => i !== index))
  }

  const handleImageReferenceChange = (index: number, field: 'url' | 'role' | 'description', value: string) => {
    const newReferences = [...imageReferences]
    newReferences[index] = { ...newReferences[index], [field]: value, analyzed: false }
    setImageReferences(newReferences)
  }

  const handleImageFileUpload = (index: number, file: File) => {
    const newReferences = [...imageReferences]
    newReferences[index] = { 
      ...newReferences[index], 
      file, 
      url: URL.createObjectURL(file),
      analyzed: false 
    }
    setImageReferences(newReferences)
  }

  const handleAnalyzeImage = async (index: number) => {
    const ref = imageReferences[index]
    if (!ref.file) return

    if (!isAdmin && !currentSite) {
      setError('Site não selecionado. Selecione um site antes de analisar imagens.')
      return
    }

    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append('image', ref.file)
      formData.append('role', ref.role)
      
      // Adicionar contexto de tenant
      // Para admin: usar organizationId da organização atual ou do usuário, siteId opcional
      // Para não-admin: exigir site selecionado
      if (isAdmin) {
        const orgId = currentOrganization?.id || user?.organizationId
        if (orgId) {
          formData.append('organizationId', orgId)
          // siteId é opcional para admin
        } else {
          setError('Organização não encontrada. Selecione uma organização ou site.')
          setIsGenerating(false)
          return
        }
      } else if (currentSite) {
        formData.append('organizationId', currentSite.organizationId)
        formData.append('siteId', currentSite.id)
      } else {
        setError('Site não selecionado. Selecione um site antes de analisar imagens.')
        setIsGenerating(false)
        return
      }

      const response = await fetch('/api/creative/analyze-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('Erro ao analisar imagem:', errorData)
        setError(`Erro ao analisar imagem: ${errorData.error || errorData.message || 'Erro desconhecido'}`)
        setIsGenerating(false)
        return
      }

      const data = await response.json()

      if (data.success && data.characteristics) {
        const newReferences = [...imageReferences]
        const char = data.characteristics
        
        let description = ''
        if (ref.role === 'style') {
          description = [char.colors, char.lighting, char.mood, char.style].filter(Boolean).join(', ')
        } else if (ref.role === 'produto') {
          description = [char.product, char.composition, char.colors].filter(Boolean).join(', ')
        } else {
          description = [char.colors, char.style, char.mood, char.composition].filter(Boolean).join(', ')
        }
        
        newReferences[index] = { ...newReferences[index], description, analyzed: true }
        setImageReferences(newReferences)
      }
    } catch (err) {
      console.error('Erro ao analisar imagem:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  // Carregar prompts salvos do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cms-creative-prompts')
      if (saved) {
        try {
          setSavedPrompts(JSON.parse(saved))
        } catch (e) {
          console.error('Erro ao carregar prompts salvos:', e)
        }
      }
    }
  }, [])

  // Salvar prompt atual
  const handleSavePrompt = () => {
    if (!prompt.trim()) {
      alert('Digite um prompt antes de salvar')
      return
    }
    if (!promptName.trim()) {
      alert('Digite um nome para o prompt')
      return
    }

    const newPrompt = {
      id: Date.now().toString(),
      name: promptName.trim(),
      prompt: prompt.trim(),
      imageRatio,
      variations,
      qualityTier,
      includeTextInImage,
      createdAt: new Date().toISOString()
    }

    const updated = [...savedPrompts, newPrompt]
    setSavedPrompts(updated)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('cms-creative-prompts', JSON.stringify(updated))
    }

    setPromptName('')
    setShowSaveModal(false)
    alert('Prompt salvo com sucesso!')
  }

  // Carregar prompt salvo
  const handleLoadPrompt = (savedPrompt: typeof savedPrompts[0]) => {
    setPrompt(savedPrompt.prompt)
    setImageRatio(savedPrompt.imageRatio)
    setVariations(savedPrompt.variations)
    setQualityTier(savedPrompt.qualityTier)
    setIncludeTextInImage(savedPrompt.includeTextInImage)
    setShowLoadModal(false)
  }

  // Deletar prompt salvo
  const handleDeletePrompt = (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este prompt?')) return

    const updated = savedPrompts.filter(p => p.id !== id)
    setSavedPrompts(updated)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('cms-creative-prompts', JSON.stringify(updated))
    }
  }

  // Polling de status de vídeo
  useEffect(() => {
    if (!videoJobId || videoStatus === 'done' || videoStatus === 'failed') {
      return
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/creative/video-status?jobId=${encodeURIComponent(videoJobId)}`)
        const data = await response.json()

        if (data.status) {
          setVideoStatus(data.status)
          // Usar sempre downloadUrl interno (não usar videoUrl bruto)
          if (data.downloadUrl) {
            setVideoUrl(data.downloadUrl)
          } else if (data.previewUrl) {
            setVideoUrl(data.previewUrl)
          }
          if (data.status === 'done' || data.status === 'failed') {
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error('Erro ao consultar status do vídeo:', error)
      }
    }, 3000) // Poll a cada 3 segundos

    return () => clearInterval(pollInterval)
  }, [videoJobId, videoStatus])

  const handleGenerate = async () => {
    if (!usePerformanceMode && !prompt.trim()) {
      setError('Digite um prompt para gerar')
      return
    }

    if (usePerformanceMode && !productName.trim() && !prompt.trim()) {
      setError('No modo Performance, preencha pelo menos o Nome do Produto ou o Prompt')
      return
    }

    setIsGenerating(true)
    setError(null)
    setResult(null)
    setPerformanceResult(null)
    setVideoJobId(null)
    setVideoStatus(null)
    setVideoUrl(null)

    try {
      // Modo Performance
      if (usePerformanceMode) {
        if (!isAdmin && !currentSite) {
          setError('Site não selecionado. Selecione um site antes de gerar criativos.')
          setIsGenerating(false)
          return
        }

        // Para admin: usar organizationId da organização atual ou do usuário, siteId opcional
        // Para não-admin: exigir site selecionado
        const orgId = isAdmin ? (currentOrganization?.id || user?.organizationId) : currentSite?.organizationId
        if (!orgId) {
          setError('Organização não encontrada. Selecione uma organização ou site.')
          setIsGenerating(false)
          return
        }

        const response = await fetch('/api/creative/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
          },
          body: JSON.stringify({
            organizationId: orgId,
            ...(currentSite && !isAdmin ? { siteId: currentSite.id } : {}),
            language: performanceLanguage,
            niche: performanceNiche,
            platform: performancePlatform,
            creative_type: creativeType === 'image' ? 'variações A/B' : 'vídeo',
            objective: performanceObjective,
            product_name: productName.trim() || undefined,
            offer: offer.trim() || undefined,
            target_audience: targetAudience.trim() || undefined,
            pain_point: painPoint.trim() || undefined,
            mainPrompt: prompt.trim() || undefined,
            imageRatio: imageRatio,
            quantity_of_variations: variations
          })
        })

        const data = await response.json()
        console.log('Resultado Performance da API:', data) // Debug
        console.log('Creative versions:', data.creative_versions) // Debug
        if (data.creative_versions) {
          data.creative_versions.forEach((v: any, idx: number) => {
            console.log(`Versão ${idx + 1}:`, {
              version_number: v.version_number,
              hasImageUrl: !!v.image_url,
              imageUrlType: typeof v.image_url,
              imageUrlLength: v.image_url?.length || 0,
              imageUrl: v.image_url?.substring(0, 100) || 'N/A',
              allKeys: Object.keys(v)
            })
          })
        }
        
        if (data.status === 'failed') {
          setError(data.failureReason || 'Erro ao gerar criativos de performance')
          setIsGenerating(false)
          return
        }

        setPerformanceResult(data)
        setError(null) // Limpar erro se sucesso
        setIsGenerating(false)
        return
      }

      // Modo tradicional
      if (creativeType === 'video') {
        if (!isAdmin && !currentSite) {
          setError('Site não selecionado. Selecione um site antes de gerar criativos.')
          setIsGenerating(false)
          return
        }

        // Para admin: usar organizationId da organização atual ou do usuário, siteId opcional
        // Para não-admin: exigir site selecionado
        const orgId = isAdmin ? (currentOrganization?.id || user?.organizationId) : currentSite?.organizationId
        if (!orgId) {
          setError('Organização não encontrada. Selecione uma organização ou site.')
          setIsGenerating(false)
          return
        }

        // Geração de vídeo
        const response = await fetch('/api/creative/generate-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
          },
          body: JSON.stringify({
            organizationId: orgId,
            ...(currentSite && !isAdmin ? { siteId: currentSite.id } : {}),
            mainPrompt: prompt.trim(),
            videoModel: videoModel,
            aspectRatio: videoAspectRatio,
            durationSeconds: videoDuration,
            variations: videoVariations,
            imageReferences: imageReferences.filter(ref => (ref.url?.trim() || ref.file)).length > 0
              ? imageReferences.filter(ref => (ref.url?.trim() || ref.file)).map(ref => ({
                  url: ref.url?.trim() || undefined,
                  role: ref.role,
                  description: ref.description?.trim() || undefined
                }))
              : undefined
          })
        })

        const data = await response.json()

        if (data.status === 'failed') {
          setError(data.failureReason || 'Erro ao gerar vídeo')
          setIsGenerating(false)
          return
        }

        if (data.jobId) {
          setVideoJobId(data.jobId)
          setVideoStatus('queued')
        }

        setIsGenerating(false)
        return
      }

      // Geração de imagem
      if (!isAdmin && !currentSite) {
        setError('Site não selecionado. Selecione um site antes de gerar criativos.')
        setIsGenerating(false)
        return
      }

      // Para admin: usar organizationId da organização atual ou do usuário, siteId opcional
      // Para não-admin: exigir site selecionado
      const orgId = isAdmin ? (currentOrganization?.id || user?.organizationId) : currentSite?.organizationId
      if (!orgId) {
        setError('Organização não encontrada. Selecione uma organização ou site.')
        setIsGenerating(false)
        return
      }

      const body = {
        organizationId: orgId,
        ...(currentSite && !isAdmin ? { siteId: currentSite.id } : {}),
        mainPrompt: prompt.trim(),
        imageRatio,
        variations,
        imageModel: imageModel,
        aiProvider: aiProvider, // IA selecionada pelo usuário
        imageReferences: imageReferences.filter(ref => (ref.url?.trim() || ref.file)).length > 0
          ? imageReferences.filter(ref => (ref.url?.trim() || ref.file)).map(ref => ({
              url: ref.url?.trim() || undefined,
              role: ref.role,
              description: ref.description?.trim() || undefined
            }))
          : undefined,
        // Novos campos V2.2
        qualityTier,
        includeTextInImage
      }

      const response = await fetch('/api/creative/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      console.log('Resultado da API:', data) // Debug
      setResult(data)

      if (data.status === 'failed') {
        setError(data.failureReason || 'Erro ao gerar criativo')
      } else if (data.status === 'success') {
        // Limpar erro se sucesso
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
              Gerador de Imagens com Gemini Nano Banana
            </h1>
            <p style={{ color: 'var(--gray-600)' }}>
              Digite seu prompt e gere imagens publicitárias de alta qualidade
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'var(--error-light)', 
              border: '1px solid var(--red-300)', 
              borderRadius: 'var(--radius-lg)', 
              color: 'var(--danger)',
              marginBottom: '1.5rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Form - Estilo Chat */}
            <div className="cms-card">
              <div className="cms-card-content" style={{ padding: '1.5rem' }}>
                {/* Prompt Principal - Grande textarea como chat */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.75rem' }}>
                    Descreva a imagem que você quer criar
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: Crie uma imagem publicitária de alta conversão para anúncio digital promovendo um Walmart Gift Card. Uma mulher sorrindo segurando um cartão presente Walmart, fundo azul e amarelo vibrante, estilo publicitário comercial, alto contraste, cores vibrantes, design impactante, foco em conversão. Textos legíveis e profissionais."
                    rows={8}
                    style={{ 
                      width: '100%', 
                      padding: '1rem', 
                      border: '2px solid var(--gray-300)', 
                      borderRadius: 'var(--radius-lg)', 
                      fontSize: '0.9375rem',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      lineHeight: '1.6'
                    }}
                  />
                </div>

                {/* Referências de Imagem - Opcional */}
                {imageReferences.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.75rem' }}>
                      Referências de Imagem
                    </label>
                    {imageReferences.map((ref, index) => (
                      <div key={index} style={{ 
                        padding: '0.75rem', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: 'var(--radius-lg)', 
                        marginBottom: '0.75rem',
                        backgroundColor: 'var(--gray-50)'
                      }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageFileUpload(index, file)
                            }}
                            style={{ 
                              flex: 1,
                              padding: '0.5rem', 
                              border: '1px solid var(--gray-300)', 
                              borderRadius: 'var(--radius)', 
                              fontSize: '0.875rem' 
                            }}
                          />
                          {imageReferences.length > 1 && (
                            <button
                              onClick={() => handleRemoveImageReference(index)}
                              style={{
                                padding: '0.5rem',
                                border: '1px solid var(--red-300)',
                                borderRadius: 'var(--radius)',
                                backgroundColor: 'var(--white)',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                width: '2.5rem'
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                        {ref.file && (
                          <button
                            onClick={() => handleAnalyzeImage(index)}
                            disabled={isGenerating}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: ref.analyzed ? 'var(--success)' : 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--radius)',
                              fontSize: '0.875rem',
                              cursor: isGenerating ? 'not-allowed' : 'pointer',
                              opacity: isGenerating ? 0.7 : 1
                            }}
                          >
                            {ref.analyzed ? '✓ Analisada' : 'Analisar com IA'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Botão Adicionar Referência */}
                <button
                  onClick={handleAddImageReference}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--white)',
                    color: 'var(--gray-700)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Image style={{ width: '0.875rem', height: '0.875rem' }} />
                  Adicionar Referência de Imagem (Opcional)
                </button>

                {/* Modo Performance */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-300)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
                    <input
                      type="checkbox"
                      checked={usePerformanceMode}
                      onChange={(e) => setUsePerformanceMode(e.target.checked)}
                      style={{ width: '1rem', height: '1rem' }}
                    />
                    <span>📊 Criativos de Performance (Marketing)</span>
                  </label>
                  {usePerformanceMode && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>
                          Idioma
                        </label>
                        <select
                          value={performanceLanguage}
                          onChange={(e) => setPerformanceLanguage(e.target.value as any)}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
                        >
                          <option value="pt-BR">Português (BR)</option>
                          <option value="en-US">English (US)</option>
                          <option value="es-ES">Español (ES)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>
                          Nicho
                        </label>
                        <select
                          value={performanceNiche}
                          onChange={(e) => setPerformanceNiche(e.target.value as any)}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
                        >
                          <option value="e-commerce">E-commerce</option>
                          <option value="infoprodutos">Infoprodutos</option>
                          <option value="saúde">Saúde</option>
                          <option value="beleza">Beleza</option>
                          <option value="fitness">Fitness</option>
                          <option value="finanças">Finanças</option>
                          <option value="educação">Educação</option>
                          <option value="tecnologia">Tecnologia</option>
                          <option value="serviços">Serviços</option>
                          <option value="imobiliário">Imobiliário</option>
                          <option value="dorama">Dorama (Novelas Mexicanas)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>
                          Plataforma
                        </label>
                        <select
                          value={performancePlatform}
                          onChange={(e) => setPerformancePlatform(e.target.value as any)}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
                        >
                          <option value="meta-ads">Meta Ads (Facebook/Instagram)</option>
                          <option value="google-ads">Google Ads</option>
                          <option value="tiktok-ads">TikTok Ads</option>
                          <option value="youtube-ads">YouTube Ads</option>
                          <option value="display">Display</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>
                          Objetivo
                        </label>
                        <select
                          value={performanceObjective}
                          onChange={(e) => setPerformanceObjective(e.target.value as any)}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
                        >
                          <option value="conversão">Conversão</option>
                          <option value="CTR">CTR (Cliques)</option>
                          <option value="retenção visual">Retenção Visual</option>
                          <option value="clareza da oferta">Clareza da Oferta</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>
                          Nome do Produto (Opcional)
                        </label>
                        <input
                          type="text"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="Ex: Curso de Marketing Digital"
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>
                          Oferta (Opcional)
                        </label>
                        <input
                          type="text"
                          value={offer}
                          onChange={(e) => setOffer(e.target.value)}
                          placeholder="Ex: 50% de desconto"
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>
                          Público-Alvo (Opcional)
                        </label>
                        <input
                          type="text"
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="Ex: Empreendedores iniciantes"
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.25rem' }}>
                          Dor do Cliente (Opcional)
                        </label>
                        <input
                          type="text"
                          value={painPoint}
                          onChange={(e) => setPainPoint(e.target.value)}
                          placeholder="Ex: Falta de conhecimento em marketing"
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Seletor de IA */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    IA para Gerar Criativo
                  </label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value as 'openai' | 'gemini')}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="gemini">Gemini (Google) - Recomendado para imagens</option>
                    <option value="openai">ChatGPT (OpenAI) - Recomendado para texto</option>
                  </select>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                    {aiProvider === 'gemini' 
                      ? 'Ideal para geração de imagens e criativos visuais'
                      : 'Ideal para geração de copy e textos publicitários'}
                  </p>
                </div>

                {/* Seletor de tipo */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                    Tipo de Criativo
                  </label>
                  <select
                    value={creativeType}
                    onChange={(e) => setCreativeType(e.target.value as 'image' | 'video')}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="image">Imagem</option>
                    <option value="video">Vídeo</option>
                  </select>
                </div>

                {creativeType === 'image' && (
                  <>
                    {/* Seletor de modelo de imagem */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Modelo de Imagem
                      </label>
                      <select
                        value={imageModel}
                        onChange={(e) => setImageModel(e.target.value as 'nano' | 'pro')}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius)',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="nano">Nano (Rápido)</option>
                        <option value="pro">Pro (Premium)</option>
                      </select>
                    </div>
                  </>
                )}

                {creativeType === 'video' && (
                  <>
                    {/* Controles de vídeo */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Modelo de Vídeo
                      </label>
                      <select
                        value={videoModel}
                        onChange={(e) => setVideoModel(e.target.value as 'veo3' | 'veo31')}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius)',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="veo3">Veo 3</option>
                        <option value="veo31">Veo 3.1</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Duração (segundos)
                      </label>
                      <select
                        value={videoDuration}
                        onChange={(e) => setVideoDuration(parseInt(e.target.value) as 4 | 6 | 8)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius)',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="4">4 segundos</option>
                        <option value="6">6 segundos</option>
                        <option value="8">8 segundos</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Proporção
                      </label>
                      <select
                        value={videoAspectRatio}
                        onChange={(e) => setVideoAspectRatio(e.target.value as '9:16' | '16:9')}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius)',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="9:16">9:16 (Vertical)</option>
                        <option value="16:9">16:9 (Horizontal)</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Variações (1-2)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="2"
                        value={videoVariations}
                        onChange={(e) => setVideoVariations(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 2))}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius)',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </>
                )}

                {/* Novos Campos V2.2 - Quality Tier e Include Text (apenas para imagem) */}
                {creativeType === 'image' && (
                  <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                        Qualidade
                      </label>
                      <select
                        value={qualityTier}
                        onChange={(e) => setQualityTier(e.target.value as 'draft' | 'production')}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--gray-300)',
                          borderRadius: 'var(--radius)',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="draft">Draft (Rápido)</option>
                        <option value="production">Production (Alta Qualidade)</option>
                      </select>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'flex-end' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input
                          type="checkbox"
                          checked={includeTextInImage}
                          onChange={(e) => setIncludeTextInImage(e.target.checked)}
                          style={{ width: '1rem', height: '1rem' }}
                        />
                        <span>Incluir texto na imagem</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Configurações Avançadas - Colapsadas */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--gray-50)',
                      color: 'var(--gray-700)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Settings style={{ width: '1rem', height: '1rem' }} />
                      Configurações Avançadas
                    </span>
                    {showAdvanced ? <ChevronUp style={{ width: '1rem', height: '1rem' }} /> : <ChevronDown style={{ width: '1rem', height: '1rem' }} />}
                  </button>
                  
                  {showAdvanced && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '1rem', 
                      backgroundColor: 'var(--gray-50)', 
                      borderRadius: 'var(--radius-lg)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem'
                    }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                          Proporção
                        </label>
                        <select
                          value={imageRatio}
                          onChange={(e) => setImageRatio(e.target.value as any)}
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            border: '1px solid var(--gray-300)', 
                            borderRadius: 'var(--radius-lg)', 
                            fontSize: '0.875rem' 
                          }}
                        >
                          <option value="1:1">Quadrado (1:1)</option>
                          <option value="4:5">Vertical (4:5)</option>
                          <option value="9:16">Story/Reel (9:16)</option>
                          <option value="16:9">Horizontal (16:9)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                          Variações
                        </label>
                        <input
                          type="number"
                          value={variations}
                          onChange={(e) => setVariations(Math.max(1, Math.min(4, parseInt(e.target.value) || 2)))}
                          min={1}
                          max={4}
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            border: '1px solid var(--gray-300)', 
                            borderRadius: 'var(--radius-lg)', 
                            fontSize: '0.875rem' 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    disabled={!prompt.trim()}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--white)',
                      color: 'var(--gray-700)',
                      cursor: !prompt.trim() ? 'not-allowed' : 'pointer',
                      opacity: !prompt.trim() ? 0.5 : 1,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Save style={{ width: '1rem', height: '1rem' }} />
                    Salvar Prompt
                  </button>
                  <button
                    onClick={() => setShowLoadModal(true)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--white)',
                      color: 'var(--gray-700)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FolderOpen style={{ width: '1rem', height: '1rem' }} />
                    Carregar Prompt
                  </button>
                </div>

                {/* Botão Gerar */}
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: !prompt.trim() || isGenerating ? 'not-allowed' : 'pointer',
                    opacity: !prompt.trim() || isGenerating ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles style={{ width: '1.25rem', height: '1.25rem' }} />
                      Gerar {creativeType === 'video' ? 'Vídeo' : 'Imagens'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="cms-card">
              <div className="cms-card-content" style={{ padding: '1.5rem' }}>
                {!result && !performanceResult && !isGenerating && !videoJobId && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                    <Image style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p>Digite um prompt e clique em "Gerar {creativeType === 'video' ? 'Vídeo' : 'Imagens'}"</p>
                  </div>
                )}

                {isGenerating && creativeType === 'image' && !usePerformanceMode && (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
                    <p style={{ color: 'var(--gray-600)' }}>Gerando imagens com Gemini {imageModel === 'pro' ? 'Pro' : 'Nano'}...</p>
                  </div>
                )}

                {isGenerating && usePerformanceMode && (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
                    <p style={{ color: 'var(--gray-600)' }}>Gerando criativos de alta performance...</p>
                    <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      {performanceNiche} • {performancePlatform} • {performanceObjective}
                    </p>
                  </div>
                )}

                {/* Resultados Performance Mode */}
                {/* Exibir resultado mesmo sem status explícito (para debug e compatibilidade) */}
                {performanceResult && (performanceResult.status === 'success' || !performanceResult.status) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--green-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--green-200)' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                        ✅ Criativos de Performance Gerados
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                        {performanceResult.creative_versions.length} variação(ões) A/B gerada(s) para {performanceResult.niche} na plataforma {performanceResult.platform}
                      </p>
                    </div>

                    {performanceResult.creative_versions.map((version: any, idx: number) => {
                      // Debug: verificar se image_url existe
                      console.log(`Renderizando versão ${version.version_number}:`, {
                        hasImageUrl: !!version.image_url,
                        imageUrl: version.image_url?.substring(0, 50) || 'N/A',
                        hasImagePrompt: !!version.image_prompt
                      })
                      
                      return (
                      <div key={idx} style={{
                        border: '1px solid var(--gray-200)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.5rem',
                        backgroundColor: 'var(--white)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                              Variação {version.version_number}
                            </h4>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                              <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--gray-100)', borderRadius: 'var(--radius)' }}>
                                {version.style_applied}
                              </span>
                              <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--gray-100)', borderRadius: 'var(--radius)' }}>
                                {version.tone_applied}
                              </span>
                            </div>
                          </div>
                        </div>

                        {version.headline && (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                              Headline
                            </label>
                            <p style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--gray-900)' }}>
                              {version.headline}
                            </p>
                          </div>
                        )}

                        {version.copy && (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                              Copy
                            </label>
                            <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                              {version.copy}
                            </p>
                          </div>
                        )}

                        {/* Exibir imagem gerada se existir */}
                        {version.image_url ? (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                              🖼️ Imagem Gerada
                            </label>
                            <div style={{
                              position: 'relative',
                              border: '1px solid var(--gray-200)',
                              borderRadius: 'var(--radius-lg)',
                              overflow: 'hidden',
                              backgroundColor: 'var(--gray-50)',
                              marginBottom: '0.5rem'
                            }}>
                              <img
                                src={version.image_url}
                                alt={`Variação ${version.version_number} - Imagem gerada`}
                                onError={(e) => {
                                  console.error('Erro ao carregar imagem:', version.image_url)
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                                onLoad={() => {
                                  console.log('Imagem carregada com sucesso:', version.image_url?.substring(0, 50))
                                }}
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  display: 'block',
                                  maxHeight: '500px',
                                  objectFit: 'contain'
                                }}
                              />
                            </div>
                            <button
                              onClick={() => {
                                // Função para download da imagem base64
                                const link = document.createElement('a')
                                link.href = version.image_url
                                link.download = `criativo-variacao-${version.version_number}-${Date.now()}.png`
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius)',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              <Download style={{ width: '1rem', height: '1rem' }} />
                              Baixar Imagem
                            </button>
                          </div>
                        ) : version.image_prompt ? (
                          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--yellow-50)', borderRadius: 'var(--radius)', border: '1px solid var(--yellow-200)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--yellow-800)', marginBottom: '0.5rem', fontWeight: '600' }}>
                              ⚠️ Imagem ainda não gerada
                            </p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--yellow-700)' }}>
                              A imagem está sendo gerada em segundo plano. Aguarde alguns segundos ou clique no botão abaixo para gerar manualmente.
                            </p>
                          </div>
                        ) : null}

                        {version.image_prompt && (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                              Prompt de Imagem
                            </label>
                            <div style={{
                              padding: '0.75rem',
                              backgroundColor: 'var(--gray-50)',
                              borderRadius: 'var(--radius)',
                              fontSize: '0.75rem',
                              color: 'var(--gray-700)',
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              maxHeight: '200px',
                              overflow: 'auto'
                            }}>
                              {version.image_prompt}
                            </div>
                            {!version.image_url && (
                              <button
                                onClick={() => {
                                  setPrompt(version.image_prompt)
                                  setUsePerformanceMode(false)
                                  setTimeout(() => {
                                    handleGenerate()
                                  }, 100)
                                }}
                                style={{
                                  marginTop: '0.5rem',
                                  padding: '0.5rem 1rem',
                                  backgroundColor: 'var(--primary)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 'var(--radius)',
                                  fontSize: '0.875rem',
                                  cursor: 'pointer'
                                }}
                              >
                                🎨 Gerar Imagem com Este Prompt
                              </button>
                            )}
                          </div>
                        )}

                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--blue-50)', borderRadius: 'var(--radius)', border: '1px solid var(--blue-200)' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--blue-800)', fontWeight: '600', marginBottom: '0.25rem' }}>
                            CTA: {version.cta}
                          </p>
                        </div>

                        {version.notes && (
                          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--gray-600)', fontStyle: 'italic' }}>
                            {version.notes}
                          </div>
                        )}
                      </div>
                      )
                    })}

                    {performanceResult.notes && (
                      <div style={{
                        padding: '1rem',
                        backgroundColor: 'var(--yellow-50)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--yellow-200)',
                        fontSize: '0.875rem',
                        color: 'var(--gray-800)',
                        whiteSpace: 'pre-wrap'
                      }}>
                        <strong>📝 Notas:</strong>
                        <p style={{ marginTop: '0.5rem' }}>{performanceResult.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Status de vídeo */}
                {creativeType === 'video' && videoJobId && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                      Status do Vídeo
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                        <strong>Job ID:</strong> {videoJobId}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                        <strong>Status:</strong> {videoStatus || 'Consultando...'}
                      </p>
                      {videoStatus === 'running' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                          <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                          <span style={{ fontSize: '0.875rem' }}>Processando vídeo...</span>
                        </div>
                      )}
                      {videoStatus === 'done' && (
                        <div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--success)', marginBottom: '0.75rem', fontWeight: '600' }}>
                            ✓ Vídeo pronto!
                          </p>
                          {videoUrl ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {/* Preview do vídeo */}
                              <div style={{ 
                                width: '100%', 
                                maxWidth: '600px',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                                backgroundColor: 'var(--gray-900)',
                                marginBottom: '0.5rem'
                              }}>
                                <video
                                  src={videoUrl}
                                  controls
                                  style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block'
                                  }}
                                >
                                  Seu navegador não suporta a tag de vídeo.
                                </video>
                              </div>
                              
                              {/* Botões de ação */}
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <a
                                  href={videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                    borderRadius: 'var(--radius)',
                                    textDecoration: 'none',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    transition: 'opacity 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                >
                                  <ExternalLink style={{ width: '1rem', height: '1rem' }} />
                                  Abrir em Nova Aba
                                </a>
                                <a
                                  href={videoUrl}
                                  download
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'var(--gray-700)',
                                    color: 'white',
                                    borderRadius: 'var(--radius)',
                                    textDecoration: 'none',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    transition: 'opacity 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                >
                                  <Download style={{ width: '1rem', height: '1rem' }} />
                                  Baixar Vídeo
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                              Aguardando URL do vídeo...
                            </span>
                          )}
                        </div>
                      )}
                      {videoStatus === 'failed' && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>
                          ✗ Erro ao gerar vídeo
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Exibir resultado mesmo sem status explícito (para debug e compatibilidade) */}
                {result && (result.status === 'success' || !result.status) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Imagens Conceituais */}
                    {result.conceptualImages && result.conceptualImages.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                          🎨 Imagens Conceituais ({result.conceptualImages.length})
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                          {result.conceptualImages.map((img, idx) => (
                            <div key={idx} style={{
                              border: '1px solid var(--gray-200)',
                              borderRadius: 'var(--radius-lg)',
                              overflow: 'hidden',
                              backgroundColor: 'var(--gray-50)'
                            }}>
                              <div style={{ position: 'relative' }}>
                                <img
                                  src={img.url}
                                  alt={`Criativo conceitual ${img.variation}`}
                                  style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block'
                                  }}
                                />
                                <div style={{
                                  position: 'absolute',
                                  top: '0.5rem',
                                  right: '0.5rem',
                                  backgroundColor: 'rgba(0,0,0,0.7)',
                                  color: 'white',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: 'var(--radius)',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  #{img.variation}
                                </div>
                              </div>
                              <div style={{ padding: '0.75rem' }}>
                                <a
                                  href={img.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.75rem',
                                    color: 'var(--primary)',
                                    textDecoration: 'none'
                                  }}
                                >
                                  <ExternalLink style={{ width: '0.75rem', height: '0.75rem' }} />
                                  Abrir
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Imagens Comerciais */}
                    {result.commercialImages && result.commercialImages.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                          💼 Imagens Comerciais ({result.commercialImages.length})
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                          {result.commercialImages.map((img, idx) => (
                            <div key={idx} style={{
                              border: '1px solid var(--gray-200)',
                              borderRadius: 'var(--radius-lg)',
                              overflow: 'hidden',
                              backgroundColor: 'var(--gray-50)'
                            }}>
                              {img.url ? (
                                <>
                                  <div style={{ position: 'relative' }}>
                                    <img
                                      src={img.url}
                                      alt={`Criativo comercial ${img.variation}`}
                                      style={{
                                        width: '100%',
                                        height: 'auto',
                                        display: 'block'
                                      }}
                                    />
                                    <div style={{
                                      position: 'absolute',
                                      top: '0.5rem',
                                      right: '0.5rem',
                                      backgroundColor: 'rgba(0,0,0,0.7)',
                                      color: 'white',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: 'var(--radius)',
                                      fontSize: '0.75rem',
                                      fontWeight: '600'
                                    }}>
                                      #{img.variation}
                                    </div>
                                  </div>
                                  <div style={{ padding: '0.75rem' }}>
                                    <a
                                      href={img.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.75rem',
                                        color: 'var(--primary)',
                                        textDecoration: 'none'
                                      }}
                                    >
                                      <ExternalLink style={{ width: '0.75rem', height: '0.75rem' }} />
                                      Abrir
                                    </a>
                                  </div>
                                </>
                                  ) : (
                                    <div style={{ padding: '1rem', backgroundColor: 'var(--yellow-50)', border: '1px solid var(--yellow-200)', borderRadius: 'var(--radius-lg)' }}>
                                      <p style={{ fontSize: '0.875rem', color: 'var(--yellow-800)', marginBottom: '0.5rem', fontWeight: '600' }}>
                                        ⚠️ Imagem não gerada
                                      </p>
                                      <p style={{ fontSize: '0.75rem', color: 'var(--yellow-700)', marginBottom: '0.75rem' }}>
                                        O Gemini retornou apenas o prompt otimizado. Isso pode ocorrer quando:
                                      </p>
                                      <ul style={{ fontSize: '0.75rem', color: 'var(--yellow-700)', paddingLeft: '1.25rem', marginBottom: '0.75rem' }}>
                                        <li>A API do Gemini não está disponível para geração de imagens</li>
                                        <li>O modelo experimental não está acessível</li>
                                        <li>Houve um erro na geração</li>
                                      </ul>
                                      {img.prompt && (
                                        <div style={{ 
                                          padding: '0.75rem', 
                                          backgroundColor: 'var(--white)', 
                                          borderRadius: 'var(--radius)', 
                                          border: '1px solid var(--yellow-300)',
                                          marginTop: '0.5rem'
                                        }}>
                                          <p style={{ fontSize: '0.7rem', color: 'var(--gray-600)', fontStyle: 'italic' }}>
                                            Prompt otimizado: {img.prompt.substring(0, 200)}...
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Best Image (se scoring aplicado) */}
                    {result.bestImage && result.bestImage.url && (
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '1rem' }}>
                          ⭐ Melhor Imagem (Scoring Automático)
                        </h3>
                        <div style={{ 
                          border: '2px solid var(--primary)', 
                          borderRadius: 'var(--radius-lg)', 
                          overflow: 'hidden',
                          backgroundColor: 'var(--gray-50)'
                        }}>
                          <img
                            src={result.bestImage.url}
                            alt="Melhor imagem"
                            style={{
                              width: '100%',
                              height: 'auto',
                              display: 'block'
                            }}
                          />
                          {result.bestImage.score && (
                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--white)' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                                Score: {result.bestImage.score.total.toFixed(1)}/10
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.7rem' }}>
                                <div>Realismo: {result.bestImage.score.realismo}/10</div>
                                <div>Estética: {result.bestImage.score.estetica}/10</div>
                                <div>Alinhamento: {result.bestImage.score.alinhamento}/10</div>
                                <div>Limpeza: {result.bestImage.score.limpeza}/10</div>
                                <div>Cara de IA: {result.bestImage.score.caraDeIA}/10</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Metadata (timing, custo) */}
                    {result.metadata?.timing && (
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--gray-50)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.75rem',
                        color: 'var(--gray-600)'
                      }}>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <div>Tempo total: {result.metadata.timing.total}ms</div>
                          {result.metadata.estimatedCost && (
                            <div>Custo estimado: ${result.metadata.estimatedCost.toFixed(4)}</div>
                          )}
                          {result.metadata.model && (
                            <div>Modelo: {result.metadata.model}</div>
                          )}
                          {result.metadata.fallbackApplied && (
                            <div style={{ color: 'var(--yellow-700)' }}>⚠️ Fallback aplicado</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Explicação */}
                    {result.explanation && (
                      <div style={{
                        padding: '1rem',
                        backgroundColor: 'var(--green-50)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--green-200)',
                        fontSize: '0.875rem',
                        lineHeight: '1.6',
                        color: 'var(--gray-800)',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {result.explanation}
                      </div>
                    )}
                  </div>
                )}

                {result && result.status === 'failed' && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--error-light)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--red-300)',
                    color: 'var(--danger)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <XCircle style={{ width: '1rem', height: '1rem' }} />
                      <strong>Falha na geração</strong>
                    </div>
                    <p style={{ fontSize: '0.875rem' }}>{result.failureReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Salvar Prompt */}
        {showSaveModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }} onClick={() => setShowSaveModal(false)}>
            <div style={{
              backgroundColor: 'var(--white)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                Salvar Prompt
              </h2>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Nome do Prompt
                </label>
                <input
                  type="text"
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                  placeholder="Ex: Walmart Gift Card - Comercial"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.875rem'
                  }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowSaveModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--white)',
                    color: 'var(--gray-700)',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePrompt}
                  disabled={!promptName.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    cursor: !promptName.trim() ? 'not-allowed' : 'pointer',
                    opacity: !promptName.trim() ? 0.5 : 1,
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Carregar Prompt */}
        {showLoadModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }} onClick={() => setShowLoadModal(false)}>
            <div style={{
              backgroundColor: 'var(--white)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                Prompts Salvos
              </h2>
              {savedPrompts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                  <Bookmark style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p>Nenhum prompt salvo ainda</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Salve um prompt para reutilizá-lo depois
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {savedPrompts.map((saved) => (
                    <div
                      key={saved.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: 'var(--gray-50)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                            {saved.name}
                          </h3>
                          <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                            {saved.prompt.substring(0, 100)}...
                          </p>
                          <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span>Ratio: {saved.imageRatio}</span>
                            <span>Variações: {saved.variations}</span>
                            <span>Qualidade: {saved.qualityTier}</span>
                            <span>Texto: {saved.includeTextInImage ? 'Sim' : 'Não'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePrompt(saved.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid var(--red-300)',
                            borderRadius: 'var(--radius)',
                            backgroundColor: 'var(--white)',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          Deletar
                        </button>
                      </div>
                      <button
                        onClick={() => handleLoadPrompt(saved)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--primary)',
                          borderRadius: 'var(--radius-lg)',
                          backgroundColor: 'var(--primary)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        Carregar
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowLoadModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--white)',
                    color: 'var(--gray-700)',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
