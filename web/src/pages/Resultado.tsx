import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { Badge, Card, PageTitle } from '../components/ui'
import { useStore } from '../state/store'
import { esfuerzoLabel, impactoLabel, nivel, planRecomendado, porArea, puntajeBase, topAcciones } from '../lib/scoring'
import { postDiagnostico } from '../lib/api'

export function Resultado() {
  const { s } = useStore()
  const enviado = useRef(false)
  const puntaje = puntajeBase(s.respuestas)
  const niv = nivel(puntaje)
  const plan = planRecomendado(s.municipio.poblacion, s.municipio.tipo)
  const hay = Object.keys(s.respuestas).length > 0

  useEffect(() => {
    if (!hay || enviado.current) return
    enviado.current = true
    postDiagnostico({ municipio: s.municipio.nombre, poblacion: s.municipio.poblacion, tipo: s.municipio.tipo, respuestas: s.respuestas, puntaje, nivel: niv })
  }, [hay, puntaje, niv, s.municipio, s.respuestas])

  if (!hay) return <Card>Todavía no completaste el autodiagnóstico. <Link className="text-brand underline" to="/diagnostico">Hacerlo ahora</Link></Card>

  const tone = puntaje < 40 ? 'text-red-600' : puntaje < 70 ? 'text-amber-600' : 'text-emerald-600'

  return (
    <div>
      <PageTitle title={`Resultado: ${s.municipio.nombre}`} pain="“Le cuesta justificar inversiones”: el puntaje de madurez da un número y un plan concreto para mostrar." />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="text-center">
          <div className="text-xs font-medium uppercase text-slate-500">Madurez de ciberseguridad</div>
          <div className={`text-6xl font-bold ${tone}`}>{puntaje}<span className="text-2xl text-slate-400">/100</span></div>
          <Badge tone={puntaje < 40 ? 'red' : puntaje < 70 ? 'amber' : 'green'}>{niv}</Badge>
        </Card>
        <Card className="md:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <RadarChart data={porArea(s.respuestas)}>
                <PolarGrid />
                <PolarAngleAxis dataKey="area" tick={{ fontSize: 12 }} />
                <Radar dataKey="valor" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <h2 className="mb-2 mt-6 text-xl font-bold text-ink">Plan de mejora: las 5 acciones prioritarias</h2>
      <div className="space-y-2">
        {topAcciones(s.respuestas).map((a, i) => (
          <Card key={a.id} className="flex flex-wrap items-center gap-3 !p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink font-bold text-white">{i + 1}</span>
            <div className="flex-1">
              <div className="font-medium">{a.accion}</div>
              <div className="text-xs text-slate-500">{a.area}</div>
            </div>
            <Badge tone="green">Impacto {impactoLabel(a.impacto)}</Badge>
            <Badge tone="slate">Esfuerzo {esfuerzoLabel(a.esfuerzo)}</Badge>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-teal-300 bg-teal-50">
        <div className="text-xs font-semibold uppercase text-teal-700">Plan recomendado para {s.municipio.poblacion.toLocaleString('es-AR')} habitantes</div>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <span className="text-2xl font-bold text-ink">{plan.nombre}</span>
          <span className="text-xl font-semibold text-teal-700">{plan.precio}</span>
        </div>
        <p className="text-sm text-slate-600">{plan.detalle}. Empezá con Guardianes Digitales para resolver las acciones de arriba.</p>
        <div className="mt-3 flex gap-2">
          <Link to="/guardianes" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">Ir a Guardianes Digitales</Link>
          <Link to="/planes" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm">Ver todos los planes</Link>
        </div>
      </Card>
    </div>
  )
}
