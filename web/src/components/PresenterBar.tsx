import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../state/store'
import { CHECKS } from '../data/alertas'
import { TAREAS } from '../data/tareas'

interface Paso { titulo: string; ruta: string; rol?: 'referente' | 'intendente' | 'analista' | 'ong'; run?: 'preset' | 'tareas' | 'ataque' | 'checks' }

const PASOS: Paso[] = [
  { titulo: 'Inicio y propuesta de valor', ruta: '/', rol: 'referente' },
  { titulo: 'Autodiagnóstico: 38/100', ruta: '/diagnostico/resultado', run: 'preset' },
  { titulo: 'Guardianes resuelven el Excel y MFA', ruta: '/guardianes', run: 'tareas' },
  { titulo: 'Panel: protegido 24/7', ruta: '/panel' },
  { titulo: 'Simular ataque (22:40)', ruta: '/panel', run: 'ataque' },
  { titulo: 'Detalle de la alerta + Asistente IA', ruta: '/alertas/a-001' },
  { titulo: 'Contención en 25 min', ruta: '/alertas/a-001', run: 'checks' },
  { titulo: 'La red comparte la IP', ruta: '/red' },
  { titulo: 'Reporte para el Intendente', ruta: '/reporte', rol: 'intendente' },
]

export function PresenterBar() {
  const { s, d } = useStore()
  const nav = useNavigate()
  if (!s.presentador) return null

  function ir(n: number) {
    const p = PASOS[n]
    if (!p) return
    if (p.rol) d({ type: 'SET_ROL', rol: p.rol })
    if (p.run === 'preset') { d({ type: 'PRESET' }); d({ type: 'FINALIZAR_DIAGNOSTICO' }) }
    if (p.run === 'tareas') TAREAS.forEach((t) => { if (!s.tareas[t.id]) d({ type: 'TOGGLE_TAREA', id: t.id }) })
    if (p.run === 'ataque') d({ type: 'SIMULAR_ATAQUE' })
    if (p.run === 'checks') CHECKS.forEach((c) => { if (!s.alerta.checks[c.id]) d({ type: 'TOGGLE_CHECK', id: c.id }) })
    d({ type: 'PASO', n })
    nav(p.ruta)
  }


  return (
    <div className="no-print fixed bottom-0 left-0 z-30 flex items-center gap-3 rounded-tr-xl bg-ink px-4 py-2 text-sm text-white shadow-lg">
      <button onClick={() => ir(Math.max(0, s.paso - 1))} aria-label="Anterior"><ChevronLeft size={18} /></button>
      <span className="font-semibold">{s.paso + 1}/{PASOS.length}</span>
      <span className="hidden sm:inline">{PASOS[s.paso].titulo}</span>
      <button onClick={() => ir(Math.min(PASOS.length - 1, s.paso + 1))} className="flex items-center gap-1 rounded bg-brand px-2 py-1 font-semibold" aria-label="Siguiente">
        Siguiente <ChevronRight size={16} />
      </button>
    </div>
  )
}
