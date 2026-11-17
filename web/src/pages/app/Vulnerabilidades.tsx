import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth/AuthContext'
import { Badge, Card, ErrorMsg, PageTitle, SEV_LABEL, Spinner, sevTone, Upsell } from '../../components/ui'
import { api, fecha, patch } from '../../lib/api'
import { useAccion } from '../../lib/hooks'

export function Vulnerabilidades() {
  const { org } = useAuth()
  const { data, isLoading, error } = useQuery({ queryKey: ['vulns'], queryFn: () => api<any[]>('/vulnerabilidades'), enabled: org?.plan === 'escudo' })
  const cambiar = useAccion(({ id, estado }: { id: number; estado: string }) => patch(`/vulnerabilidades/${id}`, { estado }), ['vulns', 'panel'])
  if (org?.plan !== 'escudo') return <><PageTitle title="Vulnerabilidades" /><Upsell titulo="Gestión de vulnerabilidades">El análisis de vulnerabilidades forma parte del plan Escudo Municipal.</Upsell></>
  if (isLoading) return <Spinner />
  if (error) return <ErrorMsg error={error} />

  return (
    <div>
      <PageTitle title="Vulnerabilidades" sub="Hallazgos de los análisis periódicos sobre tus activos." />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Severidad</th><th>Hallazgo</th><th>Activo</th><th>Detectada</th><th>Estado</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {data!.map((v) => (
              <tr key={v.id}>
                <td className="py-2"><Badge tone={sevTone(v.severidad)}>{SEV_LABEL[v.severidad]}</Badge></td>
                <td className={v.estado === 'mitigada' ? 'text-slate-400 line-through' : ''}>{v.nombre}</td><td className="text-slate-500">{v.activo}</td><td>{fecha(v.detectada)}</td>
                <td><button onClick={() => cambiar.mutate({ id: v.id, estado: v.estado === 'abierta' ? 'mitigada' : 'abierta' })} className={`rounded-md border px-2 py-1 text-xs ${v.estado === 'abierta' ? 'border-slate-300 hover:bg-slate-50' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}>{v.estado === 'abierta' ? 'Marcar mitigada' : `Mitigada ${fecha(v.mitigada)}`}</button></td>
              </tr>
            ))}
            {!data!.length && <tr><td colSpan={5} className="py-4 text-slate-500">Sin hallazgos.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
