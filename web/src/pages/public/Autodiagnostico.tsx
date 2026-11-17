import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { btnPrimary, Campo, Card, ErrorMsg, inputCls } from '../../components/ui'
import { Cuestionario } from '../../components/Cuestionario'
import { ResultadoDiagnostico } from '../../components/ResultadoDiagnostico'
import { post } from '../../lib/api'
import { PREGUNTAS, type Respuesta } from '@shared/preguntas'
import { planRecomendado, puntajeBase } from '@shared/scoring'

export function Autodiagnostico() {
  const [org, setOrg] = useState({ municipio: '', poblacion: 10000, tipo: 'municipio' as 'municipio' | 'ong', email: '' })
  const [r, setR] = useState<Record<string, Respuesta>>({})
  const [listo, setListo] = useState(false)
  const completo = PREGUNTAS.every((p) => r[p.id]) && org.municipio.trim().length > 1

  const enviar = useMutation({
    mutationFn: () => post('/diagnosticos/publico', { ...org, respuestas: r }),
    onSuccess: () => {
      try { sessionStorage.setItem('prometeo-diag', JSON.stringify({ orgNombre: org.municipio, poblacion: org.poblacion, tipo: org.tipo, email: org.email, respuestas: r })) } catch { /* sin storage */ }
      setListo(true); window.scrollTo(0, 0)
    },
  })

  if (listo) {
    const puntaje = puntajeBase(r)
    const plan = planRecomendado(org.poblacion, org.tipo)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-5 text-2xl font-bold text-ink">Resultado: {org.municipio}</h1>
        <ResultadoDiagnostico respuestas={r} puntaje={puntaje} />
        <Card className="mt-6 border-teal-300 bg-teal-50">
          <div className="text-xs font-semibold uppercase text-teal-700">Plan recomendado para {org.poblacion.toLocaleString('es-AR')} habitantes</div>
          <div className="mt-1 flex flex-wrap items-baseline gap-3"><span className="text-2xl font-bold text-ink">{plan.nombre}</span><span className="text-xl font-semibold text-teal-700">{plan.precio}</span></div>
          <p className="text-sm text-slate-600">{plan.detalle}.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/registro" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">Crear cuenta y guardar este resultado</Link>
            <Link to="/precios" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm">Ver planes</Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">Autodiagnóstico de ciberseguridad</h1>
      <p className="mb-5 mt-1 text-slate-600">12 preguntas, 3 minutos. Gratis y sin cuenta.</p>
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Organización"><input className={inputCls} value={org.municipio} onChange={(e) => setOrg({ ...org, municipio: e.target.value })} placeholder="Ej.: Municipio de…" /></Campo>
          <Campo label="Tipo"><select className={inputCls} value={org.tipo} onChange={(e) => setOrg({ ...org, tipo: e.target.value as 'municipio' | 'ong' })}><option value="municipio">Municipio</option><option value="ong">Organización social</option></select></Campo>
          <Campo label="Población / habitantes"><input type="number" min={0} className={inputCls} value={org.poblacion} onChange={(e) => setOrg({ ...org, poblacion: Number(e.target.value) })} /></Campo>
          <Campo label="Email (opcional, para enviarte el resultado)"><input type="email" className={inputCls} value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} /></Campo>
        </div>
      </Card>
      <Cuestionario value={r} onChange={(id, v) => setR({ ...r, [id]: v })} />
      {enviar.error && <ErrorMsg error={enviar.error} />}
      <button disabled={!completo || enviar.isPending} onClick={() => enviar.mutate()} className={btnPrimary + ' mt-2 px-6 py-3'}>Ver mi resultado</button>
      {!completo && <span className="ml-3 text-sm text-slate-500">Completá el nombre y las 12 preguntas.</span>}
    </div>
  )
}
