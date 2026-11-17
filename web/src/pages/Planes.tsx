import { useState } from 'react'
import { Card, PageTitle } from '../components/ui'
import { planRecomendado } from '../lib/scoring'

const PLANES = [
  { t: 'Autodiagnóstico', who: 'Municipios y organizaciones', inc: 'Cuestionario, puntaje de madurez y plan priorizado', p: 'Gratuito' },
  { t: 'Guardianes Digitales', who: 'Municipios, escuelas, salud, clubes y ONG', inc: 'Inventario, MFA, copias, capacitación y protocolo', p: 'Gratis o subsidiado' },
  { t: 'Escudo Municipal', who: 'Municipios', inc: 'Monitoreo, alertas, vulnerabilidades y respuesta guiada', p: 'Abono mensual' },
  { t: 'Asistente inteligente', who: 'Todos los usuarios', inc: 'Copiloto de seguridad según el tipo de usuario', p: 'Plan Free / abono' },
]

export function Planes() {
  const [hab, setHab] = useState(30000)
  const plan = planRecomendado(hab, 'municipio')
  return (
    <div>
      <PageTitle title="Planes y precios" pain="“Mejorar la seguridad sin grandes inversiones”: costo compartido y escalonado por población." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANES.map((p) => (
          <Card key={p.t}>
            <h3 className="font-semibold text-ink">{p.t}</h3>
            <p className="text-xs text-slate-500">{p.who}</p>
            <p className="mt-2 text-sm">{p.inc}</p>
            <p className="mt-3 font-semibold text-accent">{p.p}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <h2 className="font-bold text-ink">Calculadora del Escudo Municipal</h2>
        <label className="mt-2 block text-sm">Habitantes: <strong>{hab.toLocaleString('es-AR')}</strong>
          <input type="range" min={1000} max={100000} step={1000} value={hab} onChange={(e) => setHab(Number(e.target.value))} className="w-full" />
        </label>
        <div className="mt-2 text-3xl font-bold text-teal-700">{plan.precio}</div>
        <p className="text-xs text-slate-500">Precios estimativos, sujetos a validación con el piloto.</p>
      </Card>
    </div>
  )
}
