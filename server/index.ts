import express from 'express'
import { guardarDiagnostico, stats } from './db.ts'
import { responderIA, type Msg, type Rol } from './asistente.ts'

const app = express()
app.use(express.json({ limit: '100kb' }))

// CORS (el front estático puede estar en otro dominio)
const ORIGEN = process.env.CORS_ORIGIN ?? '*'
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ORIGEN)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// Rate limit simple en memoria: 30 req/min por IP en el asistente (protege el gasto de la API)
const hits = new Map<string, { n: number; t: number }>()
function limitar(req: express.Request, res: express.Response, next: express.NextFunction) {
  const k = req.ip ?? 'x'
  const now = Date.now()
  const h = hits.get(k)
  if (!h || now - h.t > 60_000) hits.set(k, { n: 1, t: now })
  else if (++h.n > 30) return res.status(429).json({ error: 'demasiadas solicitudes' })
  next()
}

const ROLES = ['referente', 'intendente', 'analista', 'ong']

app.get('/api/health', (_req, res) => res.json({ ok: true, ia: !!process.env.DEEPSEEK_API_KEY }))

app.get('/api/diagnosticos/stats', (_req, res) => res.json(stats()))

app.post('/api/diagnosticos', (req, res) => {
  const b = req.body ?? {}
  if (typeof b.municipio !== 'string' || !Number.isFinite(b.poblacion) || !Number.isFinite(b.puntaje) || typeof b.nivel !== 'string') {
    return res.status(400).json({ error: 'datos inválidos' })
  }
  guardarDiagnostico({ municipio: b.municipio, poblacion: b.poblacion, tipo: String(b.tipo ?? 'municipio'), puntaje: b.puntaje, nivel: b.nivel, respuestas: b.respuestas ?? {} })
  res.json({ ok: true })
})

app.post('/api/asistente', limitar, async (req, res) => {
  const { rol, pantalla, alertaId, mensajes } = req.body ?? {}
  const msgsOk = Array.isArray(mensajes) && mensajes.length > 0 && mensajes.every((m: Msg) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length < 2000)
  if (!ROLES.includes(rol) || !msgsOk || mensajes[mensajes.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'solicitud inválida' })
  }
  const texto = await responderIA(rol as Rol, String(pantalla ?? ''), alertaId ? String(alertaId) : undefined, mensajes)
  res.json({ texto, fuente: texto ? 'ia' : 'guion' })
})

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, () => console.log(`API Prometeo en http://localhost:${PORT} · IA ${process.env.DEEPSEEK_API_KEY ? 'activa' : 'desactivada (guion)'}`))
