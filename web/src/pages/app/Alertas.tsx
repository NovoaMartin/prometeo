import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Dices, Plus } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { Badge, btnPrimary, btnSecondary, Campo, Card, ErrorMsg, ESTADO_ALERTA, inputCls, PageTitle, SEV_LABEL, Spinner, sevTone, Upsell } from '../../components/ui'
import { api, fechaHora, post } from '../../lib/api'
import { useAccion } from '../../lib/hooks'
import { PLANTILLAS, TIPOS } from '@shared/plantillas'

export function Alertas() {
  const { user, org } = useAuth()
  const analista = user?.rol === 'analista'
  const escribe = user?.rol !== 'intendente'
  const [estado, setEstado] = useState('abiertas'), [sev, setSev] = useState(''), [orgF, setOrgF] = useState('')
  const [form, setForm] = useState(false)
  const [f, setF] = useState({ tipo: 'phishing', titulo: '', ip_origen: '', usuario_seudonimo: '', org_id: '' })
  const [n, setN] = useState(3)
  const habilitado = analista || org?.plan === 'escudo'

  const qs = new URLSearchParams({ ...(estado && { estado }), ...(sev && { severidad: sev }), ...(orgF && { org: orgF }) }).toString()
  const { data, isLoading, error } = useQuery({ queryKey: ['alertas', qs], queryFn: () => api<any[]>('/alertas?' + qs), enabled: habilitado })
  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: () => api<any[]>('/orgs'), enabled: analista })

  const crear = useAccion(() => post('/alertas', { ...f, org_id: f.org_id ? Number(f.org_id) : undefined }), ['alertas', 'panel', 'soc'])
  const generar = useAccion(() => post('/demo/generar', { cantidad: n, org_id: orgF ? Number(orgF) : undefined }), ['alertas', 'panel', 'soc'])

  if (!habilitado) return <><PageTitle title="Alertas" /><Upsell /></>

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PageTitle title="Alertas e incidentes" sub={analista ? 'Alertas de todas las organizaciones de la red.' : 'Alertas detectadas por el SOC compartido para tu organización.'} />
        {escribe && (
          <div className="flex flex-wrap items-center gap-2">
            <button className={btnSecondary + ' flex items-center gap-1'} onClick={() => setForm(!form)}><Plus size={14} /> Registrar alerta</button>
            <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white pl-2">
              <select className="bg-transparent text-sm" value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Cantidad">{[1, 3, 5, 10].map((x) => <option key={x}>{x}</option>)}</select>
              <button className={btnSecondary + ' flex items-center gap-1 border-0 border-l'} onClick={() => generar.mutate()} disabled={generar.isPending}><Dices size={14} /> Generar eventos de prueba</button>
            </div>
          </div>
        )}
      </div>
      {generar.error && <ErrorMsg error={generar.error} />}

      {form && (
        <Card className="mb-4">
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); crear.mutate(undefined, { onSuccess: () => { setForm(false); setF({ ...f, titulo: '', ip_origen: '', usuario_seudonimo: '' }) } }) }}>
            {analista && <Campo label="Organización"><select required className={inputCls} value={f.org_id} onChange={(e) => setF({ ...f, org_id: e.target.value })}><option value="">Elegir…</option>{orgs?.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}</select></Campo>}
            <Campo label="Tipo de alerta"><select className={inputCls} value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>{TIPOS.map((t) => <option key={t} value={t}>{PLANTILLAS[t].nombre}</option>)}</select></Campo>
            <Campo label="Título (opcional)"><input className={inputCls} value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder={PLANTILLAS[f.tipo as keyof typeof PLANTILLAS].titulo} /></Campo>
            <Campo label="IP de origen (opcional)"><input className={inputCls} value={f.ip_origen} onChange={(e) => setF({ ...f, ip_origen: e.target.value })} /></Campo>
            <Campo label="Usuario involucrado (seudónimo)"><input className={inputCls} value={f.usuario_seudonimo} onChange={(e) => setF({ ...f, usuario_seudonimo: e.target.value })} placeholder="Usuario #A3F9" /></Campo>
            <div className="sm:col-span-2">{crear.error && <ErrorMsg error={crear.error} />}<button className={btnPrimary} disabled={crear.isPending}>Registrar</button></div>
          </form>
        </Card>
      )}

      <div className="mb-3 flex flex-wrap gap-2 text-sm">
        <select className={inputCls + ' !w-44'} value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option><option value="abiertas">Abiertas</option>{Object.entries(ESTADO_ALERTA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className={inputCls + ' !w-40'} value={sev} onChange={(e) => setSev(e.target.value)}><option value="">Toda severidad</option>{Object.entries(SEV_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        {analista && <select className={inputCls + ' !w-48'} value={orgF} onChange={(e) => setOrgF(e.target.value)}><option value="">Todas las organizaciones</option>{orgs?.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}</select>}
      </div>

      {isLoading ? <Spinner /> : error ? <ErrorMsg error={error} /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Sev.</th><th>Alerta</th>{analista && <th>Organización</th>}<th>Usuario</th><th>Estado</th><th>Creada</th><th>Contención</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data!.map((a) => (
                <tr key={a.id}>
                  <td className="py-2"><Badge tone={sevTone(a.severidad)}>{SEV_LABEL[a.severidad]}</Badge></td>
                  <td><Link to={`/app/alertas/${a.id}`} className="text-brand hover:underline">{a.titulo}</Link></td>
                  {analista && <td>{a.org_nombre}</td>}
                  <td className="font-mono text-xs">{a.usuario_seudonimo ?? '—'}</td>
                  <td><Badge tone={ESTADO_ALERTA[a.estado].tone}>{ESTADO_ALERTA[a.estado].label}</Badge></td>
                  <td className="whitespace-nowrap">{fechaHora(a.creada)}</td><td>{a.minutos == null ? '—' : `${a.minutos} min`}</td>
                </tr>
              ))}
              {!data!.length && <tr><td colSpan={7} className="py-4 text-slate-500">No hay alertas con esos filtros.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
