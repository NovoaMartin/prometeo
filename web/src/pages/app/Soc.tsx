import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Dices } from 'lucide-react'
import { Badge, btnPrimary, Card, ErrorMsg, ESTADO_ALERTA, inputCls, Kpi, PageTitle, SEV_LABEL, Spinner, sevTone } from '../../components/ui'
import { api, fechaHora, post } from '../../lib/api'
import { useAccion } from '../../lib/hooks'

export function Soc() {
  const [orgF, setOrgF] = useState('')
  const [n, setN] = useState(3)
  const { data: r } = useQuery({ queryKey: ['soc'], queryFn: () => api<any>('/soc/resumen') })
  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: () => api<any[]>('/orgs') })
  const qs = `estado=abiertas${orgF ? `&org=${orgF}` : ''}`
  const { data: cola, isLoading, error } = useQuery({ queryKey: ['alertas', qs], queryFn: () => api<any[]>('/alertas?' + qs) })
  const generar = useAccion(() => post('/demo/generar', { cantidad: n, org_id: orgF ? Number(orgF) : undefined }), ['alertas', 'soc', 'orgs'])

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PageTitle title="Consola SOC" sub="Cola de alertas abiertas de todas las organizaciones. Los datos personales llegan seudonimizados." />
        <div className="flex items-center gap-2 text-sm">
          <select className={inputCls + ' !w-20'} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Cantidad">{[1, 3, 5, 10].map((x) => <option key={x}>{x}</option>)}</select>
          <button className={btnPrimary + ' flex items-center gap-1'} disabled={generar.isPending} onClick={() => generar.mutate()}><Dices size={14} /> Generar eventos de prueba</button>
        </div>
      </div>
      {generar.error && <ErrorMsg error={generar.error} />}

      {r && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Alertas abiertas" value={r.abiertas} tone={r.abiertas ? 'amber' : 'green'} />
          <Kpi label="Críticas abiertas" value={r.criticas} tone={r.criticas ? 'red' : 'green'} />
          <Kpi label="Sin tomar" value={r.nuevas} sub="estado: nueva" />
          <Kpi label="Contención media" value={r.tiempoMedioMin == null ? '—' : `${r.tiempoMedioMin} min`} sub={`${r.orgsMonitoreadas} organizaciones monitoreadas`} tone={r.tiempoMedioMin != null && r.tiempoMedioMin <= 30 ? 'green' : 'amber'} />
        </div>
      )}

      <div className="mb-3 flex items-center gap-2">
        <select className={inputCls + ' !w-56'} value={orgF} onChange={(e) => setOrgF(e.target.value)}>
          <option value="">Todas las organizaciones</option>{orgs?.filter((o) => o.plan === 'escudo').map((o) => <option key={o.id} value={o.id}>{o.nombre} ({o.abiertas})</option>)}
        </select>
        <Link to="/app/alertas" className="text-sm text-brand underline">Ver todas / registrar alerta</Link>
      </div>

      {isLoading ? <Spinner /> : error ? <ErrorMsg error={error} /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Sev.</th><th>Alerta</th><th>Organización</th><th>Usuario</th><th>Origen</th><th>Estado</th><th>Asignada</th><th>Creada</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {cola!.map((a) => (
                <tr key={a.id}>
                  <td className="py-2"><Badge tone={sevTone(a.severidad)}>{SEV_LABEL[a.severidad]}</Badge></td>
                  <td><Link to={`/app/alertas/${a.id}`} className="text-brand hover:underline">{a.titulo}</Link></td>
                  <td>{a.org_nombre}</td><td className="font-mono text-xs">{a.usuario_seudonimo ?? '—'}</td><td className="font-mono text-xs">{a.ip_origen ?? '—'}</td>
                  <td><Badge tone={ESTADO_ALERTA[a.estado].tone}>{ESTADO_ALERTA[a.estado].label}</Badge></td><td>{a.asignada_nombre ?? '—'}</td><td className="whitespace-nowrap">{fechaHora(a.creada)}</td>
                </tr>
              ))}
              {!cola!.length && <tr><td colSpan={8} className="py-4 text-slate-500">No hay alertas abiertas. Podés generar eventos de prueba.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
