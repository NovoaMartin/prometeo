import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth/AuthContext'
import { Badge, Card, ErrorMsg, PageTitle, Spinner, Upsell } from '../../components/ui'
import { api, fecha, post } from '../../lib/api'
import { useAccion } from '../../lib/hooks'

export function Red() {
  const { user, org } = useAuth()
  const analista = user?.rol === 'analista'
  const habilitado = analista || org?.plan === 'escudo'
  const { data, isLoading, error } = useQuery({ queryKey: ['red'], queryFn: () => api<any>('/red'), enabled: habilitado })
  const bloquear = useAccion((id: number) => post(`/red/indicadores/${id}/bloquear`), ['red'])
  const [selId, setSel] = useState<number | null>(null)

  if (!habilitado) return <><PageTitle title="Red de amenazas" /><Upsell titulo="Red de amenazas compartidas">Los indicadores de amenazas compartidos entre municipios forman parte del plan Escudo Municipal.</Upsell></>
  if (isLoading) return <Spinner />
  if (error) return <ErrorMsg error={error} />
  const inds: any[] = data.indicadores, orgs: any[] = data.organizaciones
  const sel = inds.find((i) => i.id === selId) ?? inds[0]
  const pos = (i: number) => { const a = (i / orgs.length) * 2 * Math.PI - Math.PI / 2; return { x: 50 + 36 * Math.cos(a), y: 45 + 34 * Math.sin(a) } }

  return (
    <div>
      <PageTitle title="Red de amenazas compartidas" sub="Cada municipio que se suma protege a los demás: un indicador detectado en uno se puede bloquear en todos." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <svg viewBox="0 0 100 90" className="w-full">
            {orgs.map((o, i) => { const p = pos(i); return <line key={'l' + o.id} x1="50" y1="45" x2={p.x} y2={p.y} stroke={sel?.bloqueada_por.includes(o.id) ? '#0d9488' : '#e2e8f0'} strokeWidth="0.6" /> })}
            <circle cx="50" cy="45" r="6" fill="#0f2540" /><text x="50" y="46" textAnchor="middle" fontSize="2.6" fill="white">SOC</text>
            {orgs.map((o, i) => { const p = pos(i); const b = sel?.bloqueada_por.includes(o.id); return (
              <g key={o.id}><circle cx={p.x} cy={p.y} r="4.5" fill={b ? '#0d9488' : '#94a3b8'} /><text x={p.x} y={p.y + 9} textAnchor="middle" fontSize="3" fill="#334155">{o.nombre}</text></g>
            ) })}
          </svg>
          <p className="text-center text-sm text-slate-600">{sel ? <><strong className="text-teal-700">{sel.bloqueada_por.length}</strong> de {orgs.length} municipios bloquean <code>{sel.valor}</code></> : 'Sin indicadores publicados.'}</p>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold text-ink">Indicadores compartidos</h2>
          <ul className="space-y-2">
            {inds.map((i) => {
              const miBloqueo = data.miOrg && i.bloqueada_por.includes(data.miOrg)
              return (
                <li key={i.id} onClick={() => setSel(i.id)} className={`cursor-pointer rounded-md border p-3 text-sm ${sel?.id === i.id ? 'border-brand bg-blue-50' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-2"><Badge tone="blue">{i.tipo}</Badge><code className="font-semibold">{i.valor}</code>
                    {user?.rol === 'referente' && (miBloqueo ? <Badge tone="green">Bloqueado en tu org.</Badge> : <button onClick={(e) => { e.stopPropagation(); bloquear.mutate(i.id) }} className="ml-auto rounded-md bg-brand px-2 py-1 text-xs font-semibold text-white">Bloquear en mi organización</button>)}</div>
                  <div className="mt-1 text-slate-600">{i.descripcion}</div>
                  <div className="text-xs text-slate-400">Publicado por {i.origen ?? '—'} · {fecha(i.creado)} · {i.bloqueada_por.length} bloqueo(s)</div>
                </li>
              )
            })}
            {!inds.length && <li className="text-sm text-slate-500">Todavía no hay indicadores. El analista SOC los publica desde el detalle de una alerta.</li>}
          </ul>
          {bloquear.error && <ErrorMsg error={bloquear.error} />}
        </Card>
      </div>
    </div>
  )
}
