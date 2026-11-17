import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { btnPrimary, Card, ErrorMsg, PageTitle, Spinner } from '../../components/ui'
import { api, fecha, post } from '../../lib/api'
import { useAccion } from '../../lib/hooks'
import { QUIZ } from '../../data/quiz'

export function Capacitacion() {
  const { data, isLoading } = useQuery({ queryKey: ['quiz'], queryFn: () => api<any[]>('/quiz') })
  const [resp, setResp] = useState<Record<number, number>>({})
  const listo = QUIZ.every((_, i) => resp[i] !== undefined)
  const aciertos = QUIZ.filter((q, i) => resp[i] === q.ok).length
  const guardar = useAccion(() => post('/quiz', { aciertos, total: QUIZ.length }), ['quiz', 'panel'])

  return (
    <div>
      <PageTitle title="Capacitación del personal" sub="Mini quiz de phishing y buenas prácticas. Los resultados quedan registrados para el reporte de cumplimiento." />
      <Card>
        {QUIZ.map((q, i) => (
          <div key={i} className="mb-4">
            <div className="mb-1 text-sm font-medium">{i + 1}. {q.q}</div>
            <div className="flex flex-wrap gap-2">
              {q.op.map((o, j) => {
                const color = resp[i] === undefined ? 'border-slate-300 hover:bg-slate-50' : j === q.ok ? 'border-emerald-500 bg-emerald-50' : resp[i] === j ? 'border-red-400 bg-red-50' : 'border-slate-200 opacity-60'
                return <button key={j} disabled={resp[i] !== undefined || guardar.isSuccess} onClick={() => setResp({ ...resp, [i]: j })} className={`rounded-md border px-3 py-1 text-sm ${color}`}>{o}</button>
              })}
            </div>
          </div>
        ))}
        {guardar.error && <ErrorMsg error={guardar.error} />}
        {listo && !guardar.isSuccess && <button className={btnPrimary} disabled={guardar.isPending} onClick={() => guardar.mutate()}>Registrar resultado ({aciertos}/{QUIZ.length})</button>}
        {guardar.isSuccess && <div className="flex items-center gap-3"><span className="font-semibold text-emerald-700">Resultado registrado ✓ ({aciertos}/{QUIZ.length})</span><button className="text-sm text-brand underline" onClick={() => { setResp({}); guardar.reset() }}>Hacer de nuevo</button></div>}
      </Card>

      <h2 className="mb-2 mt-6 text-xl font-bold text-ink">Historial</h2>
      {isLoading ? <Spinner /> : (
        <Card>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Persona</th><th>Resultado</th><th>Fecha</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data!.map((r) => <tr key={r.id}><td className="py-2">{r.nombre}</td><td>{r.aciertos}/{r.total}</td><td>{fecha(r.fecha)}</td></tr>)}
              {!data!.length && <tr><td colSpan={3} className="py-3 text-slate-500">Todavía no hay resultados.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
