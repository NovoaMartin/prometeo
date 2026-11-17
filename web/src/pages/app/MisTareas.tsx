import { useQuery } from '@tanstack/react-query'
import { Badge, Card, ErrorMsg, inputCls, PageTitle, Spinner } from '../../components/ui'
import { api, fecha, patch } from '../../lib/api'
import { useAccion } from '../../lib/hooks'

const ESTADOS = [['pendiente', 'Pendiente'], ['en_curso', 'En curso'], ['hecha', 'Hecha']] as const

export function MisTareas() {
  const { data, isLoading, error } = useQuery({ queryKey: ['tareas'], queryFn: () => api<any[]>('/tareas') })
  const cambiar = useAccion(({ id, estado }: { id: number; estado: string }) => patch(`/tareas/${id}`, { estado }), ['tareas'])
  if (isLoading) return <Spinner />
  if (error) return <ErrorMsg error={error} />
  const hechas = data!.filter((t) => t.estado === 'hecha').length

  return (
    <div>
      <PageTitle title="Mis tareas" sub={`${hechas} de ${data!.length} completadas. Trabajás con supervisión de tu docente o tutor.`} />
      {cambiar.error && <ErrorMsg error={cambiar.error} />}
      <div className="space-y-2">
        {data!.map((t) => (
          <Card key={t.id} className="!p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className={`font-medium ${t.estado === 'hecha' ? 'text-slate-400 line-through' : ''}`}>{t.titulo}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500"><Badge tone="blue">{t.org_nombre}</Badge><span>{t.area}</span><span>Supervisor: {t.supervisor ?? '—'}</span>{t.completada && <span>Completada el {fecha(t.completada)}</span>}</div>
              </div>
              <select className={inputCls + ' !w-32'} value={t.estado} onChange={(e) => cambiar.mutate({ id: t.id, estado: e.target.value })}>{ESTADOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </div>
          </Card>
        ))}
        {!data!.length && <Card>No tenés tareas asignadas.</Card>}
      </div>
    </div>
  )
}
