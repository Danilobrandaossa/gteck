// Tipos principais do sistema

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  organizationId: string
  organization?: Organization
  createdAt: Date
  updatedAt: Date
}

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  settings: OrganizationSettings
  users: User[]
  sites: Site[]
  createdAt: Date
  updatedAt: Date
}

export interface Site {
  id: string
  name: string
  url: string
  slug: string
  description?: string
  organizationId: string
  organization?: Organization
  pages: Page[]
  categories: Category[]
  media: Media[]
  templates: Template[]
  wpBaseUrl?: string
  wpAuthType?: 'basic' | 'bearer' | 'nonce'
  wpConfigured: boolean
  wpLastSync?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Page {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  status: PageStatus
  templateId?: string
  template?: Template
  siteId: string
  site?: Site
  authorId: string
  author?: User
  categoryId?: string
  category?: Category
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  ogImage?: string
  customFields: Record<string, any>
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Template {
  id: string
  name: string
  description?: string
  html: string
  css?: string
  js?: string
  siteId?: string
  site?: Site
  organizationId: string
  organization?: Organization
  fields: TemplateField[]
  isGlobal: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TemplateField {
  id: string
  name: string
  label: string
  type: FieldType
  required: boolean
  options?: string[]
  defaultValue?: any
  validation?: FieldValidation
  templateId: string
  order: number
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  siteId: string
  site?: Site
  pages: Page[]
  parentId?: string
  parent?: Category
  children: Category[]
  createdAt: Date
  updatedAt: Date
}

export interface Media {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  alt?: string
  caption?: string
  siteId: string
  site?: Site
  uploadedById: string
  uploadedBy?: User
  createdAt: Date
  updatedAt: Date
}

export interface QueueJob {
  id: string
  type: JobType
  status: JobStatus
  siteId: string
  inputData: Record<string, any>
  outputData?: Record<string, any>
  errorMessage?: string
  retryCount: number
  maxRetries: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}

// Enums
export type UserRole = 'admin' | 'editor' | 'author' | 'viewer'
export type PageStatus = 'draft' | 'published' | 'archived'
export type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'url' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'file' | 'image' | 'wysiwyg'
export type JobType = 'page_create' | 'page_update' | 'page_delete' | 'media_upload' | 'ai_generate' | 'wordpress_sync' | 'seo_generate' | 'bulk_operation'
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed'

// Interfaces de configuração
export interface OrganizationSettings {
  allowUserRegistration: boolean
  defaultUserRole: UserRole
  maxSites: number
  maxPagesPerSite: number
  maxMediaPerSite: number
  features: {
    ai: boolean
    wordpress: boolean
    seo: boolean
    analytics: boolean
  }
}

export interface FieldValidation {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  required?: boolean
}

// Interfaces de API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface FilterOptions {
  search?: string
  status?: string
  category?: string
  author?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Interfaces de formulários
export interface CreatePageData {
  title: string
  slug?: string
  content: string
  excerpt?: string
  status: PageStatus
  templateId?: string
  categoryId?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  ogImage?: string
  customFields: Record<string, any>
}

export interface UpdatePageData extends Partial<CreatePageData> {
  id: string
}

export interface CreateTemplateData {
  name: string
  description?: string
  html: string
  css?: string
  js?: string
  siteId?: string
  fields: Omit<TemplateField, 'id' | 'templateId'>[]
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {
  id: string
}

export interface CreateCategoryData {
  name: string
  slug?: string
  description?: string
  siteId: string
  parentId?: string
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string
}

export interface CreateUserData {
  email: string
  name: string
  password: string
  role: UserRole
  organizationId: string
}

export interface UpdateUserData extends Partial<Omit<CreateUserData, 'password'>> {
  id: string
  password?: string
}

export interface CreateOrganizationData {
  name: string
  slug: string
  description?: string
  settings?: Partial<OrganizationSettings>
}

export interface UpdateOrganizationData extends Partial<CreateOrganizationData> {
  id: string
}

export interface CreateSiteData {
  name: string
  url: string
  slug: string
  description?: string
  organizationId: string
  wpBaseUrl?: string
  wpAuthType?: 'basic' | 'bearer' | 'nonce'
  wpUsername?: string
  wpPassword?: string
  wpNonce?: string
}

export interface UpdateSiteData extends Partial<CreateSiteData> {
  id: string
}

// Interfaces de IA
export interface AIGeneratePageData {
  prompt: string
  model: string
  siteId: string
  templateId?: string
  categoryId?: string
  authorId: string
  options: {
    wordCount?: number
    includeImages?: boolean
    includeFAQ?: boolean
    includeBenefits?: boolean
    language?: string
  }
}

export interface AIGenerateImageData {
  prompt: string
  model: string
  size: '1024x1024' | '1024x1536' | '1536x1024'
  quality: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
}

// Interfaces de WordPress
export interface WordPressPageData {
  title: string
  content: string
  excerpt?: string
  status: 'publish' | 'draft' | 'private'
  slug?: string
  template?: string
  meta: Record<string, any>
  acf: Record<string, any>
}

export interface WordPressAuth {
  type: 'basic' | 'bearer' | 'nonce'
  username?: string
  password?: string
  token?: string
  nonce?: string
}

// Interfaces de SEO
export interface SEOData {
  title: string
  description: string
  keywords: string[]
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  twitterCard?: string
  canonicalUrl?: string
  robots?: string
}

// Interfaces de fila
export interface QueueJobData {
  type: JobType
  siteId: string
  inputData: Record<string, any>
  priority?: number
  delay?: number
  maxRetries?: number
}

export interface QueueJobResult {
  success: boolean
  data?: any
  error?: string
  retryable?: boolean
}

