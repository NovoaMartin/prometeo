import { Link } from 'react-router-dom'
import { CheckCircle2, Clock } from 'lucide-react'
import { Badge, Card, PageTitle } from '../components/ui'
import { minutosContencion, useStore } from '../state/store'
import { ALERTA_CRITICA, CHECKS, TIMELINE } from '../data/alertas'

function hora(min: number) {
  const total = 22 * 60 + 40 + min
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function AlertaDetalle() {
  const { s, d } = useStore()
  const min = minutosContencion(s)

  if (!s.alerta.activa && !s.alerta.contenida) {
    return <Card>No hay incidentes activos. Usá <strong>Simular ataque</strong> arriba para disparar la alerta de las 22:40. <Link className="text-brand underline" to="/panel">Volver al panel</Link></Card>
  }

  return (
    <div>
      <PageTitle title="Detalle del incidente" />
      <Card className="mb-4 border-red-300 bg-red-50">
        <div className="flex flex-wrap items-center gap-2"><Badge tone="red">Crítica</Badge><span className="font-bold text-red-900">{ALERTA_CRITICA.titulo}</span></div>
        <div className="mt-1 text-sm text-red-800">{ALERTA_CRITICA.municipio} · {ALERTA_CRITICA.hora} · origen {ALERTA_CRITICA.origen} · {ALERTA_CRITICA.usuario}</div>
        <p className="mt-2 text-sm text-red-900">Preguntale al Asistente IA: <em>“Explicame esta alerta”</em>.</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold text-ink">Línea de tiempo</h2>
          <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
            {TIMELINE.map((t) => (
              <li key={t.t} className="text-sm"><span className="font-mono font-semibold text-brand">{t.t}</span> {t.txt}</li>
            ))}
            {CHECKS.filter((c) => s.alerta.checks[c.id]).map((c) => (
              <li key={c.id} className="text-sm text-emerald-700">✓ {c.txt}</li>
            ))}
          </ol>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-ink">Checklist de contención</h2>
            <div className="flex items-center gap-1 font-mono text-lg font-bold text-ink"><Clock size={18} /> {hora(min)}</div>
          </div>
          <ul className="space-y-2">
            {CHECKS.map((c) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50">
                  <input type="checkbox" checked={!!s.alerta.checks[c.id]} onChange={() => d({ type: 'TOGGLE_CHECK', id: c.id })} className="h-4 w-4" />
                  <span className="flex-1 text-sm">{c.txt}</span>
                  <span className="text-xs text-slate-400">+{c.min} min</span>
                </label>
              </li>
            ))}
          </ul>
          {s.alerta.contenida && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-100 p-3 font-bold text-emerald-800">
              <CheckCircle2 /> Contenido en {min} min ✓
            </div>
          )}
          {s.alerta.contenida && <Link to="/red" className="mt-2 inline-block text-sm text-brand underline">Ver cómo la red comparte el indicador →</Link>}
        </Card>
      </div>
    </div>
  )
}
