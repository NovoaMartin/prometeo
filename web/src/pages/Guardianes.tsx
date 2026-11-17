import { useState } from 'react'
import { Badge, Card, PageTitle } from '../components/ui'
import { mfaActual, puntajeActual, useStore } from '../state/store'
import { TAREAS, QUIZ } from '../data/tareas'

export function Guardianes() {
  const { s, d } = useStore()
  const [resp, setResp] = useState<Record<number, number>>({})
  const hechas = TAREAS.filter((t) => s.tareas[t.id]).length
  const quizListo = QUIZ.every((_, i) => resp[i] !== undefined)
  const aciertos = QUIZ.filter((q, i) => resp[i] === q.ok).length

  return (
    <div>
      <PageTitle title="Guardianes Digitales" sub="Estudiantes supervisados convierten el plan de mejora en tareas concretas." pain="“Los usuarios cometen errores” y “pocos recursos humanos”: capacitación y acompañamiento sin costo de estudiantes con supervisor." />
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <Badge tone="blue">{hechas}/{TAREAS.length} tareas</Badge>
        <span>Madurez: <strong>{puntajeActual(s)}/100</strong></span>
        <span>MFA: <strong>{mfaActual(s)}%</strong></span>
      </div>

      <Card className="mb-4 border-amber-300 bg-amber-50 text-sm">
        <strong>Inventario de datos sensibles:</strong> “Excel de beneficiarios · Desarrollo Social · 4.000 personas · incluye diagnósticos médicos” ·{' '}
        {s.tareas['t2'] ? <span className="font-semibold text-emerald-700">acceso restringido ✓</span> : <span className="font-semibold text-red-700">acceso: TODO EL PERSONAL ⚠</span>}
      </Card>

      <div className="space-y-2">
        {TAREAS.map((t) => (
          <Card key={t.id} className="!p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={!!s.tareas[t.id]} onChange={() => d({ type: 'TOGGLE_TAREA', id: t.id })} className="h-4 w-4" />
              <div className="flex-1">
                <div className={`font-medium ${s.tareas[t.id] ? 'text-slate-400 line-through' : ''}`}>{t.titulo}</div>
                <div className="text-xs text-slate-500">Estudiante: {t.estudiante} · Supervisor: {t.supervisor}</div>
              </div>
              <Badge tone="green">+{t.puntos} pts</Badge>
            </label>
          </Card>
        ))}
      </div>

      <h2 className="mb-2 mt-8 text-xl font-bold text-ink">Mini quiz de phishing para el personal</h2>
      <Card>
        {QUIZ.map((q, i) => (
          <div key={i} className="mb-4">
            <div className="mb-1 text-sm font-medium">{i + 1}. {q.q}</div>
            <div className="flex flex-wrap gap-2">
              {q.op.map((o, j) => {
                const sel = resp[i] === j
                const color = resp[i] === undefined ? 'border-slate-300' : j === q.ok ? 'border-emerald-500 bg-emerald-50' : sel ? 'border-red-400 bg-red-50' : 'border-slate-200 opacity-60'
                return <button key={j} disabled={resp[i] !== undefined} onClick={() => setResp({ ...resp, [i]: j })} className={`rounded-md border px-3 py-1 text-sm ${color}`}>{o}</button>
              })}
            </div>
          </div>
        ))}
        {quizListo && (
          <button onClick={() => d({ type: 'QUIZ_OK' })} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">
            {aciertos}/{QUIZ.length} correctas — {s.quizOk ? 'registrado ✓' : 'registrar resultado'}
          </button>
        )}
      </Card>
    </div>
  )
}
