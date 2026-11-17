import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react'
import type { Rol } from '../data/municipio'
import { MUNICIPIO } from '../data/municipio'
import { PRESET_VILLA_EJEMPLO } from '../data/preguntas'
import { CHECKS } from '../data/alertas'
import { TAREAS } from '../data/tareas'
import { puntajeBase, type Respuestas } from '../lib/scoring'

export interface State {
  rol: Rol
  municipio: { nombre: string; poblacion: number; tipo: 'municipio' | 'ong' }
  respuestas: Respuestas
  diagnosticoHecho: boolean
  tareas: Record<string, boolean>
  quizOk: boolean
  alerta: { activa: boolean; checks: Record<string, boolean>; contenida: boolean }
  presentador: boolean
  paso: number
}

export const initial: State = {
  rol: 'referente',
  municipio: { nombre: MUNICIPIO.nombre, poblacion: MUNICIPIO.poblacion, tipo: 'municipio' },
  respuestas: {},
  diagnosticoHecho: false,
  tareas: {},
  quizOk: false,
  alerta: { activa: false, checks: {}, contenida: false },
  presentador: false,
  paso: 0,
}

export type Action =
  | { type: 'SET_ROL'; rol: Rol }
  | { type: 'SET_MUNICIPIO'; municipio: State['municipio'] }
  | { type: 'RESPONDER'; id: string; valor: Respuestas[string] }
  | { type: 'PRESET' }
  | { type: 'FINALIZAR_DIAGNOSTICO' }
  | { type: 'TOGGLE_TAREA'; id: string }
  | { type: 'QUIZ_OK' }
  | { type: 'SIMULAR_ATAQUE' }
  | { type: 'TOGGLE_CHECK'; id: string }
  | { type: 'PRESENTADOR'; on: boolean }
  | { type: 'PASO'; n: number }
  | { type: 'RESET' }

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'SET_ROL': return { ...s, rol: a.rol }
    case 'SET_MUNICIPIO': return { ...s, municipio: a.municipio }
    case 'RESPONDER': return { ...s, respuestas: { ...s.respuestas, [a.id]: a.valor } }
    case 'PRESET': return { ...s, respuestas: { ...PRESET_VILLA_EJEMPLO }, municipio: initial.municipio }
    case 'FINALIZAR_DIAGNOSTICO': return { ...s, diagnosticoHecho: true }
    case 'TOGGLE_TAREA': return { ...s, tareas: { ...s.tareas, [a.id]: !s.tareas[a.id] } }
    case 'QUIZ_OK': return { ...s, quizOk: true }
    case 'SIMULAR_ATAQUE': return { ...s, alerta: { activa: true, checks: {}, contenida: false } }
    case 'TOGGLE_CHECK': {
      const checks = { ...s.alerta.checks, [a.id]: !s.alerta.checks[a.id] }
      const contenida = CHECKS.every((c) => checks[c.id])
      return { ...s, alerta: { ...s.alerta, checks, contenida } }
    }
    case 'PRESENTADOR': return { ...s, presentador: a.on }
    case 'PASO': return { ...s, paso: a.n }
    case 'RESET': return { ...initial, presentador: s.presentador }
  }
}

const KEY = 'prometeo-demo-v1'
function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initial, ...JSON.parse(raw) }
  } catch { /* sin storage */ }
  return initial
}

const Ctx = createContext<{ s: State; d: Dispatch<Action> } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, d] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignorar */ }
  }, [s])
  return <Ctx.Provider value={{ s, d }}>{children}</Ctx.Provider>
}

export function useStore() {
  const c = useContext(Ctx)
  if (!c) throw new Error('StoreProvider faltante')
  return c
}

// Derivados
export const puntajeActual = (s: State) => {
  const base = puntajeBase(Object.keys(s.respuestas).length ? s.respuestas : PRESET_VILLA_EJEMPLO)
  const extra = TAREAS.reduce((a, t) => a + (s.tareas[t.id] ? t.puntos : 0), 0)
  return Math.min(100, base + extra)
}
export const mfaActual = (s: State) => (s.tareas['t3'] ? 95 : MUNICIPIO.mfaInicial)
export const minutosContencion = (s: State) =>
  CHECKS.reduce((a, c) => a + (s.alerta.checks[c.id] ? c.min : 0), 0)
