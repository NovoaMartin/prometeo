import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { HonoEnv, Rol, Usuario } from './types'

const ITER = 100_000 // máximo que permite WebCrypto en Workers
const enc = new TextEncoder()
const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')

export async function hashPass(pass: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: ITER }, key, 256)
  return hex(bits)
}

export const nuevoSalt = () => hex(crypto.getRandomValues(new Uint8Array(16)))

export function igual(a: string, b: string) {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

const DIAS = 7

export async function crearSesion(c: Context<HonoEnv>, usuarioId: number) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)))
  await c.env.DB.prepare(`INSERT INTO sesiones (id, usuario_id, expira) VALUES (?, ?, datetime('now', '+${DIAS} days'))`).bind(token, usuarioId).run()
  setCookie(c, 'sid', token, {
    httpOnly: true, sameSite: 'Lax', path: '/', maxAge: DIAS * 86400,
    secure: new URL(c.req.url).protocol === 'https:',
  })
}

export async function cerrarSesion(c: Context<HonoEnv>) {
  const token = getCookie(c, 'sid')
  if (token) await c.env.DB.prepare('DELETE FROM sesiones WHERE id = ?').bind(token).run()
  deleteCookie(c, 'sid', { path: '/' })
}

export async function usuarioDeSesion(c: Context<HonoEnv>): Promise<Usuario | null> {
  const token = getCookie(c, 'sid')
  if (!token) return null
  return c.env.DB.prepare(
    `SELECT u.id, u.org_id, u.email, u.nombre, u.rol FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.id = ? AND s.expira > datetime('now')`,
  ).bind(token).first<Usuario>()
}

export const autenticar: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const u = await usuarioDeSesion(c)
  if (!u) return c.json({ error: 'no autenticado' }, 401)
  c.set('user', u)
  await next()
}

export const requiereRol = (...roles: Rol[]): MiddlewareHandler<HonoEnv> => async (c, next) => {
  if (!roles.includes(c.get('user').rol)) return c.json({ error: 'sin permiso' }, 403)
  await next()
}

// Organización sobre la que opera la solicitud: la propia, o (analista) la indicada en ?org=
export function orgDe(c: Context<HonoEnv>): number | null {
  const u = c.get('user')
  if (u.org_id) return u.org_id
  const q = Number(c.req.query('org'))
  return Number.isInteger(q) && q > 0 ? q : null
}

// Intentos de login por IP+email (best-effort en memoria)
const intentos = new Map<string, { n: number; t: number }>()
export function loginBloqueado(clave: string) {
  const now = Date.now()
  const h = intentos.get(clave)
  if (!h || now - h.t > 60_000) { intentos.set(clave, { n: 1, t: now }); return false }
  return ++h.n > 10
}
