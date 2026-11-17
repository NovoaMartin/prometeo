import { Hono } from 'hono'
import type { Context } from 'hono'
import type { HonoEnv } from '../types'
import { autenticar, orgDe, requiereRol } from '../auth'
import { ipAleatoria, PLANTILLAS, seudonimo, TIPOS, type TipoAlerta } from '../../shared/plantillas'

export const alertas = new Hono<HonoEnv>()
alertas.use('*', autenticar)

const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const SEV = ['critica', 'alta', 'media', 'baja']
const ESTADOS = ['nueva', 'en_investigacion', 'contenida', 'cerrada', 'falso_positivo']
const LECTURA = requiereRol('referente', 'intendente', 'analista')
const ESCRITURA = requiereRol('referente', 'analista')

// Alerta visible para el usuario (cada org ve solo las suyas; el analista ve todas)
async function cargar(c: Context<HonoEnv>, id: string | number) {
  const u = c.get('user')
  const a = await c.env.DB.prepare(
    `SELECT a.*, o.nombre AS org_nombre, us.nombre AS asignada_nombre FROM alertas a
     JOIN organizaciones o ON o.id = a.org_id LEFT JOIN usuarios us ON us.id = a.asignada_a WHERE a.id = ?`,
  ).bind(id).first<any>()
  if (!a || (u.org_id && a.org_id !== u.org_id)) return null
  return a
}

export async function crearAlerta(c: Context<HonoEnv>, d: {
  org_id: number; tipo: TipoAlerta; titulo?: string; descripcion?: string; severidad?: string
  ip_origen?: string; usuario_seudonimo?: string; origen: 'manual' | 'generador'; autor: string
}) {
  const p = PLANTILLAS[d.tipo]
  const a = await c.env.DB.prepare(
    'INSERT INTO alertas (org_id, tipo, titulo, descripcion, severidad, ip_origen, usuario_seudonimo, origen) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
  ).bind(d.org_id, d.tipo, d.titulo || p.titulo, d.descripcion || p.descripcion, SEV.includes(d.severidad ?? '') ? d.severidad : p.severidad,
    d.ip_origen || null, d.usuario_seudonimo || null, d.origen).first<{ id: number }>()
  await c.env.DB.batch([
    ...p.pasos.map((t, i) => c.env.DB.prepare('INSERT INTO alerta_pasos (alerta_id, orden, texto) VALUES (?, ?, ?)').bind(a!.id, i + 1, t)),
    c.env.DB.prepare('INSERT INTO alerta_eventos (alerta_id, autor, texto) VALUES (?, ?, ?)').bind(a!.id, d.autor, d.origen === 'generador' ? 'Alerta generada para pruebas' : 'Alerta registrada manualmente'),
  ])
  return a!.id
}

async function evento(c: Context<HonoEnv>, alertaId: number, texto: string) {
  await c.env.DB.prepare('INSERT INTO alerta_eventos (alerta_id, autor, texto) VALUES (?, ?, ?)').bind(alertaId, c.get('user').nombre, texto).run()
}

alertas.get('/alertas', LECTURA, async (c) => {
  const u = c.get('user')
  const org = u.org_id ?? (Number(c.req.query('org')) || null)
  const estado = c.req.query('estado'), sev = c.req.query('severidad')
  const w: string[] = [], b: unknown[] = []
  if (org) { w.push('a.org_id = ?'); b.push(org) }
  if (estado === 'abiertas') w.push(`a.estado IN ('nueva','en_investigacion')`)
  else if (estado && ESTADOS.includes(estado)) { w.push('a.estado = ?'); b.push(estado) }
  if (sev && SEV.includes(sev)) { w.push('a.severidad = ?'); b.push(sev) }
  const { results } = await c.env.DB.prepare(
    `SELECT a.id, a.org_id, o.nombre AS org_nombre, a.tipo, a.titulo, a.severidad, a.estado, a.creada, a.usuario_seudonimo, a.ip_origen, us.nombre AS asignada_nombre,
            CASE WHEN a.contenida_en IS NULL THEN NULL ELSE ROUND((julianday(a.contenida_en) - julianday(a.creada)) * 1440) END AS minutos
     FROM alertas a JOIN organizaciones o ON o.id = a.org_id LEFT JOIN usuarios us ON us.id = a.asignada_a
     ${w.length ? 'WHERE ' + w.join(' AND ') : ''}
     ORDER BY (a.estado IN ('nueva','en_investigacion')) DESC, a.creada DESC LIMIT 200`,
  ).bind(...b).all()
  return c.json(results)
})

