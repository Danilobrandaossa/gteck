// Sistema de Paginação Inteligente para CMS
import { useState } from 'react'

export interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedData<T> {
  items: T[]
  pagination: PaginationState
}

export class PaginationManager<T> {
  private items: T[] = []
  private currentPage: number = 1
  private itemsPerPage: number = 20
  private totalItems: number = 0
  private isLoading: boolean = false

  constructor(itemsPerPage: number = 20) {
    this.itemsPerPage = itemsPerPage
  }

  // Configurar dados iniciais
  setData(items: T[], totalItems?: number) {
    this.items = items
    this.totalItems = totalItems || items.length
    this.currentPage = 1
  }

  // Adicionar mais itens (para carregamento dinâmico)
  addItems(newItems: T[]) {
    this.items = [...this.items, ...newItems]
    this.totalItems = this.items.length
  }

  // Obter itens da página atual
  getCurrentPageItems(): T[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    return this.items.slice(startIndex, endIndex)
  }

  // Navegar para próxima página
  nextPage(): boolean {
    if (this.hasNextPage()) {
      this.currentPage++
      return true
    }
    return false
  }

  // Navegar para página anterior
  previousPage(): boolean {
    if (this.hasPreviousPage()) {
      this.currentPage--
      return true
    }
    return false
  }

  // Ir para página específica
  goToPage(page: number): boolean {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page
      return true
    }
    return false
  }

  // Verificar se há próxima página
  hasNextPage(): boolean {
    return this.currentPage < this.getTotalPages()
  }

  // Verificar se há página anterior
  hasPreviousPage(): boolean {
    return this.currentPage > 1
  }

  // Obter total de páginas
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage)
  }

  // Obter estado da paginação
  getPaginationState(): PaginationState {
    return {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      totalItems: this.totalItems,
      totalPages: this.getTotalPages(),
      hasNextPage: this.hasNextPage(),
      hasPreviousPage: this.hasPreviousPage()
    }
  }

  // Obter dados paginados
  getPaginatedData(): PaginatedData<T> {
    return {
      items: this.getCurrentPageItems(),
      pagination: this.getPaginationState()
    }
  }

  // Resetar paginação
  reset() {
    this.currentPage = 1
    this.items = []
    this.totalItems = 0
  }

  // Definir estado de carregamento
  setLoading(loading: boolean) {
    this.isLoading = loading
  }

  // Verificar se está carregando
  getLoading(): boolean {
    return this.isLoading
  }
}

// Hook para paginação
export function usePagination<T>(itemsPerPage: number = 20) {
  const [paginationManager] = useState(() => new PaginationManager<T>(itemsPerPage))
  const [data, setData] = useState<PaginatedData<T>>({
    items: [],
    pagination: {
      currentPage: 1,
      itemsPerPage,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    }
  })

  const updateData = (items: T[], totalItems?: number) => {
    paginationManager.setData(items, totalItems)
    setData(paginationManager.getPaginatedData())
  }

  const addItems = (newItems: T[]) => {
    paginationManager.addItems(newItems)
    setData(paginationManager.getPaginatedData())
  }

  const nextPage = () => {
    if (paginationManager.nextPage()) {
      setData(paginationManager.getPaginatedData())
      return true
    }
    return false
  }

  const previousPage = () => {
    if (paginationManager.previousPage()) {
      setData(paginationManager.getPaginatedData())
      return true
    }
    return false
  }

  const goToPage = (page: number) => {
    if (paginationManager.goToPage(page)) {
      setData(paginationManager.getPaginatedData())
      return true
    }
    return false
  }

  const setLoading = (loading: boolean) => {
    paginationManager.setLoading(loading)
  }

  return {
    data,
    updateData,
    addItems,
    nextPage,
    previousPage,
    goToPage,
    setLoading,
    isLoading: paginationManager.getLoading()
  }
}

// Componente de controles de paginação
export interface PaginationControlsProps {
  pagination: PaginationState
  onNextPage: () => void
  onPreviousPage: () => void
  onGoToPage: (page: number) => void
  isLoading?: boolean
}

export function PaginationControls({ 
  pagination, 
  onNextPage, 
  onPreviousPage, 
  onGoToPage, 
  isLoading = false 
}: PaginationControlsProps) {
  const { currentPage, totalPages, hasNextPage, hasPreviousPage, totalItems } = pagination

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '0.5rem',
      border: '1px solid #e9ecef'
    }}>
      {/* Informações */}
      <div style={{ color: '#6c757d', fontSize: '0.875rem' }}>
        Página {currentPage} de {totalPages} • {totalItems} itens
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={onPreviousPage}
          disabled={!hasPreviousPage || isLoading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: hasPreviousPage ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: hasPreviousPage ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem'
          }}
        >
          Anterior
        </button>

        {/* Páginas */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = Math.max(1, currentPage - 2) + i
            if (page > totalPages) return null
            
            return (
              <button
                key={page}
                onClick={() => onGoToPage(page)}
                disabled={isLoading}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: page === currentPage ? '#007bff' : '#f8f9fa',
                  color: page === currentPage ? 'white' : '#007bff',
                  border: '1px solid #007bff',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {page}
              </button>
            )
          })}
        </div>

        <button
          onClick={onNextPage}
          disabled={!hasNextPage || isLoading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: hasNextPage ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: hasNextPage ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem'
          }}
        >
          Próxima
        </button>
      </div>
    </div>
  )
}