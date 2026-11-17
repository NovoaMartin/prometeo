import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/AuthContext'
import { Badge, btnPrimary, Campo, Card, ErrorMsg, inputCls, PageTitle } from '../../components/ui'
import { api, fecha, patch, post } from '../../lib/api'
import { useAccion } from '../../lib/hooks'
import { planRecomendado } from '@shared/scoring'

export function Configuracion() {
  const { org } = useAuth()
  const qc = useQueryClient()
  const [f, setF] = useState({ nombre: '', poblacion: 0, cuentas_total: 0, cuentas_mfa: 0, plan: 'free' })
  useEffect(() => { if (org) setF({ nombre: org.nombre, poblacion: org.poblacion, cuentas_total: org.cuentas_total, cuentas_mfa: org.cuentas_mfa, plan: org.plan }) }, [org])
  const guardar = useAccion(async () => { await patch('/org', f); await qc.invalidateQueries({ queryKey: ['me'] }) }, ['panel'])

  const { data: usuarios } = useQuery({ queryKey: ['usuarios'], queryFn: () => api<any[]>('/usuarios') })
  const [u, setU] = useState({ nombre: '', email: '', password: '', rol: 'intendente' })
  const alta = useAccion(() => post('/usuarios', u), ['usuarios'])
  if (!org) return null
  const sugerido = planRecomendado(f.poblacion, org.tipo)

  return (
    <div>
      <PageTitle title="Configuración" sub="Datos de la organización, plan y usuarios." />
      <Card className="mb-4">
        <h2 className="mb-3 font-bold text-ink">Organización</h2>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); guardar.mutate() }}>
          <Campo label="Nombre"><input className={inputCls} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></Campo>
          <Campo label="Población / habitantes"><input type="number" min={0} className={inputCls} value={f.poblacion} onChange={(e) => setF({ ...f, poblacion: Number(e.target.value) })} /></Campo>
          <Campo label="Cuentas del personal"><input type="number" min={0} className={inputCls} value={f.cuentas_total} onChange={(e) => setF({ ...f, cuentas_total: Number(e.target.value) })} /></Campo>
          <Campo label="Cuentas con MFA activado"><input type="number" min={0} max={f.cuentas_total} className={inputCls} value={f.cuentas_mfa} onChange={(e) => setF({ ...f, cuentas_mfa: Number(e.target.value) })} /></Campo>
          <Campo label="Plan contratado">
            <select className={inputCls} value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })}>
              <option value="free">Free (autodiagnóstico)</option><option value="guardianes">Guardianes Digitales</option>{org.tipo === 'municipio' && <option value="escudo">Escudo Municipal</option>}
            </select>
          </Campo>
          <div className="text-sm text-slate-600 sm:pt-6">Para {f.poblacion.toLocaleString('es-AR')} habitantes: <strong>{sugerido.precio}</strong>. <span className="text-xs text-slate-400">(Sin facturación: el cambio de plan es inmediato.)</span></div>
          <div className="sm:col-span-2">{guardar.error && <ErrorMsg error={guardar.error} />}<button className={btnPrimary} disabled={guardar.isPending}>{guardar.isSuccess ? 'Guardado ✓' : 'Guardar cambios'}</button></div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-bold text-ink">Usuarios de la organización</h2>
        <ul className="mb-4 divide-y divide-slate-100 text-sm">
          {usuarios?.map((x) => <li key={x.id} className="flex items-center gap-2 py-2"><span className="font-medium">{x.nombre}</span><span className="text-slate-500">{x.email}</span><Badge tone="slate">{x.rol}</Badge><span className="ml-auto text-xs text-slate-400">desde {fecha(x.creado)}</span></li>)}
        </ul>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); alta.mutate(undefined, { onSuccess: () => setU({ nombre: '', email: '', password: '', rol: 'intendente' }) }) }}>
          <Campo label="Nombre"><input required className={inputCls} value={u.nombre} onChange={(e) => setU({ ...u, nombre: e.target.value })} /></Campo>
          <Campo label="Email"><input required type="email" className={inputCls} value={u.email} onChange={(e) => setU({ ...u, email: e.target.value })} /></Campo>
          <Campo label="Contraseña inicial (mín. 8)"><input required minLength={8} type="password" className={inputCls} value={u.password} onChange={(e) => setU({ ...u, password: e.target.value })} autoComplete="new-password" /></Campo>
          <Campo label="Rol"><select className={inputCls} value={u.rol} onChange={(e) => setU({ ...u, rol: e.target.value })}><option value="intendente">Intendente (solo lectura)</option><option value="referente">Referente (administra)</option></select></Campo>
          <div className="sm:col-span-2">{alta.error && <ErrorMsg error={alta.error} />}<button className={btnPrimary} disabled={alta.isPending}>Agregar usuario</button></div>
        </form>
      </Card>
    </div>
  )
}
