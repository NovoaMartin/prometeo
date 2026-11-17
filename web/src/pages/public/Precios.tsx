import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Card } from '../../components/ui'
import { planRecomendado } from '@shared/scoring'

const PLANES = [
  { t: 'Autodiagnóstico', p: 'Gratis', who: 'Municipios y organizaciones', inc: ['Cuestionario guiado de 12 preguntas', 'Puntaje de madurez 0–100', 'Plan de mejora priorizado'] },
  { t: 'Guardianes Digitales', p: 'Gratis o subsidiado', who: 'Municipios, escuelas, centros de salud, clubes y ONG', inc: ['Inventario de datos sensibles', 'MFA, copias de seguridad y protocolo básico', 'Capacitación del personal', 'Acompañamiento de estudiantes supervisados'] },
  { t: 'Escudo Municipal', p: 'Desde USD 700 / mes', who: 'Municipios', inc: ['Monitoreo 24/7 desde el SOC compartido', 'Alertas y respuesta guiada ante incidentes', 'Gestión de vulnerabilidades', 'Red de amenazas compartidas', 'Reporte de cumplimiento'], destacado: true },
  { t: 'Asistente inteligente', p: 'Plan Free / abono', who: 'Todos los usuarios', inc: ['Explica alertas en lenguaje simple', 'Guía los primeros pasos', 'Adapta el tono según tu rol'] },
]
const FAQ = [
  ['¿Cómo se calcula el precio del Escudo Municipal?', 'El abono mensual es escalonado según la población del municipio. Los precios son estimativos y se validan con el piloto.'],
  ['¿Qué datos recibe el SOC?', 'Solo registros de seguridad, con los datos personales filtrados o seudonimizados desde el origen.'],
  ['¿Las organizaciones sociales pagan?', 'No necesariamente: el nivel Guardianes Digitales es gratuito o subsidiado con aportes de municipios, patrocinios y subsidios.'],
  ['¿Quiénes son los Guardianes Digitales?', 'Estudiantes de universidades del consorcio que trabajan con supervisión y obtienen experiencia real y certificable.'],
]

export function Precios() {
  const [hab, setHab] = useState(30000)
  const plan = planRecomendado(hab, 'municipio')
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-ink">Planes y precios</h1>
      <p className="mt-1 text-slate-600">Empezá gratis y sumá protección a medida que la necesites.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANES.map((p) => (
          <Card key={p.t} className={p.destacado ? 'border-brand ring-2 ring-brand/30' : ''}>
            <h2 className="font-semibold text-ink">{p.t}</h2>
            <div className="mt-1 text-xl font-bold text-accent">{p.p}</div>
            <p className="mt-1 text-xs text-slate-500">{p.who}</p>
            <ul className="mt-3 space-y-1.5 text-sm">{p.inc.map((i) => <li key={i} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />{i}</li>)}</ul>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <h2 className="font-bold text-ink">Calculadora del Escudo Municipal</h2>
        <label className="mt-3 block text-sm">Habitantes del municipio: <strong>{hab.toLocaleString('es-AR')}</strong>
          <input type="range" min={1000} max={100000} step={1000} value={hab} onChange={(e) => setHab(Number(e.target.value))} className="mt-2 w-full" />
        </label>
        <div className="mt-2 text-3xl font-bold text-teal-700">{plan.precio}</div>
        <p className="text-xs text-slate-500">Tramos: hasta 20.000 hab. USD 700 · 20.000–50.000 USD 1.400 · 50.000–100.000 USD 2.500. Precios estimativos, sujetos a validación.</p>
        <div className="mt-4 flex gap-2">
          <Link to="/autodiagnostico" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">Empezar con el autodiagnóstico</Link>
          <Link to="/registro" className="rounded-md border border-slate-300 px-4 py-2 text-sm">Crear cuenta</Link>
        </div>
      </Card>

      <h2 className="mb-3 mt-10 text-xl font-bold text-ink">Preguntas frecuentes</h2>
      <div className="space-y-2">{FAQ.map(([q, a]) => <Card key={q} className="!p-4"><h3 className="font-semibold text-ink">{q}</h3><p className="mt-1 text-sm text-slate-600">{a}</p></Card>)}</div>
    </div>
  )
}
