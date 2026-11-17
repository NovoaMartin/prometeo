import { Hono } from 'hono'
import type { HonoEnv } from '../types'
import { autenticar, hashPass, nuevoSalt, orgDe, requiereRol } from '../auth'
import { nivel, puntajeBase, respuestasValidas, topAcciones } from '../../shared/scoring'

export const org = new Hono<HonoEnv>()
org.use('*', autenticar)

const num = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d)
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const json = async (c: any) => (await c.req.json().catch(() => null)) as any
const SEV = ['critica', 'alta', 'media', 'baja']

function orgOr400(c: any): number | Response {
  const id = orgDe(c)
  return id ?? c.json({ error: 'organización requerida' }, 400)
}

// ---------- Organización y usuarios ----------
org.get('/orgs', requiereRol('analista'), async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT o.*, (SELECT COUNT(*) FROM alertas a WHERE a.org_id = o.id AND a.estado IN ('nueva','en_investigacion')) AS abiertas FROM organizaciones o ORDER BY o.nombre`,
  ).all()
  return c.json(results)
})

org.get('/org', requiereRol('referente', 'intendente', 'analista'), async (c) => {
  const id = orgOr400(c); if (id instanceof Response) return id
  const o = await c.env.DB.prepare('SELECT * FROM organizaciones WHERE id = ?').bind(id).first()
  return o ? c.json(o) : c.json({ error: 'no encontrada' }, 404)
})

org.patch('/org', requiereRol('referente'), async (c) => {
  const b = await json(c); if (!b) return c.json({ error: 'datos inválidos' }, 400)
  const u = c.get('user')
  const total = Math.max(0, Math.round(num(b.cuentas_total)))
  const mfa = Math.min(total, Math.max(0, Math.round(num(b.cuentas_mfa))))
  const plan = ['free', 'guardianes', 'escudo'].includes(b.plan) ? b.plan : null
  await c.env.DB.prepare('UPDATE organizaciones SET nombre = COALESCE(NULLIF(?, \'\'), nombre), poblacion = ?, cuentas_total = ?, cuentas_mfa = ?, plan = COALESCE(?, plan) WHERE id = ?')
    .bind(str(b.nombre, 80), Math.max(0, Math.round(num(b.poblacion))), total, mfa, plan, u.org_id).run()
  return c.json(await c.env.DB.prepare('SELECT * FROM organizaciones WHERE id = ?').bind(u.org_id).first())
})

org.get('/usuarios', requiereRol('referente'), async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, email, nombre, rol, creado FROM usuarios WHERE org_id = ? ORDER BY id').bind(c.get('user').org_id).all()
  return c.json(results)
})

org.post('/usuarios', requiereRol('referente'), async (c) => {
  const b = await json(c)
  const em = str(b?.email, 120).toLowerCase()
  const rol = b?.rol === 'intendente' ? 'intendente' : 'referente'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em) || !str(b?.nombre, 80) || typeof b?.password !== 'string' || b.password.length < 8) {
    return c.json({ error: 'datos inválidos (contraseña de al menos 8 caracteres)' }, 400)
  }
  if (await c.env.DB.prepare('SELECT 1 FROM usuarios WHERE email = ?').bind(em).first()) return c.json({ error: 'ese email ya está registrado' }, 409)
  const salt = nuevoSalt()
  await c.env.DB.prepare('INSERT INTO usuarios (org_id, email, nombre, rol, pass_hash, salt) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(c.get('user').org_id, em, str(b.nombre, 80), rol, await hashPass(b.password, salt), salt).run()
  return c.json({ ok: true }, 201)
})

org.get('/guardianes', requiereRol('referente', 'analista'), async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT id, nombre FROM usuarios WHERE rol = 'guardian' ORDER BY nombre`).all()
  return c.json(results)
})

