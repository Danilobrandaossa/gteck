// Sistema de Otimização de Performance
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private debounceTimers = new Map<string, NodeJS.Timeout>()

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  // Cache com TTL (Time To Live)
  setCache(key: string, data: any, ttl: number = 300000): void { // 5 minutos padrão
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  getCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > cached.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  // Debounce para evitar chamadas excessivas
  debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number = 300
  ): T {
    return ((...args: Parameters<T>) => {
      const existingTimer = this.debounceTimers.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const timer = setTimeout(() => {
        func(...args)
        this.debounceTimers.delete(key)
      }, delay)

      this.debounceTimers.set(key, timer)
    }) as T
  }

  // Throttle para limitar frequência de execução
  throttle<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    limit: number = 1000
  ): T {
    let lastExecution = 0

    return ((...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastExecution >= limit) {
        lastExecution = now
        return func(...args)
      }
    }) as T
  }

  // Lazy loading para componentes pesados
  createLazyComponent<T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ): React.LazyExoticComponent<T> {
    return React.lazy(importFunc)
  }

  // Memoização para cálculos pesados
  memoize<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    ttl: number = 60000 // 1 minuto padrão
  ): T {
    return ((...args: Parameters<T>) => {
      const cacheKey = `${key}_${JSON.stringify(args)}`
      const cached = this.getCache(cacheKey)
      
      if (cached !== null) {
        return cached
      }

      const result = func(...args)
      this.setCache(cacheKey, result, ttl)
      return result
    }) as T
  }

  // Paginação otimizada
  createPaginatedFetcher<T>(
    fetchFunc: (page: number, limit: number) => Promise<T[]>,
    pageSize: number = 20
  ) {
    let currentPage = 1
    let allData: T[] = []
    let isLoading = false
    let hasMore = true

    return {
      async loadNext(): Promise<T[]> {
        if (isLoading || !hasMore) return []

        isLoading = true
        try {
          const newData = await fetchFunc(currentPage, pageSize)
          allData = [...allData, ...newData]
          currentPage++
          hasMore = newData.length === pageSize
          return newData
        } finally {
          isLoading = false
        }
      },

      getData(): T[] {
        return allData
      },

      reset(): void {
        currentPage = 1
        allData = []
        hasMore = true
        isLoading = false
      },

      isLoading(): boolean {
        return isLoading
      },

      hasMore(): boolean {
        return hasMore
      }
    }
  }

  // Otimização de re-renders
  createStableCallback<T extends (...args: any[]) => any>(callback: T): T {
    const stableRef = React.useRef<T>()
    stableRef.current = callback
    return React.useCallback(
      ((...args: Parameters<T>) => stableRef.current?.(...args)) as T,
      []
    )
  }

  // Métricas de performance
  measurePerformance<T>(name: string, func: () => T): T {
    const start = performance.now()
    const result = func()
    const end = performance.now()
    
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`)
    return result
  }

  // Cleanup
  cleanup(): void {
    this.cache.clear()
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()
  }
}

// Hook para usar o otimizador
export function usePerformanceOptimizer() {
  return React.useMemo(() => PerformanceOptimizer.getInstance(), [])
}

// Hook para debounce
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook para throttle
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value)
  const lastRan = React.useRef<number>(Date.now())

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}









