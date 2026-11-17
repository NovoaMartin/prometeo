import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { Badge, btnPrimary, Card, ErrorMsg, ESTADO_ALERTA, inputCls, PageTitle, SEV_LABEL, Spinner, sevTone } from '../../components/ui'
import { api, fecha, fechaHora } from '../../lib/api'

const iso = (d: Date) => d.toISOString().slice(0, 10)

export function Reporte() {
  const [desde, setDesde] = useState(iso(new Date(Date.now() - 90 * 864e5)))
  const [hasta, setHasta] = useState(iso(new Date()))
  const { data: d, isLoading, error } = useQuery({ queryKey: ['reporte', desde, hasta], queryFn: () => api<any>(`/reporte?desde=${desde}&hasta=${hasta}`) })

  return (
    <div>
      <div className="no-print flex flex-wrap items-start justify-between gap-2">
        <PageTitle title="Reporte de cumplimiento" sub="Evidencia de las medidas adoptadas en el período." />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input type="date" className={inputCls + ' !w-40'} value={desde} onChange={(e) => setDesde(e.target.value)} />
          <span>a</span>
          <input type="date" className={inputCls + ' !w-40'} value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <button onClick={() => window.print()} className={btnPrimary + ' flex items-center gap-2'}><Printer size={16} /> Imprimir / PDF</button>
        </div>
      </div>
      {isLoading ? <Spinner /> : error ? <ErrorMsg error={error} /> : (
        <Card>
          <h2 className="text-xl font-bold text-ink">Informe de ciberseguridad · {d.org.nombre}</h2>
          <p className="text-sm text-slate-500">Período {fecha(d.desde + ' 00:00:00')} – {fecha(d.hasta + ' 00:00:00')} · Red de Ciberseguridad Comunitaria</p>

          <h3 className="mt-5 font-bold">1. Madurez de seguridad</h3>
          {d.diagnosticos.length ? (
            <p className="text-sm">{d.diagnosticos.length} diagnóstico(s) en el período: {d.diagnosticos.map((x: any) => `${x.puntaje}/100 (${fecha(x.creado)})`).join(' → ')}. Cuentas con MFA: <strong>{d.mfaPct ?? '—'}%</strong>.</p>
          ) : <p className="text-sm text-slate-500">Sin diagnósticos en el período. Cuentas con MFA: {d.mfaPct ?? '—'}%.</p>}

          <h3 className="mt-5 font-bold">2. Medidas adoptadas</h3>
          {d.tareasHechas.length ? <ul className="list-disc pl-5 text-sm">{d.tareasHechas.map((t: any, i: number) => <li key={i}>{t.titulo} — {fecha(t.completada)}{t.guardian ? ` (Guardián: ${t.guardian})` : ''}</li>)}</ul> : <p className="text-sm text-slate-500">Sin medidas completadas en el período.</p>}
          <p className="mt-1 text-sm">Capacitación: {d.capacitacion.personas} persona(s) evaluada(s){d.capacitacion.promedio != null ? `, promedio ${d.capacitacion.promedio}%` : ''}.</p>

          <h3 className="mt-5 font-bold">3. Incidentes</h3>
          {d.org.plan === 'escudo' ? (
            <>
              <p className="text-sm">{d.resumenAlertas.total} alerta(s), {d.resumenAlertas.criticas} crítica(s), {d.resumenAlertas.contenidas} contenida(s){d.resumenAlertas.tiempoMedioMin != null ? ` · tiempo medio de contención ${d.resumenAlertas.tiempoMedioMin} min (meta < 30)` : ''}.</p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-1">Fecha</th><th>Alerta</th><th>Sev.</th><th>Estado</th><th>Contención</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {d.alertas.map((a: any) => <tr key={a.id}><td className="py-1 whitespace-nowrap">{fechaHora(a.creada)}</td><td>{a.titulo}</td><td><Badge tone={sevTone(a.severidad)}>{SEV_LABEL[a.severidad]}</Badge></td><td>{ESTADO_ALERTA[a.estado].label}</td><td>{a.minutos == null ? '—' : `${a.minutos} min`}</td></tr>)}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-sm">Vulnerabilidades: {d.vulnerabilidades.abierta ?? 0} abierta(s), {d.vulnerabilidades.mitigada ?? 0} mitigada(s).</p>
            </>
          ) : <p className="text-sm text-slate-500">Monitoreo no contratado (disponible en el plan Escudo Municipal).</p>}

          <h3 className="mt-5 font-bold">4. Cumplimiento</h3>
          <p className="text-sm">Los registros del SOC se reciben con datos personales seudonimizados. Este informe reúne la evidencia de medidas técnicas y organizativas para el área legal.</p>
        </Card>
      )}
    </div>
  )
}
