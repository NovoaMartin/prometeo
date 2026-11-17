import { responderIA, type Msg, type Rol } from './asistente'

interface Env {
  DB: D1Database
  ASSETS: Fetcher
  DEEPSEEK_API_KEY?: string
  DEEPSEEK_MODEL?: string
}

const ROLES = ['referente', 'intendente', 'analista', 'ong']
const json = (data: unknown, status = 200) => Response.json(data, { status })

// Rate limit best-effort en memoria (por isolate): 30 req/min por IP en el asistente
const hits = new Map<string, { n: number; t: number }>()
function limitado(ip: string) {
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || now - h.t > 60_000) { hits.set(ip, { n: 1, t: now }); return false }
  return ++h.n > 30
}

async function body(req: Request): Promise<any> {
  try { return await req.json() } catch { return null }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url)
    if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(req)

    if (pathname === '/api/health' && req.method === 'GET') return json({ ok: true, ia: !!env.DEEPSEEK_API_KEY })

    if (pathname === '/api/diagnosticos/stats' && req.method === 'GET') {
      const r = await env.DB.prepare(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(creado >= datetime('now','-7 days')), 0) AS ultimos7Dias,
                COALESCE(ROUND(AVG(puntaje)), 0) AS promedioPuntaje
         FROM diagnosticos`,
      ).first<{ total: number; ultimos7Dias: number; promedioPuntaje: number }>()
      return json({ total: r?.total ?? 0, ultimos7Dias: r?.ultimos7Dias ?? 0, promedioPuntaje: r?.promedioPuntaje ?? 0 })
    }

    if (pathname === '/api/diagnosticos' && req.method === 'POST') {
      const b = await body(req)
      if (!b || typeof b.municipio !== 'string' || !Number.isFinite(b.poblacion) || !Number.isFinite(b.puntaje) || typeof b.nivel !== 'string') {
        return json({ error: 'datos inválidos' }, 400)
      }
      await env.DB.prepare('INSERT INTO diagnosticos (municipio, poblacion, tipo, puntaje, nivel, respuestas) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(b.municipio.slice(0, 80), b.poblacion, String(b.tipo ?? 'municipio'), b.puntaje, b.nivel, JSON.stringify(b.respuestas ?? {}))
        .run()
      return json({ ok: true })
    }

    if (pathname === '/api/asistente' && req.method === 'POST') {
      if (limitado(req.headers.get('CF-Connecting-IP') ?? 'x')) return json({ error: 'demasiadas solicitudes' }, 429)
      const b = await body(req)
      const { rol, pantalla, alertaId, mensajes } = b ?? {}
      const ok = Array.isArray(mensajes) && mensajes.length > 0 &&
        mensajes.every((m: Msg) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length < 2000)
      if (!ROLES.includes(rol) || !ok || mensajes[mensajes.length - 1].role !== 'user') return json({ error: 'solicitud inválida' }, 400)
      const texto = await responderIA(env, rol as Rol, String(pantalla ?? ''), alertaId ? String(alertaId) : undefined, mensajes)
      return json({ texto, fuente: texto ? 'ia' : 'guion' })
    }

    return json({ error: 'no encontrado' }, 404)
  },
}
