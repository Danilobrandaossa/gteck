'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'

export interface TemplateField {
  id: string
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'email' | 'url' | 'date' | 'select' | 'checkbox' | 'image' | 'wysiwyg'
  required: boolean
  placeholder?: string
  options?: string[] // Para campos select
  defaultValue?: any
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface Template {
  id: string
  name: string
  description: string
  slug: string
  category: string
  isGlobal: boolean
  organizationId?: string
  fields: TemplateField[]
  htmlTemplate: string
  cssTemplate?: string
  jsTemplate?: string
  createdAt: Date
  updatedAt: Date
}

interface TemplatesContextType {
  templates: Template[]
  currentTemplate: Template | null
  isLoading: boolean
  error: string | null
  setCurrentTemplate: (template: Template | null) => void
  createTemplate: (templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Template>
  updateTemplate: (id: string, templateData: Partial<Template>) => Promise<Template>
  deleteTemplate: (id: string) => Promise<void>
  duplicateTemplate: (id: string) => Promise<Template>
  refreshTemplates: () => Promise<void>
}

const TemplatesContext = createContext<TemplatesContextType | undefined>(undefined)

export function TemplatesProvider({ children }: { children: React.ReactNode }) {
  const { currentOrganization } = useOrganization()
  const [templates, setTemplates] = useState<Template[]>([])
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dados mock para demonstração
  const mockTemplates: Template[] = [
    {
      id: '1',
      name: 'Página Inicial',
      description: 'Template para página inicial com hero, seções e CTA',
      slug: 'pagina-inicial',
      category: 'Landing',
      isGlobal: true,
      fields: [
        {
          id: 'hero-title',
          name: 'hero_title',
          label: 'Título Principal',
          type: 'text',
          required: true,
          placeholder: 'Digite o título principal'
        },
        {
          id: 'hero-subtitle',
          name: 'hero_subtitle',
          label: 'Subtítulo',
          type: 'textarea',
          required: false,
          placeholder: 'Digite o subtítulo'
        },
        {
          id: 'hero-image',
          name: 'hero_image',
          label: 'Imagem do Hero',
          type: 'image',
          required: true
        },
        {
          id: 'cta-text',
          name: 'cta_text',
          label: 'Texto do Botão',
          type: 'text',
          required: true,
          defaultValue: 'Saiba Mais'
        },
        {
          id: 'cta-link',
          name: 'cta_link',
          label: 'Link do Botão',
          type: 'url',
          required: true
        }
      ],
      htmlTemplate: `
        <section class="hero">
          <div class="hero-content">
            <h1>{{hero_title}}</h1>
            <p>{{hero_subtitle}}</p>
            <a href="{{cta_link}}" class="btn-primary">{{cta_text}}</a>
          </div>
          <div class="hero-image">
            <img src="{{hero_image}}" alt="{{hero_title}}">
          </div>
        </section>
      `,
      cssTemplate: `
        .hero {
          display: flex;
          align-items: center;
          min-height: 500px;
          padding: 2rem;
        }
        .hero-content h1 {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }
        .btn-primary {
          background-color: var(--primary);
          color: white;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          text-decoration: none;
          display: inline-block;
          margin-top: 1rem;
        }
      `,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Blog Post',
      description: 'Template para posts do blog com título, conteúdo e metadados',
      slug: 'blog-post',
      category: 'Blog',
      isGlobal: true,
      fields: [
        {
          id: 'post-title',
          name: 'post_title',
          label: 'Título do Post',
          type: 'text',
          required: true
        },
        {
          id: 'post-content',
          name: 'post_content',
          label: 'Conteúdo',
          type: 'wysiwyg',
          required: true
        },
        {
          id: 'post-excerpt',
          name: 'post_excerpt',
          label: 'Resumo',
          type: 'textarea',
          required: false
        },
        {
          id: 'post-image',
          name: 'post_image',
          label: 'Imagem Destacada',
          type: 'image',
          required: false
        },
        {
          id: 'post-author',
          name: 'post_author',
          label: 'Autor',
          type: 'text',
          required: true,
          defaultValue: 'Admin'
        },
        {
          id: 'post-category',
          name: 'post_category',
          label: 'Categoria',
          type: 'select',
          required: true,
          options: ['Tecnologia', 'Negócios', 'Marketing', 'Design']
        }
      ],
      htmlTemplate: `
        <article class="blog-post">
          <header>
            <h1>{{post_title}}</h1>
            <div class="post-meta">
              <span>Por {{post_author}}</span>
              <span>{{post_category}}</span>
            </div>
          </header>
          <div class="post-image">
            <img src="{{post_image}}" alt="{{post_title}}">
          </div>
          <div class="post-content">
            {{post_content}}
          </div>
        </article>
      `,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-10')
    },
    {
      id: '3',
      name: 'Página de Contato',
      description: 'Template para página de contato com formulário e informações',
      slug: 'pagina-contato',
      category: 'Institutional',
      isGlobal: true,
      fields: [
        {
          id: 'contact-title',
          name: 'contact_title',
          label: 'Título da Página',
          type: 'text',
          required: true,
          defaultValue: 'Entre em Contato'
        },
        {
          id: 'contact-description',
          name: 'contact_description',
          label: 'Descrição',
          type: 'textarea',
          required: false
        },
        {
          id: 'contact-phone',
          name: 'contact_phone',
          label: 'Telefone',
          type: 'text',
          required: true
        },
        {
          id: 'contact-email',
          name: 'contact_email',
          label: 'Email',
          type: 'email',
          required: true
        },
        {
          id: 'contact-address',
          name: 'contact_address',
          label: 'Endereço',
          type: 'textarea',
          required: false
        }
      ],
      htmlTemplate: `
        <section class="contact-page">
          <h1>{{contact_title}}</h1>
          <p>{{contact_description}}</p>
          <div class="contact-info">
            <div class="contact-item">
              <strong>Telefone:</strong> {{contact_phone}}
            </div>
            <div class="contact-item">
              <strong>Email:</strong> {{contact_email}}
            </div>
            <div class="contact-item">
              <strong>Endereço:</strong> {{contact_address}}
            </div>
          </div>
        </section>
      `,
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-12')
    },
    {
      id: '4',
      name: 'Produto E-commerce',
      description: 'Template para página de produto com galeria, preço e descrição',
      slug: 'produto-ecommerce',
      category: 'E-commerce',
      isGlobal: false,
      organizationId: '1',
      fields: [
        {
          id: 'product-name',
          name: 'product_name',
          label: 'Nome do Produto',
          type: 'text',
          required: true
        },
        {
          id: 'product-price',
          name: 'product_price',
          label: 'Preço',
          type: 'number',
          required: true,
          validation: { min: 0 }
        },
        {
          id: 'product-description',
          name: 'product_description',
          label: 'Descrição',
          type: 'wysiwyg',
          required: true
        },
        {
          id: 'product-images',
          name: 'product_images',
          label: 'Imagens do Produto',
          type: 'image',
          required: true
        },
        {
          id: 'product-sku',
          name: 'product_sku',
          label: 'SKU',
          type: 'text',
          required: false
        },
        {
          id: 'product-stock',
          name: 'product_stock',
          label: 'Estoque',
          type: 'number',
          required: false,
          validation: { min: 0 }
        }
      ],
      htmlTemplate: `
        <div class="product-page">
          <div class="product-gallery">
            <img src="{{product_images}}" alt="{{product_name}}">
          </div>
          <div class="product-info">
            <h1>{{product_name}}</h1>
            <div class="product-price">R$ {{product_price}}</div>
            <div class="product-description">
              {{product_description}}
            </div>
            <div class="product-meta">
              <span>SKU: {{product_sku}}</span>
              <span>Estoque: {{product_stock}}</span>
            </div>
          </div>
        </div>
      `,
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-18')
    }
  ]

  const refreshTemplates = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Filtrar templates pela organização atual
      const orgTemplates = mockTemplates.filter(template => 
        template.isGlobal || template.organizationId === currentOrganization?.id
      )
      
      setTemplates(orgTemplates)
    } catch (err) {
      setError('Erro ao carregar templates')
      console.error('Erro ao carregar templates:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createTemplate = async (templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const newTemplate: Template = {
        ...templateData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setTemplates(prev => [newTemplate, ...prev])
      return newTemplate
    } catch (err) {
      setError('Erro ao criar template')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateTemplate = async (id: string, templateData: Partial<Template>): Promise<Template> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const updatedTemplate = {
        ...templates.find(t => t.id === id)!,
        ...templateData,
        updatedAt: new Date()
      }
      
      setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t))
      if (currentTemplate?.id === id) {
        setCurrentTemplate(updatedTemplate)
      }
      
      return updatedTemplate
    } catch (err) {
      setError('Erro ao atualizar template')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTemplate = async (id: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setTemplates(prev => prev.filter(t => t.id !== id))
      if (currentTemplate?.id === id) {
        setCurrentTemplate(null)
      }
    } catch (err) {
      setError('Erro ao deletar template')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const duplicateTemplate = async (id: string): Promise<Template> => {
    const template = templates.find(t => t.id === id)
    if (!template) throw new Error('Template não encontrado')
    
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (Cópia)`,
      slug: `${template.slug}-copia`,
      isGlobal: false,
      organizationId: currentOrganization?.id
    }
    
    return createTemplate(duplicatedTemplate)
  }

  useEffect(() => {
    if (currentOrganization) {
      refreshTemplates()
    }
  }, [currentOrganization])

  const value: TemplatesContextType = {
    templates,
    currentTemplate,
    isLoading,
    error,
    setCurrentTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    refreshTemplates
  }

  return (
    <TemplatesContext.Provider value={value}>
      {children}
    </TemplatesContext.Provider>
  )
}

export function useTemplates() {
  const context = useContext(TemplatesContext)
  if (context === undefined) {
    throw new Error('useTemplates deve ser usado dentro de um TemplatesProvider')
  }
  return context
}

