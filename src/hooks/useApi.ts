import { useState, useCallback, useEffect } from 'react'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface UseApiOptions {
  immediate?: boolean
}

/**
 * Custom hook for API calls with tenant context
 * @param apiFn - The API function to call
 * @param tenantId - The tenant ID
 * @param options - Hook options
 */
export function useApi<T>(
  apiFn: (tenantId: string, ...args: any[]) => Promise<T>,
  tenantId: string,
  options: UseApiOptions = { immediate: true }
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetch = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const data = await apiFn(tenantId)
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      })
    }
  }, [apiFn, tenantId])

  useEffect(() => {
    if (options.immediate) {
      fetch()
    }
  }, [fetch, options.immediate])

  return {
    ...state,
    refetch: fetch,
  }
}

/**
 * Custom hook for list API calls with pagination
 * @param apiFn - The API list function
 * @param tenantId - The tenant ID
 * @param initialFilters - Initial filter values
 */
export function useApiList<T>(
  apiFn: (tenantId: string, filters?: any) => Promise<T[]>,
  tenantId: string,
  initialFilters: Record<string, any> = {}
): UseApiState<T[]> & {
  refetch: () => Promise<void>
  setFilters: (filters: Record<string, any>) => void
  filters: Record<string, any>
} {
  const [state, setState] = useState<UseApiState<T[]>>({
    data: null,
    loading: true,
    error: null,
  })
  const [filters, setFilters] = useState(initialFilters)

  const fetch = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const data = await apiFn(tenantId, filters)
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      })
    }
  }, [apiFn, tenantId, filters])

  useEffect(() => {
    fetch()
  }, [fetch])

  return {
    ...state,
    refetch: fetch,
    setFilters,
    filters,
  }
}

/**
 * Custom hook for mutating data (POST, PUT, DELETE)
 * @param apiFn - The API mutation function
 */
export function useMutation<T, P>(
  apiFn: (...args: any[]) => Promise<T>
): [
  (payload: P) => Promise<T>,
  { loading: boolean; error: Error | null; data: T | null }
] {
  const [state, setState] = useState({
    loading: false,
    error: null as Error | null,
    data: null as T | null,
  })

  const mutate = useCallback(
    async (payload: P) => {
      try {
        setState({ loading: true, error: null, data: null })
        const data = await apiFn(payload)
        setState({ loading: false, error: null, data })
        return data
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error')
        setState({ loading: false, error: err, data: null })
        throw err
      }
    },
    [apiFn]
  )

  return [mutate, state]
}
