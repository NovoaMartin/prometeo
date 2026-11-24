import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Bot, Eye, GraduationCap, Network, RefreshCw, ShieldAlert, Users, Wallet } from 'lucide-react'
import { Card } from '../../components/ui'
import { api, type Stats } from '../../lib/api'

const PROBLEMAS = [
  { i: ShieldAlert, t: 'Datos sensibles sin vigilancia', d: 'Municipios y organizaciones manejan datos fiscales, de salud y de programas sociales sin monitoreo ni guardia las 24 horas.' },
  { i: Users, t: 'Equipos mínimos', d: 'Una a tres personas hacen soporte e infraestructura a la vez. Las contraseñas compartidas y las cuentas sin MFA son habituales.' },
  { i: Wallet, t: 'Presupuesto ajustado', d: 'Un SOC comercial es caro y está pensado para empresas. Cuesta justificar la inversión y demostrar cumplimiento.' },
]
const PASOS = [
  { n: 1, t: 'Diagnóstico', d: 'Un cuestionario guiado devuelve un puntaje de madurez y un plan priorizado.' },
  { n: 2, t: 'Reducción de riesgos', d: 'Estudiantes supervisados (Guardianes Digitales) ayudan a resolver las acciones del plan.' },
  { n: 3, t: 'Monitoreo y respuesta', d: 'Un SOC compartido vigila, alerta y guía la respuesta ante incidentes.' },
  { n: 4, t: 'Aprendizaje compartido', d: 'Cada amenaza detectada se comparte con la red: lo que le pasa a uno protege a todos.' },
]
const NIVELES = [
  { t: 'Autodiagnóstico', d: 'Cuestionario guiado, puntaje de madurez y plan priorizado.', a: 'Gratuito', i: Eye },
  { t: 'Guardianes Digitales', d: 'Inventario de datos, MFA, copias, capacitación y protocolo básico.', a: 'Gratis / subsidiado', i: GraduationCap },
  { t: 'Escudo Municipal', d: 'Monitoreo 24/7, alertas, vulnerabilidades y respuesta guiada.', a: 'Abono mensual', i: Network },
  { t: 'Asistente inteligente', d: 'Copiloto que explica alertas y guía los primeros pasos.', a: 'Plan Free / abono', i: Bot },
]

export function Landing() {
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: () => api<Stats>('/diagnosticos/publico/stats') })
  return (
    <div>
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-300">Red de Ciberseguridad Comunitaria</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold md:text-5xl">Tu municipio protegido las 24 horas, sin armar un sistema de seguridad propio.</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Una red que une universidades y municipios para vigilar, alertar y responder por vos, a un costo compartido.</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link to="/autodiagnostico" className="inline-flex items-center gap-2 rounded-lg bg-teal-400 px-5 py-3 font-semibold text-ink hover:bg-teal-300">Hacer autodiagnóstico gratis <ArrowRight size={18} /></Link>
            <Link to="/precios" className="rounded-lg border border-slate-500 px-5 py-3 text-slate-100 hover:bg-white/10">Ver precios</Link>
            {stats && stats.total > 0 && <span className="text-sm text-slate-300"><strong className="text-white">{stats.total}</strong> autodiagnósticos completados</span>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold text-ink">El problema</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {PROBLEMAS.map(({ i: Icon, t, d }) => <Card key={t}><Icon className="text-brand" /><h3 className="mt-2 font-semibold text-ink">{t}</h3><p className="mt-1 text-sm text-slate-600">{d}</p></Card>)}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-ink"><RefreshCw size={22} /> Cómo funciona</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            {PASOS.map((p) => (
              <div key={p.n} className="rounded-xl border border-slate-200 p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand font-bold text-white">{p.n}</span>
                <h3 className="mt-2 font-semibold text-ink">{p.t}</h3><p className="mt-1 text-sm text-slate-600">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold text-ink">Niveles de servicio</h2>
        <p className="mt-1 text-slate-600">Empezá sin costo y aumentá la protección de forma gradual.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NIVELES.map(({ t, d, a, i: Icon }) => <Card key={t}><Icon className="text-brand" /><h3 className="mt-2 font-semibold text-ink">{t}</h3><p className="mt-1 text-sm text-slate-600">{d}</p><p className="mt-3 text-xs font-semibold text-accent">{a}</p></Card>)}
        </div>
        <div className="mt-8 rounded-xl bg-teal-50 p-6 text-center">
          <h3 className="text-xl font-bold text-ink">¿Cuál es el estado de seguridad de tu organización?</h3>
          <p className="mt-1 text-slate-600">Son 12 preguntas y 3 minutos. Sin tarjeta ni compromiso.</p>
          <Link to="/autodiagnostico" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 font-semibold text-white">Empezar el autodiagnóstico <ArrowRight size={18} /></Link>
        </div>
      </section>
    </div>
  )
}
