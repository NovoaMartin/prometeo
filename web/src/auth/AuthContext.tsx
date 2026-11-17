import { createContext, useContext, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError, post } from '../lib/api'

export type Rol = 'referente' | 'intendente' | 'analista' | 'guardian'
export interface Usuario { id: number; org_id: number | null; email: string; nombre: string; rol: Rol }
export interface Org { id: number; nombre: string; tipo: 'municipio' | 'ong'; poblacion: number; plan: 'free' | 'guardianes' | 'escudo'; cuentas_total: number; cuentas_mfa: number }
interface Sesion { usuario: Usuario; org: Org | null }

interface Ctx {
  user: Usuario | null
  org: Org | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  registro: (body: unknown) => Promise<void>
  logout: () => Promise<void>
}

const AuthCtx = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<Sesion | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try { return await api<Sesion>('/auth/me') } catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e }
    },
    retry: false,
    staleTime: 60_000,
  })

  // Se descarta la caché de datos del usuario anterior, pero no la consulta 'me' a la que está suscripto este provider
  const limpiar = () => qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
  const entrar = (s: Sesion) => { limpiar(); qc.setQueryData(['me'], s) }
  const value: Ctx = {
    user: data?.usuario ?? null,
    org: data?.org ?? null,
    loading: isLoading,
    login: async (email, password) => entrar(await post<Sesion>('/auth/login', { email, password })),
    registro: async (body) => entrar(await post<Sesion>('/auth/registro', body)),
    logout: async () => { await post('/auth/logout').catch(() => {}); limpiar(); qc.setQueryData(['me'], null) },
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const c = useContext(AuthCtx)
  if (!c) throw new Error('AuthProvider faltante')
  return c
}
