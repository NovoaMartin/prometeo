import { useMutation, useQueryClient } from '@tanstack/react-query'

// Mutación que invalida las consultas indicadas al terminar
export function useAccion<V = void>(fn: (v: V) => Promise<unknown>, invalidar: string[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => { invalidar.forEach((k) => qc.invalidateQueries({ queryKey: [k] })) },
  })
}