// ---------- Panel ----------
org.get('/panel', requiereRol('referente', 'intendente', 'analista'), async (c) => {
  const id = orgOr400(c); if (id instanceof Response) return id
  const db = c.env.DB
  const o = await db.prepare('SELECT * FROM organizaciones WHERE id = ?').bind(id).first<any>()
  if (!o) return c.json({ error: 'no encontrada' }, 404)
  const [diag, ab, tiempo, tareas, vulns, quiz, restau, recientes] = await Promise.all([
    db.prepare('SELECT id, creado, puntaje, nivel FROM diagnosticos WHERE org_id = ? ORDER BY creado, id').bind(id).all(),
    db.prepare(`SELECT severidad, COUNT(*) AS n FROM alertas WHERE org_id = ? AND estado IN ('nueva','en_investigacion') GROUP BY severidad`).bind(id).all<any>(),
    db.prepare('SELECT AVG((julianday(contenida_en) - julianday(creada)) * 1440) AS m FROM alertas WHERE org_id = ? AND contenida_en IS NOT NULL').bind(id).first<any>(),
    db.prepare('SELECT estado, COUNT(*) AS n FROM tareas WHERE org_id = ? GROUP BY estado').bind(id).all<any>(),
    db.prepare(`SELECT severidad, COUNT(*) AS n FROM vulnerabilidades WHERE org_id = ? AND estado = 'abierta' GROUP BY severidad`).bind(id).all<any>(),
    db.prepare('SELECT COUNT(DISTINCT usuario_id) AS personas, AVG(aciertos * 100.0 / total) AS promedio FROM quiz_resultados WHERE org_id = ?').bind(id).first<any>(),
    db.prepare(`SELECT completada FROM tareas WHERE org_id = ? AND pregunta_id = 'q6' AND estado = 'hecha' ORDER BY completada DESC LIMIT 1`).bind(id).first<any>(),
    db.prepare('SELECT id, titulo, severidad, estado, creada FROM alertas WHERE org_id = ? ORDER BY creada DESC LIMIT 6').bind(id).all(),
  ])
  const cnt = (rows: any[], k: string) => Object.fromEntries(rows.map((r) => [r[k], r.n]))
  const evol = diag.results as any[]
  return c.json({
    org: o,
    madurez: evol.length ? evol[evol.length - 1] : null,
    evolucion: evol,
    mfaPct: o.cuentas_total ? Math.round((o.cuentas_mfa / o.cuentas_total) * 100) : null,
    alertasAbiertas: cnt(ab.results, 'severidad'),
    tiempoMedioMin: tiempo?.m == null ? null : Math.round(tiempo.m),
    tareas: cnt(tareas.results, 'estado'),
    vulnsAbiertas: cnt(vulns.results, 'severidad'),
    capacitacion: { personas: quiz?.personas ?? 0, promedio: quiz?.promedio == null ? null : Math.round(quiz.promedio) },
    ultimaRestauracion: restau?.completada ?? null,
    alertasRecientes: recientes.results,
  })
})

// ---------- Diagnósticos ----------
org.get('/diagnosticos', requiereRol('referente', 'intendente', 'analista'), async (c) => {
  const id = orgOr400(c); if (id instanceof Response) return id
  const { results } = await c.env.DB.prepare('SELECT id, creado, puntaje, nivel, respuestas FROM diagnosticos WHERE org_id = ? ORDER BY creado DESC, id DESC').bind(id).all<any>()
  return c.json(results.map((r) => ({ ...r, respuestas: JSON.parse(r.respuestas) })))
})

org.post('/diagnosticos', requiereRol('referente'), async (c) => {
  const b = await json(c)
  if (!respuestasValidas(b?.respuestas)) return c.json({ error: 'respuestas inválidas' }, 400)
  const u = c.get('user')
  const o = await c.env.DB.prepare('SELECT nombre, poblacion, tipo FROM organizaciones WHERE id = ?').bind(u.org_id).first<any>()
  const p = puntajeBase(b.respuestas)
  const r = await c.env.DB.prepare('INSERT INTO diagnosticos (municipio, poblacion, tipo, puntaje, nivel, respuestas, org_id) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id, creado, puntaje, nivel')
    .bind(o.nombre, o.poblacion, o.tipo, p, nivel(p), JSON.stringify(b.respuestas), u.org_id).first()
  return c.json(r, 201)
})

