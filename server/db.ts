import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync(process.env.DB_PATH ?? 'prometeo.db')
db.exec(`
  CREATE TABLE IF NOT EXISTS diagnosticos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creado TEXT NOT NULL DEFAULT (datetime('now')),
    municipio TEXT NOT NULL,
    poblacion INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    puntaje INTEGER NOT NULL,
    nivel TEXT NOT NULL,
    respuestas TEXT NOT NULL
  )
`)

export interface DiagnosticoIn {
  municipio: string
  poblacion: number
  tipo: string
  puntaje: number
  nivel: string
  respuestas: unknown
}

const insert = db.prepare(
  'INSERT INTO diagnosticos (municipio, poblacion, tipo, puntaje, nivel, respuestas) VALUES (?, ?, ?, ?, ?, ?)',
)

export function guardarDiagnostico(d: DiagnosticoIn) {
  insert.run(d.municipio.slice(0, 80), d.poblacion, d.tipo, d.puntaje, d.nivel, JSON.stringify(d.respuestas))
}

export function stats() {
  const r = db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(creado >= datetime('now','-7 days')), 0) AS ultimos7Dias,
              COALESCE(ROUND(AVG(puntaje)), 0) AS promedioPuntaje
       FROM diagnosticos`,
    )
    .get() as { total: number; ultimos7Dias: number; promedioPuntaje: number }
  return { total: Number(r.total), ultimos7Dias: Number(r.ultimos7Dias), promedioPuntaje: Number(r.promedioPuntaje) }
}
