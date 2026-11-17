import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bot, Eye, GraduationCap, Network } from 'lucide-react'
import { Card } from '../components/ui'
import { getStats, type Stats } from '../lib/api'

const NIVELES = [
  { t: 'Autodiagnóstico', d: 'Cuestionario guiado, puntaje de madurez y plan priorizado.', a: 'Gratuito', i: Eye },
  { t: 'Guardianes Digitales', d: 'Inventario de datos, MFA, copias, capacitación y protocolo.', a: 'Gratis / subsidiado', i: GraduationCap },
  { t: 'Escudo Municipal', d: 'Monitoreo 24/7, alertas, vulnerabilidades y respuesta guiada.', a: 'Abono mensual', i: Network },
  { t: 'Asistente inteligente', d: 'Copiloto que explica alertas y guía los primeros pasos.', a: 'Plan Free / abono', i: Bot },
]

export function Inicio() {
  const [stats, setStats] = useState<Stats | null>(null)
  useEffect(() => { getStats().then(setStats) }, [])

  return (
    <div>
      <section className="rounded-2xl bg-ink p-8 text-white md:p-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-300">Red de Ciberseguridad Comunitaria</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold md:text-5xl">Tu municipio protegido las 24 horas, sin armar un SOC propio.</h1>
        <p className="mt-4 max-w-2xl text-slate-300">Una red que une universidades y municipios para vigilar, alertar y responder por vos, a un costo compartido.</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link to="/diagnostico" className="inline-flex items-center gap-2 rounded-lg bg-teal-400 px-5 py-3 font-semibold text-ink hover:bg-teal-300">
            Hacer autodiagnóstico gratis <ArrowRight size={18} />
          </Link>
          {stats && (
            <span className="text-sm text-slate-300">
              <strong className="text-white">{stats.total}</strong> autodiagnósticos completados
              {stats.mock && ' (dato de ejemplo)'}
            </span>
          )}
        </div>
      </section>

      <h2 className="mb-3 mt-8 text-xl font-bold text-ink">Niveles de servicio</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {NIVELES.map(({ t, d, a, i: Icon }) => (
          <Card key={t}>
            <Icon className="text-brand" />
            <h3 className="mt-2 font-semibold text-ink">{t}</h3>
            <p className="mt-1 text-sm text-slate-600">{d}</p>
            <p className="mt-3 text-xs font-semibold text-accent">{a}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
