import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { btnPrimary, btnSecondary, Card, ErrorMsg, PageTitle, Spinner } from '../../components/ui'
import { Cuestionario } from '../../components/Cuestionario'
import { ResultadoDiagnostico } from '../../components/ResultadoDiagnostico'
import { api, fecha, post } from '../../lib/api'
import { useAccion } from '../../lib/hooks'
import { PREGUNTAS, type Respuesta } from '@shared/preguntas'
import { puntajeBase } from '@shared/scoring'

export function Diagnostico() {
  const nav = useNavigate()
  const { data: hist, isLoading } = useQuery({ queryKey: ['diagnosticos'], queryFn: () => api<any[]>('/diagnosticos') })
  const { data: tareas } = useQuery({ queryKey: ['tareas'], queryFn: () => api<any[]>('/tareas') })
  const [r, setR] = useState<Record<string, Respuesta>>({})
  const [modo, setModo] = useState<'ver' | 'nuevo'>('ver')
  const [sel, setSel] = useState<number | null>(null)

  const ultimo = hist?.[0]
  // El nuevo diagnóstico parte del último, marcando como "sí" lo que ya se resolvió en el plan de mejora
  useEffect(() => {
    if (modo !== 'nuevo' || !hist || !tareas) return
    const base: Record<string, Respuesta> = ultimo ? { ...ultimo.respuestas } : {}
    for (const t of tareas) if (t.estado === 'hecha' && t.pregunta_id) base[t.pregunta_id] = 'si'
    setR(base)
  }, [modo, hist, tareas]) // eslint-disable-line react-hooks/exhaustive-deps

  const guardar = useAccion(() => post('/diagnosticos', { respuestas: r }), ['diagnosticos', 'panel'])
  const plan = useAccion((id: number) => post(`/diagnosticos/${id}/plan`), ['tareas', 'panel'])

  if (isLoading) return <Spinner />
  const mostrado = hist?.find((h) => h.id === sel) ?? ultimo
  const completo = PREGUNTAS.every((p) => r[p.id])

  if (modo === 'nuevo') {
    return (
      <div>
        <PageTitle title="Nuevo diagnóstico" sub="Revisá las respuestas: se precargaron con el último diagnóstico y las tareas que ya completaste." />
        <Cuestionario value={r} onChange={(id, v) => setR({ ...r, [id]: v })} />
        {guardar.error && <ErrorMsg error={guardar.error} />}
        <div className="mt-2 flex gap-2">
          <button className={btnPrimary} disabled={!completo || guardar.isPending} onClick={() => guardar.mutate(undefined, { onSuccess: () => { setSel(null); setModo('ver') } })}>Guardar diagnóstico</button>
          <button className={btnSecondary} onClick={() => setModo('ver')}>Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PageTitle title="Diagnóstico de madurez" sub="Historial de diagnósticos y plan de mejora." />
        <button className={btnPrimary} onClick={() => setModo('nuevo')}>Nuevo diagnóstico</button>
      </div>
      {!mostrado ? <Card>Todavía no hay diagnósticos. Creá el primero.</Card> : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {hist!.map((h) => (
              <button key={h.id} onClick={() => setSel(h.id)} className={`rounded-md border px-3 py-1.5 text-sm ${h.id === mostrado.id ? 'border-brand bg-blue-50 text-brand' : 'border-slate-300 hover:bg-slate-50'}`}>
                {fecha(h.creado)} · {h.puntaje}/100
              </button>
            ))}
          </div>
          <ResultadoDiagnostico respuestas={mostrado.respuestas} puntaje={puntajeBase(mostrado.respuestas)} />
          <Card className="mt-6">
            <p className="text-sm text-slate-600">Convertí las acciones prioritarias de este diagnóstico en tareas para que los Guardianes Digitales las resuelvan. Las acciones que ya tienen una tarea abierta no se duplican.</p>
            {plan.error && <ErrorMsg error={plan.error} />}
            <button className={btnPrimary + ' mt-3'} disabled={plan.isPending} onClick={() => plan.mutate(mostrado.id, { onSuccess: () => nav('/app/plan') })}>Generar plan de mejora</button>
          </Card>
        </>
      )}
    </div>
  )
}
