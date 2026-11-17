CREATE TABLE IF NOT EXISTS diagnosticos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creado TEXT NOT NULL DEFAULT (datetime('now')),
  municipio TEXT NOT NULL,
  poblacion INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  puntaje INTEGER NOT NULL,
  nivel TEXT NOT NULL,
  respuestas TEXT NOT NULL
);
