import { Hono } from 'hono'
import type { HonoEnv } from '../types'
import { autenticar, cerrarSesion, crearSesion, hashPass, igual, loginBloqueado, nuevoSalt, usuarioDeSesion } from '../auth'
import { nivel, puntajeBase, respuestasValidas } from '../../shared/scoring'

export const auth = new Hono<HonoEnv>()

const email = (s: unknown) => (typeof s === 'string' ? s.trim().toLowerCase() : '')
const emailOk = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) && s.length <= 120

async function contexto(c: any, userId: number) {
  const user = await c.env.DB.prepare('SELECT id, org_id, email, nombre, rol FROM usuarios WHERE id = ?').bind(userId).first()
  const org = user?.org_id ? await c.env.DB.prepare('SELECT * FROM organizaciones WHERE id = ?').bind(user.org_id).first() : null
  return { usuario: user, org }
}

auth.get('/me', async (c) => {
  const u = await usuarioDeSesion(c)
  if (!u) return c.json({ error: 'no autenticado' }, 401)
  return c.json(await contexto(c, u.id))
})

// Cuentas de prueba para la pantalla de login
auth.get('/demo', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT u.email, u.nombre, u.rol, o.nombre AS org FROM usuarios u LEFT JOIN organizaciones o ON o.id = u.org_id WHERE u.es_demo = 1 ORDER BY u.id`,
  ).all()
  return c.json(results)
})

auth.post('/login', async (c) => {
  const b: any = await c.req.json().catch(() => null)
  const em = email(b?.email)
  if (!em || typeof b?.password !== 'string') return c.json({ error: 'datos inválidos' }, 400)
  if (loginBloqueado(`${c.req.header('CF-Connecting-IP') ?? 'x'}|${em}`)) return c.json({ error: 'demasiados intentos, esperá un minuto' }, 429)
  const u = await c.env.DB.prepare('SELECT id, pass_hash, salt FROM usuarios WHERE email = ?').bind(em).first<{ id: number; pass_hash: string; salt: string }>()
  // Se calcula el hash aunque el usuario no exista para no filtrar su existencia por tiempo
  const h = await hashPass(b.password, u?.salt ?? 'sin-usuario')
  if (!u || !igual(h, u.pass_hash)) return c.json({ error: 'email o contraseña incorrectos' }, 401)
  await crearSesion(c, u.id)
  return c.json(await contexto(c, u.id))
})

auth.post('/logout', async (c) => { await cerrarSesion(c); return c.json({ ok: true }) })

// Alta de organización + usuario referente (opcionalmente con el autodiagnóstico ya hecho)
auth.post('/registro', async (c) => {
  const b: any = await c.req.json().catch(() => null)
  const em = email(b?.email)
  const orgNombre = typeof b?.orgNombre === 'string' ? b.orgNombre.trim().slice(0, 80) : ''
  const nombre = typeof b?.nombre === 'string' ? b.nombre.trim().slice(0, 80) : ''
  const tipo = b?.tipo === 'ong' ? 'ong' : 'municipio'
  const poblacion = Math.max(0, Math.min(10_000_000, Number(b?.poblacion) || 0))
  if (!orgNombre || !nombre || !emailOk(em) || typeof b?.password !== 'string' || b.password.length < 8) {
    return c.json({ error: 'completá todos los campos (contraseña de al menos 8 caracteres)' }, 400)
  }
  if (await c.env.DB.prepare('SELECT 1 FROM usuarios WHERE email = ?').bind(em).first()) return c.json({ error: 'ese email ya está registrado' }, 409)

  const plan = tipo === 'ong' ? 'guardianes' : 'free'
  const org = await c.env.DB.prepare('INSERT INTO organizaciones (nombre, tipo, poblacion, plan) VALUES (?, ?, ?, ?) RETURNING id').bind(orgNombre, tipo, poblacion, plan).first<{ id: number }>()
  const salt = nuevoSalt()
  const user = await c.env.DB.prepare('INSERT INTO usuarios (org_id, email, nombre, rol, pass_hash, salt) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(org!.id, em, nombre, 'referente', await hashPass(b.password, salt), salt).first<{ id: number }>()

  if (respuestasValidas(b?.respuestas)) {
    const p = puntajeBase(b.respuestas)
    await c.env.DB.prepare('INSERT INTO diagnosticos (municipio, poblacion, tipo, puntaje, nivel, respuestas, org_id, email_contacto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(orgNombre, poblacion, tipo, p, nivel(p), JSON.stringify(b.respuestas), org!.id, em).run()
  }
  await crearSesion(c, user!.id)
  return c.json(await contexto(c, user!.id), 201)
})

export { autenticar }
