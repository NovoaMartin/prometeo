export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch('/api' + path, {
    method: opts.method ?? 'GET',
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
  const data = await r.json().catch(() => null)
  if (!r.ok) throw new ApiError(r.status, (data as { error?: string } | null)?.error ?? 'Error de red')
  return data as T
}

export const post = <T = unknown>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body: body ?? {} })
export const patch = <T = unknown>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body })
export const del = <T = unknown>(path: string) => api<T>(path, { method: 'DELETE' })

export interface Stats { total: number; ultimos7Dias: number; promedioPuntaje: number }
export interface AsistenteRes { texto: string | null; fuente: 'ia' | 'guion' }

const utc = (s: string) => new Date(s.replace(' ', 'T') + 'Z')
export const fecha = (s?: string | null) => (s ? utc(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—')
export const fechaHora = (s?: string | null) => (s ? utc(s).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')
