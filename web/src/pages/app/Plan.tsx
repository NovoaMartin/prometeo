import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Badge, Card, ErrorMsg, inputCls, PageTitle, Spinner } from '../../components/ui'
import { api, fecha, patch } from '../../lib/api'
import { useAccion } from '../../lib/hooks'
import { esfuerzoLabel, impactoLabel } from '@shared/scoring'

const ESTADOS = [['pendiente', 'Pendiente'], ['en_curso', 'En curso'], ['hecha', 'Hecha']] as const

export function Plan() {
  const { user } = useAuth()
  const edita = user?.rol === 'referente'
  const { data: tareas, isLoading, error } = useQuery({ queryKey: ['tareas'], queryFn: () => api<any[]>('/tareas') })
  const { data: guardianes } = useQuery({ queryKey: ['guardianes'], queryFn: () => api<any[]>('/guardianes'), enabled: edita })
  const cambiar = useAccion(({ id, ...b }: { id: number; [k: string]: unknown }) => patch(`/tareas/${id}`, b), ['tareas', 'panel'])

  if (isLoading) return <Spinner />
  if (error) return <ErrorMsg error={error} />
  const hechas = tareas!.filter((t) => t.estado === 'hecha').length

  return (
    <div>
      <PageTitle title="Plan de mejora" sub={`${hechas} de ${tareas!.length} tareas completadas. Cada tarea la resuelve un Guardián Digital con su supervisor.`} />
      {cambiar.error && <ErrorMsg error={cambiar.error} />}
      {!tareas!.length && <Card>No hay tareas todavía. {edita && <>Generá el plan desde un <Link className="text-brand underline" to="/app/diagnostico">diagnóstico</Link>.</>}</Card>}
      <div className="space-y-2">
        {tareas!.map((t) => (
          <Card key={t.id} className="!p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className={`font-medium ${t.estado === 'hecha' ? 'text-slate-400 line-through' : ''}`}>{t.titulo}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>{t.area}</span><Badge tone="green">Impacto {impactoLabel(t.impacto)}</Badge><Badge tone="slate">Esfuerzo {esfuerzoLabel(t.esfuerzo)}</Badge>
                  {t.completada && <span>Completada el {fecha(t.completada)}</span>}
                </div>
              </div>
              {edita ? (
                <div className="flex flex-wrap gap-2">
                  <select className={inputCls + ' !w-36'} value={t.asignado_a ?? ''} onChange={(e) => cambiar.mutate({ id: t.id, asignado_a: e.target.value ? Number(e.target.value) : null, supervisor: t.supervisor ?? 'Ing. R. Paz' })}>
                    <option value="">Sin guardián</option>{guardianes?.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                  </select>
                  <select className={inputCls + ' !w-32'} value={t.estado} onChange={(e) => cambiar.mutate({ id: t.id, estado: e.target.value })}>
                    {ESTADOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ) : <Badge tone={t.estado === 'hecha' ? 'green' : t.estado === 'en_curso' ? 'amber' : 'slate'}>{ESTADOS.find((e) => e[0] === t.estado)![1]}</Badge>}
            </div>
            {(t.asignado_nombre || t.supervisor) && <div className="mt-2 text-xs text-slate-500">Guardián: {t.asignado_nombre ?? '—'} · Supervisor: {t.supervisor ?? '—'}</div>}
          </Card>
        ))}
      </div>
    </div>
  )
}
