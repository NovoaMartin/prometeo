import { Hono } from 'hono'
import type { HonoEnv } from '../types'
import { autenticar } from '../auth'
import { responderIA, type Msg, type Perfil } from '../asistente'

export const asistente = new Hono<HonoEnv>()
asistente.use('*', autenticar)

const hits = new Map<string, { n: number; t: number }>()

asistente.post('/', async (c) => {
  const u = c.get('user')
  const now = Date.now(), h = hits.get(String(u.id))
  if (!h || now - h.t > 60_000) hits.set(String(u.id), { n: 1, t: now })
  else if (++h.n > 20) return c.json({ error: 'demasiadas solicitudes' }, 429)

  const b: any = await c.req.json().catch(() => null)
  const mensajes: Msg[] = b?.mensajes
  const ok = Array.isArray(mensajes) && mensajes.length > 0 &&
    mensajes.every((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length < 2000)
  if (!ok || mensajes[mensajes.length - 1].role !== 'user') return c.json({ error: 'solicitud inválida' }, 400)

  const org = u.org_id ? await c.env.DB.prepare('SELECT nombre, tipo, poblacion, plan FROM organizaciones WHERE id = ?').bind(u.org_id).first<any>() : null
  const perfil: Perfil = u.rol === 'referente' && org?.tipo === 'ong' ? 'ong' : u.rol === 'guardian' ? 'analista' : (u.rol as Perfil)

  // Contexto real de la alerta que el usuario está mirando (si tiene acceso)
  let alertaCtx: string | undefined
  const alertaId = Number(b?.alertaId)
  if (alertaId) {
    const a = await c.env.DB.prepare('SELECT a.*, o.nombre AS org_nombre FROM alertas a JOIN organizaciones o ON o.id = a.org_id WHERE a.id = ?').bind(alertaId).first<any>()
    if (a && (!u.org_id || a.org_id === u.org_id)) {
      const pasos = (await c.env.DB.prepare('SELECT texto, hecho FROM alerta_pasos WHERE alerta_id = ? ORDER BY orden').bind(a.id).all<any>()).results
      alertaCtx = `Alerta que el usuario está viendo (#${a.id}, ${a.org_nombre}): "${a.titulo}". Severidad ${a.severidad}, estado ${a.estado}, creada ${a.creada} UTC, IP de origen ${a.ip_origen ?? 'desconocida'}, ${a.usuario_seudonimo ?? 'usuario no identificado'}. ${a.descripcion}\nChecklist de contención:\n${pasos.map((p) => `- [${p.hecho ? 'x' : ' '}] ${p.texto}`).join('\n')}`
    }
  }
  const texto = await responderIA(c.env, perfil, org, String(b?.pantalla ?? '').slice(0, 40), alertaCtx, mensajes)
  return c.json({ texto, fuente: texto ? 'ia' : 'guion' })
})
