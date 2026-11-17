import type { Rol } from '../data/municipio'

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

async function req<T>(path: string, init: RequestInit | undefined, fallback: T, ms = 4000): Promise<T> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), ms)
  try {
    const r = await fetch(BASE + path, { ...init, signal: ctl.signal, headers: { 'Content-Type': 'application/json' } })
    if (!r.ok) return fallback
    return (await r.json()) as T
  } catch {
    return fallback
  } finally {
    clearTimeout(timer)
  }
}

export interface Stats { total: number; ultimos7Dias: number; promedioPuntaje: number; mock?: boolean }

export const getStats = () =>
  req<Stats>('/api/diagnosticos/stats', undefined, { total: 127, ultimos7Dias: 18, promedioPuntaje: 44, mock: true })

export const postDiagnostico = (body: object) =>
  req<{ ok: boolean }>('/api/diagnosticos', { method: 'POST', body: JSON.stringify(body) }, { ok: false })

export interface AsistenteReq {
  rol: Rol
  pantalla: string
  alertaId?: string
  mensajes: { role: 'user' | 'assistant'; content: string }[]
}
export interface AsistenteRes { texto: string | null; fuente: 'ia' | 'guion' }

// texto null => el front usa el guion local
export const postAsistente = (b: AsistenteReq) =>
  req<AsistenteRes>('/api/asistente', { method: 'POST', body: JSON.stringify(b) }, { texto: null, fuente: 'guion' }, 20000)