alertas.get('/alertas/:id', LECTURA, async (c) => {
  const a = await cargar(c, c.req.param('id'))
  if (!a) return c.json({ error: 'no encontrada' }, 404)
  const [pasos, eventos, inds] = await Promise.all([
    c.env.DB.prepare('SELECT p.*, us.nombre AS hecho_por_nombre FROM alerta_pasos p LEFT JOIN usuarios us ON us.id = p.hecho_por WHERE p.alerta_id = ? ORDER BY p.orden').bind(a.id).all(),
    c.env.DB.prepare('SELECT ts, autor, texto FROM alerta_eventos WHERE alerta_id = ? ORDER BY ts, id').bind(a.id).all(),
    c.env.DB.prepare('SELECT id, tipo, valor, descripcion FROM indicadores WHERE alerta_id = ?').bind(a.id).all(),
  ])
  const minutos = a.contenida_en ? Math.round((Date.parse(a.contenida_en.replace(' ', 'T') + 'Z') - Date.parse(a.creada.replace(' ', 'T') + 'Z')) / 60000) : null
  return c.json({ ...a, minutos, pasos: pasos.results, eventos: eventos.results, indicadores: inds.results })
})

alertas.post('/alertas', ESCRITURA, async (c) => {
  const u = c.get('user')
  const b: any = await c.req.json().catch(() => null)
  const org = u.org_id ?? Number(b?.org_id)
  if (!org || !TIPOS.includes(b?.tipo)) return c.json({ error: 'datos inválidos' }, 400)
  if (!(await c.env.DB.prepare('SELECT 1 FROM organizaciones WHERE id = ?').bind(org).first())) return c.json({ error: 'organización inexistente' }, 404)
  const id = await crearAlerta(c, {
    org_id: org, tipo: b.tipo, titulo: str(b.titulo, 140), descripcion: str(b.descripcion, 500), severidad: b.severidad,
    ip_origen: str(b.ip_origen, 45), usuario_seudonimo: str(b.usuario_seudonimo, 40), origen: 'manual', autor: u.nombre,
  })
  return c.json({ id }, 201)
})

alertas.patch('/alertas/:id', ESCRITURA, async (c) => {
  const a = await cargar(c, c.req.param('id'))
  if (!a) return c.json({ error: 'no encontrada' }, 404)
  const b: any = await c.req.json().catch(() => null)
  const u = c.get('user')
  if (b?.estado && ESTADOS.includes(b.estado) && b.estado !== a.estado) {
    await c.env.DB.prepare(`UPDATE alertas SET estado = ?, contenida_en = CASE WHEN ? = 'contenida' THEN COALESCE(contenida_en, datetime('now')) WHEN ? IN ('nueva','en_investigacion') THEN NULL ELSE contenida_en END WHERE id = ?`)
      .bind(b.estado, b.estado, b.estado, a.id).run()
    await evento(c, a.id, `Estado: ${a.estado} → ${b.estado}`)
  }
  if (b && 'asignada_a' in b) {
    const nuevo = b.asignada_a ? u.id : null // solo se permite asignarse a uno mismo
    await c.env.DB.prepare('UPDATE alertas SET asignada_a = ? WHERE id = ?').bind(nuevo, a.id).run()
    await evento(c, a.id, nuevo ? `Asignada a ${u.nombre}` : 'Asignación quitada')
  }
  return c.json({ ok: true })
})

alertas.post('/alertas/:id/pasos/:paso', ESCRITURA, async (c) => {
  const a = await cargar(c, c.req.param('id'))
  if (!a) return c.json({ error: 'no encontrada' }, 404)
  const b: any = await c.req.json().catch(() => null)
  const hecho = b?.hecho ? 1 : 0
  const u = c.get('user')
  const p = await c.env.DB.prepare('SELECT * FROM alerta_pasos WHERE id = ? AND alerta_id = ?').bind(c.req.param('paso'), a.id).first<any>()
  if (!p) return c.json({ error: 'paso inexistente' }, 404)
  await c.env.DB.prepare(`UPDATE alerta_pasos SET hecho = ?, hecho_por = ?, hecho_en = CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END WHERE id = ?`).bind(hecho, hecho ? u.id : null, hecho, p.id).run()
  await evento(c, a.id, `${hecho ? 'Paso completado' : 'Paso reabierto'}: ${p.texto}`)
  // Al completar toda la checklist, el incidente queda contenido y se registra el tiempo
  const pend = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM alerta_pasos WHERE alerta_id = ? AND hecho = 0').bind(a.id).first<{ n: number }>()
  if (hecho && pend!.n === 0 && ['nueva', 'en_investigacion'].includes(a.estado)) {
    await c.env.DB.prepare(`UPDATE alertas SET estado = 'contenida', contenida_en = datetime('now') WHERE id = ?`).bind(a.id).run()
    await evento(c, a.id, 'Incidente contenido (checklist completa)')
  } else if (a.estado === 'nueva' && hecho) {
    await c.env.DB.prepare(`UPDATE alertas SET estado = 'en_investigacion' WHERE id = ?`).bind(a.id).run()
  }
  return c.json({ ok: true })
})

alertas.post('/alertas/:id/notas', ESCRITURA, async (c) => {
  const a = await cargar(c, c.req.param('id'))
  if (!a) return c.json({ error: 'no encontrada' }, 404)
  const b: any = await c.req.json().catch(() => null)
  const t = str(b?.texto, 500)
  if (!t) return c.json({ error: 'nota vacía' }, 400)
  await evento(c, a.id, t)
  return c.json({ ok: true }, 201)
})

