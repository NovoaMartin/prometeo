import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../../auth/AuthContext'
import { Badge, Card, ErrorMsg, ESTADO_ALERTA, Kpi, PageTitle, SEV_LABEL, Spinner, sevTone, Upsell } from '../../components/ui'
import { api, fecha, fechaHora } from '../../lib/api'

export function Panel() {
  const { org } = useAuth()
  const { data: d, isLoading, error } = useQuery({ queryKey: ['panel'], queryFn: () => api<any>('/panel') })
  if (isLoading) return <Spinner />
  if (error) return <ErrorMsg error={error} />
  const monitoreada = org?.plan === 'escudo'
  const primero = d.evolucion[0]?.puntaje, actual = d.madurez?.puntaje
  const abiertas = Object.values<number>(d.alertasAbiertas).reduce((a, b) => a + b, 0)
  const t = d.tareas, totalT = (t.hecha ?? 0) + (t.en_curso ?? 0) + (t.pendiente ?? 0)
  const vulns = Object.values<number>(d.vulnsAbiertas).reduce((a, b) => a + b, 0)

  return (
    <div>
      <PageTitle title={`Panel · ${d.org.nombre}`} sub={monitoreada ? 'Estado de seguridad y monitoreo del SOC compartido.' : 'Estado de seguridad de tu organización.'} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Madurez" value={actual == null ? '—' : `${actual}/100`} tone={actual == null ? 'slate' : actual < 40 ? 'red' : actual < 70 ? 'amber' : 'green'}
          sub={actual == null ? 'Aún sin diagnóstico' : primero !== actual ? `${actual > primero ? '▲ +' : '▼ '}${actual - primero} desde el primer diagnóstico · ${d.madurez.nivel}` : d.madurez.nivel} />
        <Kpi label="Cuentas con MFA" value={d.mfaPct == null ? '—' : `${d.mfaPct}%`} sub={`${d.org.cuentas_mfa} de ${d.org.cuentas_total} cuentas`} tone={d.mfaPct == null ? 'slate' : d.mfaPct >= 80 ? 'green' : 'amber'} />
        <Kpi label="Plan de mejora" value={totalT ? `${t.hecha ?? 0}/${totalT}` : '—'} sub="tareas completadas" />
        <Kpi label="Capacitación" value={d.capacitacion.promedio == null ? '—' : `${d.capacitacion.promedio}%`} sub={`${d.capacitacion.personas} persona(s) evaluada(s)`} />
        {monitoreada && <>
          <Kpi label="Alertas abiertas" value={abiertas} tone={d.alertasAbiertas.critica ? 'red' : abiertas ? 'amber' : 'green'} sub={d.alertasAbiertas.critica ? `${d.alertasAbiertas.critica} crítica(s)` : 'sin críticas'} />
          <Kpi label="Tiempo medio de contención" value={d.tiempoMedioMin == null ? '—' : `${d.tiempoMedioMin} min`} sub="Meta: menos de 30 min" tone={d.tiempoMedioMin == null ? 'slate' : d.tiempoMedioMin <= 30 ? 'green' : 'amber'} />
          <Kpi label="Vulnerabilidades abiertas" value={vulns} tone={d.vulnsAbiertas.critica ? 'red' : vulns ? 'amber' : 'green'} />
        </>}
        <Kpi label="Última prueba de restauración" value={d.ultimaRestauracion ? fecha(d.ultimaRestauracion) : 'Nunca'} tone={d.ultimaRestauracion ? 'green' : 'red'} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-bold text-ink">Evolución de la madurez</h2>
          {d.evolucion.length ? (
            <div className="h-48">
              <ResponsiveContainer>
                <LineChart data={d.evolucion.map((e: any) => ({ f: fecha(e.creado), p: e.puntaje }))}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="f" fontSize={11} /><YAxis domain={[0, 100]} /><Tooltip />
                  <Line dataKey="p" name="Puntaje" stroke="#1d4ed8" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-slate-500">Todavía no hay diagnósticos. <Link className="text-brand underline" to="/app/diagnostico">Hacer el primero</Link></p>}
        </Card>
        {monitoreada ? (
          <Card>
            <div className="mb-2 flex items-center justify-between"><h2 className="font-bold text-ink">Alertas recientes</h2><Link className="text-sm text-brand" to="/app/alertas">Ver todas</Link></div>
            <ul className="divide-y divide-slate-100">
              {d.alertasRecientes.map((a: any) => (
                <li key={a.id} className="flex items-center gap-2 py-2 text-sm">
                  <Badge tone={sevTone(a.severidad)}>{SEV_LABEL[a.severidad]}</Badge>
                  <Link to={`/app/alertas/${a.id}`} className="flex-1 hover:underline">{a.titulo}</Link>
                  <Badge tone={ESTADO_ALERTA[a.estado].tone}>{ESTADO_ALERTA[a.estado].label}</Badge>
                  <span className="hidden text-xs text-slate-400 sm:inline">{fechaHora(a.creada)}</span>
                </li>
              ))}
              {!d.alertasRecientes.length && <li className="py-2 text-sm text-slate-500">Sin alertas registradas.</li>}
            </ul>
          </Card>
        ) : <Upsell />}
      </div>
    </div>
  )
}
