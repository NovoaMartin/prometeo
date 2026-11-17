import { Hono } from 'hono'
import type { HonoEnv } from '../types'
import { nivel, puntajeBase, respuestasValidas } from '../../shared/scoring'

export const publico = new Hono<HonoEnv>()

publico.get('/stats', async (c) => {
  const r = await c.env.DB.prepare(
    `SELECT COUNT(*) AS total, COALESCE(SUM(creado >= datetime('now','-7 days')), 0) AS ultimos7Dias, COALESCE(ROUND(AVG(puntaje)), 0) AS promedioPuntaje FROM diagnosticos`,
  ).first<{ total: number; ultimos7Dias: number; promedioPuntaje: number }>()
  return c.json(r)
})

// Autodiagnóstico gratuito (lead sin cuenta)
const hits = new Map<string, { n: number; t: number }>()
publico.post('/', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'x'
  const now = Date.now(), h = hits.get(ip)
  if (!h || now - h.t > 60_000) hits.set(ip, { n: 1, t: now })
  else if (++h.n > 20) return c.json({ error: 'demasiadas solicitudes' }, 429)

  const b: any = await c.req.json().catch(() => null)
  if (!b || typeof b.municipio !== 'string' || !respuestasValidas(b.respuestas)) return c.json({ error: 'datos inválidos' }, 400)
  const p = puntajeBase(b.respuestas)
  const tipo = b.tipo === 'ong' ? 'ong' : 'municipio'
  const em = typeof b.email === 'string' ? b.email.trim().slice(0, 120) : null
  await c.env.DB.prepare('INSERT INTO diagnosticos (municipio, poblacion, tipo, puntaje, nivel, respuestas, email_contacto) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(b.municipio.slice(0, 80), Math.max(0, Number(b.poblacion) || 0), tipo, p, nivel(p), JSON.stringify(b.respuestas), em || null).run()
  return c.json({ ok: true, puntaje: p })
})