// Convierte las 5 acciones prioritarias de un diagnóstico en tareas (sin duplicar las abiertas)
org.post('/diagnosticos/:id/plan', requiereRol('referente'), async (c) => {
  const u = c.get('user')
  const d = await c.env.DB.prepare('SELECT respuestas FROM diagnosticos WHERE id = ? AND org_id = ?').bind(c.req.param('id'), u.org_id).first<any>()
  if (!d) return c.json({ error: 'no encontrado' }, 404)
  const { results: abiertas } = await c.env.DB.prepare(`SELECT pregunta_id FROM tareas WHERE org_id = ? AND estado != 'hecha'`).bind(u.org_id).all<any>()
  const ya = new Set(abiertas.map((t) => t.pregunta_id))
  const nuevas = topAcciones(JSON.parse(d.respuestas)).filter((a) => !ya.has(a.id))
  if (nuevas.length) {
    await c.env.DB.batch(nuevas.map((a) =>
      c.env.DB.prepare('INSERT INTO tareas (org_id, titulo, area, impacto, esfuerzo, pregunta_id) VALUES (?, ?, ?, ?, ?, ?)').bind(u.org_id, a.accion, a.area, a.impacto, a.esfuerzo, a.id)))
  }
  return c.json({ creadas: nuevas.length })
})

// ---------- Tareas ----------
org.get('/tareas', async (c) => {
  const u = c.get('user')
  const base = `SELECT t.*, g.nombre AS asignado_nombre, o.nombre AS org_nombre FROM tareas t LEFT JOIN usuarios g ON g.id = t.asignado_a JOIN organizaciones o ON o.id = t.org_id`
  const orden = `ORDER BY CASE t.estado WHEN 'en_curso' THEN 0 WHEN 'pendiente' THEN 1 ELSE 2 END, t.impacto DESC, t.id`
  if (u.rol === 'guardian') return c.json((await c.env.DB.prepare(`${base} WHERE t.asignado_a = ? ${orden}`).bind(u.id).all()).results)
  const id = orgOr400(c); if (id instanceof Response) return id
  return c.json((await c.env.DB.prepare(`${base} WHERE t.org_id = ? ${orden}`).bind(id).all()).results)
})

org.patch('/tareas/:id', requiereRol('referente', 'guardian'), async (c) => {
  const u = c.get('user')
  const b = await json(c); if (!b) return c.json({ error: 'datos inválidos' }, 400)
  const t = await c.env.DB.prepare('SELECT * FROM tareas WHERE id = ?').bind(c.req.param('id')).first<any>()
  const permitido = t && (u.rol === 'referente' ? t.org_id === u.org_id : t.asignado_a === u.id)
  if (!permitido) return c.json({ error: 'no encontrada' }, 404)

  const estado = ['pendiente', 'en_curso', 'hecha'].includes(b.estado) ? b.estado : t.estado
  let asignado = t.asignado_a, supervisor = t.supervisor
  if (u.rol === 'referente') { // el guardián solo cambia el estado
    if ('asignado_a' in b) asignado = b.asignado_a ? num(b.asignado_a) : null
    if ('supervisor' in b) supervisor = str(b.supervisor, 80) || null
  }
  await c.env.DB.prepare(`UPDATE tareas SET estado = ?, asignado_a = ?, supervisor = ?, completada = CASE WHEN ? = 'hecha' THEN COALESCE(completada, datetime('now')) ELSE NULL END WHERE id = ?`)
    .bind(estado, asignado, supervisor, estado, t.id).run()
  return c.json({ ok: true })
})