// Publicar un indicador (IP/dominio) en la red de amenazas compartidas
alertas.post('/alertas/:id/indicadores', requiereRol('analista'), async (c) => {
  const a = await cargar(c, c.req.param('id'))
  if (!a) return c.json({ error: 'no encontrada' }, 404)
  const b: any = await c.req.json().catch(() => null)
  const valor = str(b?.valor, 120).toLowerCase()
  if (!valor || !['ip', 'dominio'].includes(b?.tipo)) return c.json({ error: 'datos inválidos' }, 400)
  const ya = await c.env.DB.prepare('SELECT id FROM indicadores WHERE valor = ?').bind(valor).first()
  if (ya) return c.json({ error: 'ese indicador ya fue publicado' }, 409)
  await c.env.DB.prepare('INSERT INTO indicadores (tipo, valor, descripcion, org_origen, alerta_id) VALUES (?, ?, ?, ?, ?)').bind(b.tipo, valor, str(b.descripcion, 200) || a.titulo, a.org_id, a.id).run()
  await evento(c, a.id, `Indicador publicado en la red: ${valor}`)
  return c.json({ ok: true }, 201)
})

// ---------- Red de amenazas compartidas ----------
alertas.get('/red', LECTURA, async (c) => {
  const u = c.get('user')
  const [inds, orgs] = await Promise.all([
    c.env.DB.prepare(
      `SELECT i.id, i.tipo, i.valor, i.descripcion, i.creado, o.nombre AS origen,
              (SELECT group_concat(b.org_id) FROM bloqueos b WHERE b.indicador_id = i.id) AS bloqueada_por
       FROM indicadores i LEFT JOIN organizaciones o ON o.id = i.org_origen ORDER BY i.creado DESC`).all<any>(),
    c.env.DB.prepare(`SELECT id, nombre, plan FROM organizaciones WHERE plan = 'escudo' ORDER BY id`).all<any>(),
  ])
  return c.json({
    miOrg: u.org_id,
    organizaciones: orgs.results,
    indicadores: inds.results.map((i) => ({ ...i, bloqueada_por: i.bloqueada_por ? i.bloqueada_por.split(',').map(Number) : [] })),
  })
})

alertas.post('/red/indicadores/:id/bloquear', requiereRol('referente'), async (c) => {
  const u = c.get('user')
  if (!(await c.env.DB.prepare('SELECT 1 FROM indicadores WHERE id = ?').bind(c.req.param('id')).first())) return c.json({ error: 'no encontrado' }, 404)
  await c.env.DB.prepare('INSERT OR IGNORE INTO bloqueos (indicador_id, org_id) VALUES (?, ?)').bind(c.req.param('id'), u.org_id).run()
  return c.json({ ok: true })
})

// ---------- Consola SOC ----------
alertas.get('/soc/resumen', requiereRol('analista'), async (c) => {
  const r = await c.env.DB.prepare(
    `SELECT SUM(estado IN ('nueva','en_investigacion')) AS abiertas,
            SUM(estado IN ('nueva','en_investigacion') AND severidad = 'critica') AS criticas,
            SUM(estado = 'nueva') AS sin_asignar_revisar,
            AVG(CASE WHEN contenida_en IS NOT NULL THEN (julianday(contenida_en) - julianday(creada)) * 1440 END) AS tiempo
     FROM alertas`).first<any>()
  const orgs = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM organizaciones WHERE plan = 'escudo'`).first<any>()
  return c.json({ abiertas: r.abiertas ?? 0, criticas: r.criticas ?? 0, nuevas: r.sin_asignar_revisar ?? 0, tiempoMedioMin: r.tiempo == null ? null : Math.round(r.tiempo), orgsMonitoreadas: orgs.n })
})

// ---------- Generador de eventos de prueba ----------
alertas.post('/demo/generar', ESCRITURA, async (c) => {
  const u = c.get('user')
  const b: any = await c.req.json().catch(() => null)
  const cantidad = Math.min(10, Math.max(1, Math.round(Number(b?.cantidad) || 1)))
  let orgs: number[]
  if (u.org_id) orgs = [u.org_id]
  else if (Number(b?.org_id)) orgs = [Number(b.org_id)]
  else orgs = ((await c.env.DB.prepare(`SELECT id FROM organizaciones WHERE plan = 'escudo'`).all<{ id: number }>()).results).map((o) => o.id)
  if (!orgs.length) return c.json({ error: 'no hay organizaciones monitoreadas' }, 400)
  const rnd = Math.random
  const ids: number[] = []
  for (let i = 0; i < cantidad; i++) {
    ids.push(await crearAlerta(c, {
      org_id: orgs[Math.floor(rnd() * orgs.length)], tipo: TIPOS[Math.floor(rnd() * TIPOS.length)],
      ip_origen: ipAleatoria(rnd), usuario_seudonimo: seudonimo(rnd), origen: 'generador', autor: u.nombre,
    }))
  }
  return c.json({ creadas: ids.length, ids })
})
