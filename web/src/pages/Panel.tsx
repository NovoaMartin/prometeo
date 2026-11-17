import { Link } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { ShieldCheck } from 'lucide-react'
import { Badge, Card, Kpi, PageTitle, sevTone } from '../components/ui'
import { mfaActual, minutosContencion, puntajeActual, useStore } from '../state/store'
import { puntajeBase } from '../lib/scoring'
import { ALERTAS_MENORES, ALERTA_CRITICA, VULNERABILIDADES } from '../data/alertas'
import { PRESET_VILLA_EJEMPLO } from '../data/preguntas'

export function Panel() {
  const { s } = useStore()
  const hayResp = Object.keys(s.respuestas).length > 0
  const inicial = hayResp ? puntajeBase(s.respuestas) : puntajeBase(PRESET_VILLA_EJEMPLO)
  const actual = hayResp ? puntajeActual(s) : inicial
  const alertas = s.alerta.activa && !s.alerta.contenida ? [ALERTA_CRITICA, ...ALERTAS_MENORES] : ALERTAS_MENORES
  const abiertas = alertas.length
  const tiempo = s.alerta.contenida ? `${minutosContencion(s)} min` : '—'
  const evol = [{ m: 'Inicio', p: inicial }, { m: 'Mes 1', p: Math.round((inicial + actual) / 2) }, { m: 'Hoy', p: actual }]
  const mfa = mfaActual(s)

  return (
    <div>
      <PageTitle title={`Panel · ${s.municipio.nombre}`} pain="“No puede monitorear amenazas las 24 hs”: el panel muestra el estado en tiempo real y las alertas abiertas." />
      <Card className="mb-4 flex items-center gap-3 border-emerald-300 bg-emerald-50">
        <ShieldCheck className="text-emerald-600" size={28} />
        <div>
          <div className="font-bold text-emerald-800">{s.alerta.activa && !s.alerta.contenida ? 'Incidente en curso' : 'Protegido 24/7'}</div>
          <div className="text-sm text-emerald-700">Monitoreo del SOC compartido activo</div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Madurez" value={`${actual}/100`} sub={actual > inicial ? `▲ +${actual - inicial} desde el diagnóstico` : 'Resultado del autodiagnóstico'} tone={actual < 40 ? 'red' : actual < 70 ? 'amber' : 'green'} />
        <Kpi label="Cuentas con MFA" value={`${mfa}%`} sub="48 cuentas del personal" tone={mfa > 80 ? 'green' : 'amber'} />
        <Kpi label="Alertas abiertas" value={abiertas} sub={s.alerta.activa && !s.alerta.contenida ? '1 crítica' : 'ninguna crítica'} tone={s.alerta.activa && !s.alerta.contenida ? 'red' : 'slate'} />
        <Kpi label="Tiempo de contención" value={tiempo} sub="Meta: menos de 30 min" tone={s.alerta.contenida ? 'green' : 'slate'} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-bold text-ink">Evolución de la madurez</h2>
          <div className="h-44">
            <ResponsiveContainer>
              <LineChart data={evol}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="m" /><YAxis domain={[0, 100]} />
                <Line dataKey="p" stroke="#1d4ed8" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-sm text-slate-600">Última prueba de restauración: <strong>{s.tareas['t4'] ? 'hoy · exitosa ✓' : 'nunca'}</strong></p>
        </Card>

        <Card>
          <h2 className="mb-2 font-bold text-ink">Alertas</h2>
          <ul className="divide-y divide-slate-100">
            {alertas.map((a) => (
              <li key={a.id} className="flex items-center gap-2 py-2 text-sm">
                <Badge tone={sevTone(a.severidad)}>{a.severidad}</Badge>
                <Link to={a.id === 'a-001' ? '/alertas/a-001' : '#'} className="flex-1 hover:underline">{a.titulo}</Link>
                <span className="text-slate-400">{a.hora}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="mb-2 font-bold text-ink">Vulnerabilidades detectadas</h2>
        <ul className="divide-y divide-slate-100">
          {VULNERABILIDADES.map((v) => (
            <li key={v.id} className="flex items-center gap-2 py-2 text-sm"><Badge tone={sevTone(v.sev)}>{v.sev}</Badge>{v.nombre}</li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