// ---------- Inventario de datos sensibles ----------
const TIPOS_DATO = ['salud', 'fiscal', 'social', 'personal', 'otro']
org.get('/inventario', requiereRol('referente', 'intendente', 'analista'), async (c) => {
  const id = orgOr400(c); if (id instanceof Response) return id
  return c.json((await c.env.DB.prepare('SELECT * FROM inventario WHERE org_id = ? ORDER BY acceso_restringido, titulares DESC').bind(id).all()).results)
})
org.post('/inventario', requiereRol('referente'), async (c) => {
  const b = await json(c)
  if (!str(b?.nombre, 100) || !TIPOS_DATO.includes(b?.tipo_dato)) return c.json({ error: 'datos inválidos' }, 400)
  await c.env.DB.prepare('INSERT INTO inventario (org_id, nombre, area_municipal, tipo_dato, titulares, ubicacion, acceso_restringido) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(c.get('user').org_id, str(b.nombre, 100), str(b.area_municipal, 80), b.tipo_dato, Math.max(0, Math.round(num(b.titulares))), str(b.ubicacion, 120), b.acceso_restringido ? 1 : 0).run()
  return c.json({ ok: true }, 201)
})
org.patch('/inventario/:id', requiereRol('referente'), async (c) => {
  const b = await json(c)
  const r = await c.env.DB.prepare('UPDATE inventario SET acceso_restringido = ? WHERE id = ? AND org_id = ?').bind(b?.acceso_restringido ? 1 : 0, c.req.param('id'), c.get('user').org_id).run()
  return r.meta.changes ? c.json({ ok: true }) : c.json({ error: 'no encontrado' }, 404)
})
org.delete('/inventario/:id', requiereRol('referente'), async (c) => {
  const r = await c.env.DB.prepare('DELETE FROM inventario WHERE id = ? AND org_id = ?').bind(c.req.param('id'), c.get('user').org_id).run()
  return r.meta.changes ? c.json({ ok: true }) : c.json({ error: 'no encontrado' }, 404)
})

// ---------- Vulnerabilidades ----------
org.get('/vulnerabilidades', requiereRol('referente', 'intendente', 'analista'), async (c) => {
  const id = orgOr400(c); if (id instanceof Response) return id
  return c.json((await c.env.DB.prepare(
    `SELECT * FROM vulnerabilidades WHERE org_id = ? ORDER BY estado, CASE severidad WHEN 'critica' THEN 0 WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END`).bind(id).all()).results)
})
org.post('/vulnerabilidades', requiereRol('referente', 'analista'), async (c) => {
  const b = await json(c)
  const id = orgDe(c) ?? num(b?.org_id)
  if (!id || !str(b?.nombre, 120) || !SEV.includes(b?.severidad)) return c.json({ error: 'datos inválidos' }, 400)
  await c.env.DB.prepare('INSERT INTO vulnerabilidades (org_id, nombre, activo, severidad) VALUES (?, ?, ?, ?)').bind(id, str(b.nombre, 120), str(b.activo, 80) || '—', b.severidad).run()
  return c.json({ ok: true }, 201)
})
org.patch('/vulnerabilidades/:id', requiereRol('referente', 'analista'), async (c) => {
  const b = await json(c)
  const estado = b?.estado === 'mitigada' ? 'mitigada' : 'abierta'
  const u = c.get('user')
  const r = await c.env.DB.prepare(`UPDATE vulnerabilidades SET estado = ?, mitigada = CASE WHEN ? = 'mitigada' THEN datetime('now') ELSE NULL END WHERE id = ? AND (? IS NULL OR org_id = ?)`)
    .bind(estado, estado, c.req.param('id'), u.org_id, u.org_id).run()
  return r.meta.changes ? c.json({ ok: true }) : c.json({ error: 'no encontrada' }, 404)
})

// ---------- Capacitación (quiz) ----------
org.get('/quiz', requiereRol('referente', 'intendente'), async (c) => {
  const u = c.get('user')
  const { results } = await c.env.DB.prepare(
    `SELECT q.id, q.aciertos, q.total, q.fecha, us.nombre FROM quiz_resultados q JOIN usuarios us ON us.id = q.usuario_id WHERE q.org_id = ? ORDER BY q.fecha DESC LIMIT 30`).bind(u.org_id).all()
  return c.json(results)
})
org.post('/quiz', requiereRol('referente', 'intendente'), async (c) => {
  const b = await json(c)
  const total = Math.round(num(b?.total)), aciertos = Math.round(num(b?.aciertos, -1))
  if (total < 1 || total > 50 || aciertos < 0 || aciertos > total) return c.json({ error: 'datos inválidos' }, 400)
  const u = c.get('user')
  await c.env.DB.prepare('INSERT INTO quiz_resultados (usuario_id, org_id, aciertos, total) VALUES (?, ?, ?, ?)').bind(u.id, u.org_id, aciertos, total).run()
  return c.json({ ok: true }, 201)
})

// ---------- Reporte de cumplimiento ----------
org.get('/reporte', requiereRol('referente', 'intendente', 'analista'), async (c) => {
  const id = orgOr400(c); if (id instanceof Response) return id
  const f = (v: string | undefined, d: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : d)
  const hoy = new Date()
  const desde = f(c.req.query('desde'), new Date(hoy.getTime() - 90 * 864e5).toISOString().slice(0, 10))
  const hasta = f(c.req.query('hasta'), hoy.toISOString().slice(0, 10))
  const db = c.env.DB
  const o = await db.prepare('SELECT * FROM organizaciones WHERE id = ?').bind(id).first<any>()
  if (!o) return c.json({ error: 'no encontrada' }, 404)
  const rango = `>= ? AND %s < date(?, '+1 day')`
  const [diag, tareas, alertas, vulns, quiz] = await Promise.all([
    db.prepare(`SELECT creado, puntaje, nivel FROM diagnosticos WHERE org_id = ? AND creado ${rango.replace('%s', 'creado')} ORDER BY creado`).bind(id, desde, hasta).all<any>(),
    db.prepare(`SELECT titulo, completada, a.nombre AS guardian FROM tareas t LEFT JOIN usuarios a ON a.id = t.asignado_a WHERE t.org_id = ? AND t.estado = 'hecha' AND t.completada ${rango.replace('%s', 't.completada')} ORDER BY t.completada`).bind(id, desde, hasta).all<any>(),
    db.prepare(`SELECT id, titulo, severidad, estado, creada, CASE WHEN contenida_en IS NULL THEN NULL ELSE ROUND((julianday(contenida_en) - julianday(creada)) * 1440) END AS minutos FROM alertas WHERE org_id = ? AND creada ${rango.replace('%s', 'creada')} ORDER BY creada`).bind(id, desde, hasta).all<any>(),
    db.prepare(`SELECT estado, COUNT(*) AS n FROM vulnerabilidades WHERE org_id = ? GROUP BY estado`).bind(id).all<any>(),
    db.prepare(`SELECT COUNT(DISTINCT usuario_id) AS personas, AVG(aciertos * 100.0 / total) AS promedio FROM quiz_resultados WHERE org_id = ? AND fecha ${rango.replace('%s', 'fecha')}`).bind(id, desde, hasta).first<any>(),
  ])
  const al = alertas.results
  const conMin = al.filter((a) => a.minutos != null)
  return c.json({
    org: o, desde, hasta,
    diagnosticos: diag.results,
    tareasHechas: tareas.results,
    alertas: al,
    resumenAlertas: {
      total: al.length,
      contenidas: conMin.length,
      criticas: al.filter((a) => a.severidad === 'critica').length,
      tiempoMedioMin: conMin.length ? Math.round(conMin.reduce((s, a) => s + a.minutos, 0) / conMin.length) : null,
    },
    vulnerabilidades: Object.fromEntries(vulns.results.map((v) => [v.estado, v.n])),
    mfaPct: o.cuentas_total ? Math.round((o.cuentas_mfa / o.cuentas_total) * 100) : null,
    capacitacion: { personas: quiz?.personas ?? 0, promedio: quiz?.promedio == null ? null : Math.round(quiz.promedio) },
  })
})
