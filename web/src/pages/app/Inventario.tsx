import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { Badge, btnPrimary, Campo, Card, ErrorMsg, inputCls, PageTitle, Spinner } from '../../components/ui'
import { api, del, patch, post } from '../../lib/api'
import { useAccion } from '../../lib/hooks'

const TIPOS = ['salud', 'fiscal', 'social', 'personal', 'otro']
const VACIO = { nombre: '', area_municipal: '', tipo_dato: 'personal', titulares: 0, ubicacion: '', acceso_restringido: false }

export function Inventario() {
  const { data, isLoading, error } = useQuery({ queryKey: ['inventario'], queryFn: () => api<any[]>('/inventario') })
  const [f, setF] = useState(VACIO)
  const alta = useAccion(() => post('/inventario', f), ['inventario'])
  const toggle = useAccion(({ id, v }: { id: number; v: boolean }) => patch(`/inventario/${id}`, { acceso_restringido: v }), ['inventario'])
  const borrar = useAccion((id: number) => del(`/inventario/${id}`), ['inventario'])

  if (isLoading) return <Spinner />
  if (error) return <ErrorMsg error={error} />
  const sinRestringir = data!.filter((i) => !i.acceso_restringido)

  return (
    <div>
      <PageTitle title="Inventario de datos sensibles" sub="Dónde están los datos personales y quién puede acceder a ellos." />
      {sinRestringir.length > 0 && <Card className="mb-4 border-amber-300 bg-amber-50 text-sm"><strong>{sinRestringir.length} activo(s) con acceso sin restringir</strong> ({sinRestringir.reduce((a, i) => a + i.titulares, 0).toLocaleString('es-AR')} titulares). Restringí el acceso o movelos a un espacio protegido.</Card>}
      <Card className="mb-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Activo</th><th>Área</th><th>Tipo</th><th>Titulares</th><th>Ubicación</th><th>Acceso</th><th /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {data!.map((i) => (
              <tr key={i.id}>
                <td className="py-2 pr-2 font-medium">{i.nombre}</td><td>{i.area_municipal}</td>
                <td><Badge tone={i.tipo_dato === 'salud' ? 'red' : 'blue'}>{i.tipo_dato}</Badge></td>
                <td>{i.titulares.toLocaleString('es-AR')}</td><td className="text-slate-500">{i.ubicacion}</td>
                <td><label className="flex items-center gap-1.5"><input type="checkbox" checked={!!i.acceso_restringido} onChange={(e) => toggle.mutate({ id: i.id, v: e.target.checked })} />{i.acceso_restringido ? 'Restringido' : <span className="font-semibold text-red-600">Abierto</span>}</label></td>
                <td><button onClick={() => confirm(`¿Eliminar "${i.nombre}"?`) && borrar.mutate(i.id)} aria-label="Eliminar" className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button></td>
              </tr>
            ))}
            {!data!.length && <tr><td colSpan={7} className="py-4 text-slate-500">Sin activos registrados.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Card>
        <h2 className="mb-3 font-bold text-ink">Agregar activo</h2>
        <form className="grid gap-3 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); alta.mutate(undefined, { onSuccess: () => setF(VACIO) }) }}>
          <Campo label="Nombre"><input required className={inputCls} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></Campo>
          <Campo label="Área"><input className={inputCls} value={f.area_municipal} onChange={(e) => setF({ ...f, area_municipal: e.target.value })} /></Campo>
          <Campo label="Tipo de dato"><select className={inputCls} value={f.tipo_dato} onChange={(e) => setF({ ...f, tipo_dato: e.target.value })}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select></Campo>
          <Campo label="Titulares (personas)"><input type="number" min={0} className={inputCls} value={f.titulares} onChange={(e) => setF({ ...f, titulares: Number(e.target.value) })} /></Campo>
          <Campo label="Ubicación"><input className={inputCls} value={f.ubicacion} onChange={(e) => setF({ ...f, ubicacion: e.target.value })} /></Campo>
          <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={f.acceso_restringido} onChange={(e) => setF({ ...f, acceso_restringido: e.target.checked })} /> Acceso restringido</label>
          <div className="sm:col-span-3">{alta.error && <ErrorMsg error={alta.error} />}<button className={btnPrimary + ' mt-1'} disabled={alta.isPending}>Agregar</button></div>
        </form>
      </Card>
    </div>
  )
}
