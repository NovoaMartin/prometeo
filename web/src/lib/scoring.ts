import { AREAS, PREGUNTAS, VALOR, type Respuesta } from '../data/preguntas'

export type Respuestas = Record<string, Respuesta>

export function puntajeBase(r: Respuestas): number {
  const suma = PREGUNTAS.reduce((a, p) => a + (r[p.id] ? VALOR[r[p.id]] : 0), 0)
  return Math.round((suma / PREGUNTAS.length) * 100)
}

export function nivel(p: number): 'Inicial' | 'En desarrollo' | 'Gestionado' {
  return p < 40 ? 'Inicial' : p < 70 ? 'En desarrollo' : 'Gestionado'
}

export function porArea(r: Respuestas) {
  return AREAS.map((area) => {
    const qs = PREGUNTAS.filter((p) => p.area === area)
    const s = qs.reduce((a, p) => a + (r[p.id] ? VALOR[r[p.id]] : 0), 0)
    return { area, valor: Math.round((s / qs.length) * 100) }
  })
}

// Top 5 acciones: preguntas no cumplidas, ordenadas por impacto alto y esfuerzo bajo
export function topAcciones(r: Respuestas) {
  return PREGUNTAS.filter((p) => (r[p.id] ? VALOR[r[p.id]] : 0) < 1)
    .map((p) => ({ ...p, score: p.impacto * 3 - p.esfuerzo + (r[p.id] === 'no' ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

export type Plan = { nombre: string; precio: string; detalle: string }

export function planRecomendado(poblacion: number, tipo: 'municipio' | 'ong'): Plan {
  if (tipo === 'ong') return { nombre: 'Guardianes Digitales', precio: 'Gratis / subsidiado', detalle: 'Inventario de datos, MFA, copias, capacitación y protocolo básico' }
  if (poblacion <= 20000) return { nombre: 'Escudo Municipal', precio: 'USD 700 / mes', detalle: 'Monitoreo 24/7, alertas, vulnerabilidades y respuesta guiada' }
  if (poblacion <= 50000) return { nombre: 'Escudo Municipal', precio: 'USD 1.400 / mes', detalle: 'Monitoreo 24/7, alertas, vulnerabilidades y respuesta guiada' }
  return { nombre: 'Escudo Municipal', precio: 'USD 2.500 / mes', detalle: 'Monitoreo 24/7, alertas, vulnerabilidades y respuesta guiada' }
}

export const impactoLabel = (n: number) => ['', 'Bajo', 'Medio', 'Alto'][n]
export const esfuerzoLabel = (n: number) => ['', 'Bajo', 'Medio', 'Alto'][n]
