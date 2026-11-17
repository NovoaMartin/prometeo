import { Hono } from 'hono'
import type { HonoEnv } from './types'
import { auth } from './routes/auth'
import { publico } from './routes/publico'
import { org } from './routes/org'
import { alertas } from './routes/alertas'
import { asistente } from './routes/asistente'

const app = new Hono<HonoEnv>()

app.get('/api/health', (c) => c.json({ ok: true, ia: !!c.env.DEEPSEEK_API_KEY }))
app.route('/api/auth', auth)
app.route('/api/diagnosticos/publico', publico) // POST autodiagnóstico gratuito, GET stats
app.route('/api/asistente', asistente)
app.route('/api', org)
app.route('/api', alertas)

app.all('/api/*', (c) => c.json({ error: 'no encontrado' }, 404))
app.onError((e, c) => {
  console.error(e)
  return c.json({ error: 'error interno' }, 500)
})

// Todo lo que no es /api lo sirve el front compilado (assets)
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
