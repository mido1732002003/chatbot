/**
 * Performance optimization utilities
 */

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * Batch API calls
 */
export class BatchProcessor<T, R> {
  private queue: Array<{ item: T; resolve: (value: R) => void; reject: (error: any) => void }> = []
  private timer: NodeJS.Timeout | null = null

  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    private batchSize: number = 10,
    private delay: number = 100
  ) {}

  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject })
      this.scheduleBatch()
    })
  }

  private scheduleBatch() {
    if (this.timer) return

    this.timer = setTimeout(() => {
      this.processBatch()
    }, this.delay)
  }

  private async processBatch() {
    this.timer = null

    if (this.queue.length === 0) return

    const batch = this.queue.splice(0, this.batchSize)
    const items = batch.map(b => b.item)

    try {
      const results = await this.processor(items)
      batch.forEach((b, i) => b.resolve(results[i]))
    } catch (error) {
      batch.forEach(b => b.reject(error))
    }

    if (this.queue.length > 0) {
      this.scheduleBatch()
    }
  }
}

/**
 * Lazy load with intersection observer
 */
export function lazyLoad(
  element: HTMLElement,
  callback: () => void,
  options?: IntersectionObserverInit
): () => void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback()
        observer.unobserve(element)
      }
    })
  }, options)

  observer.observe(element)

  return () => observer.disconnect()
}