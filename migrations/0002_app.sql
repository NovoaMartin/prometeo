CREATE TABLE organizaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('municipio','ong')),
  poblacion INTEGER NOT NULL DEFAULT 0,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','guardianes','escudo')),
  cuentas_total INTEGER NOT NULL DEFAULT 0,
  cuentas_mfa INTEGER NOT NULL DEFAULT 0,
  creado TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER REFERENCES organizaciones(id),
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('referente','intendente','analista','guardian')),
  pass_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  es_demo INTEGER NOT NULL DEFAULT 0,
  creado TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sesiones (
  id TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira TEXT NOT NULL
);

ALTER TABLE diagnosticos ADD COLUMN org_id INTEGER REFERENCES organizaciones(id);
ALTER TABLE diagnosticos ADD COLUMN email_contacto TEXT;
CREATE INDEX idx_diag_org ON diagnosticos(org_id, creado);

CREATE TABLE tareas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL REFERENCES organizaciones(id),
  titulo TEXT NOT NULL,
  area TEXT NOT NULL,
  impacto INTEGER NOT NULL DEFAULT 2,
  esfuerzo INTEGER NOT NULL DEFAULT 2,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_curso','hecha')),
  asignado_a INTEGER REFERENCES usuarios(id),
  supervisor TEXT,
  pregunta_id TEXT,
  creado TEXT NOT NULL DEFAULT (datetime('now')),
  completada TEXT
);
CREATE INDEX idx_tareas_org ON tareas(org_id);

CREATE TABLE inventario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL REFERENCES organizaciones(id),
  nombre TEXT NOT NULL,
  area_municipal TEXT NOT NULL,
  tipo_dato TEXT NOT NULL CHECK (tipo_dato IN ('salud','fiscal','social','personal','otro')),
  titulares INTEGER NOT NULL DEFAULT 0,
  ubicacion TEXT NOT NULL DEFAULT '',
  acceso_restringido INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE alertas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL REFERENCES organizaciones(id),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  severidad TEXT NOT NULL CHECK (severidad IN ('critica','alta','media','baja')),
  estado TEXT NOT NULL DEFAULT 'nueva' CHECK (estado IN ('nueva','en_investigacion','contenida','cerrada','falso_positivo')),
  ip_origen TEXT,
  usuario_seudonimo TEXT,
  asignada_a INTEGER REFERENCES usuarios(id),
  creada TEXT NOT NULL DEFAULT (datetime('now')),
  contenida_en TEXT,
  origen TEXT NOT NULL DEFAULT 'manual' CHECK (origen IN ('seed','manual','generador'))
);
CREATE INDEX idx_alertas_org ON alertas(org_id, creada);

CREATE TABLE alerta_pasos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alerta_id INTEGER NOT NULL REFERENCES alertas(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL,
  texto TEXT NOT NULL,
  hecho INTEGER NOT NULL DEFAULT 0,
  hecho_por INTEGER REFERENCES usuarios(id),
  hecho_en TEXT
);

CREATE TABLE alerta_eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alerta_id INTEGER NOT NULL REFERENCES alertas(id) ON DELETE CASCADE,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  autor TEXT NOT NULL,
  texto TEXT NOT NULL
);

CREATE TABLE indicadores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK (tipo IN ('ip','dominio')),
  valor TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL DEFAULT '',
  org_origen INTEGER REFERENCES organizaciones(id),
  alerta_id INTEGER REFERENCES alertas(id),
  creado TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE bloqueos (
  indicador_id INTEGER NOT NULL REFERENCES indicadores(id) ON DELETE CASCADE,
  org_id INTEGER NOT NULL REFERENCES organizaciones(id),
  creado TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (indicador_id, org_id)
);

CREATE TABLE vulnerabilidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL REFERENCES organizaciones(id),
  nombre TEXT NOT NULL,
  activo TEXT NOT NULL,
  severidad TEXT NOT NULL CHECK (severidad IN ('critica','alta','media','baja')),
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','mitigada')),
  detectada TEXT NOT NULL DEFAULT (datetime('now')),
  mitigada TEXT
);

CREATE TABLE quiz_resultados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  org_id INTEGER NOT NULL REFERENCES organizaciones(id),
  aciertos INTEGER NOT NULL,
  total INTEGER NOT NULL,
  fecha TEXT NOT NULL DEFAULT (datetime('now'))
);
