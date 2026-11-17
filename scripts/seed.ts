// Genera SQL de datos de ejemplo (reproducible) para D1. Uso: node scripts/seed.ts > .seed.sql
// Todos los datos son ficticios. Las IPs son de rangos de documentación (RFC 5737).
import { pbkdf2Sync } from 'node:crypto'
import { PREGUNTAS } from '../shared/preguntas.ts'
import { PLANTILLAS, TIPOS, ipAleatoria, seudonimo } from '../shared/plantillas.ts'

// ---------- utilidades ----------
function mulberry32(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const rnd = mulberry32(20261117)
const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1))
const pick = <T,>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)]
const NOW = Date.now()
const DAY = 86400000
const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 19).replace('T', ' ')
const q = (v: unknown) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`)
const out: string[] = []
const ins = (t: string, o: Record<string, unknown>) => out.push(`INSERT INTO ${t} (${Object.keys(o).join(', ')}) VALUES (${Object.values(o).map(q).join(', ')});`)
const hash = (pass: string, salt: string) => pbkdf2Sync(pass, salt, 100_000, 32, 'sha256').toString('hex')

const VAL: Record<string, number> = { no: 0, parcial: 0.5, si: 1 }
const NIVEL = ['no', 'parcial', 'si']
const puntaje = (r: Record<string, string>) => Math.round((PREGUNTAS.reduce((a, p) => a + VAL[r[p.id]], 0) / PREGUNTAS.length) * 100)
const nivel = (p: number) => (p < 40 ? 'Inicial' : p < 70 ? 'En desarrollo' : 'Gestionado')

// ---------- limpieza ----------
for (const t of ['bloqueos', 'indicadores', 'quiz_resultados', 'vulnerabilidades', 'alerta_eventos', 'alerta_pasos', 'alertas', 'inventario', 'tareas', 'diagnosticos', 'sesiones', 'usuarios', 'organizaciones', 'sqlite_sequence']) out.push(`DELETE FROM ${t};`)

// ---------- organizaciones ----------
interface Org { id: number; nombre: string; tipo: 'municipio' | 'ong'; poblacion: number; plan: string; total: number; mfa: number }
const ORGS: Org[] = [
  { id: 1, nombre: 'Villa Ejemplo', tipo: 'municipio', poblacion: 30000, plan: 'escudo', total: 48, mfa: 45 },
  { id: 2, nombre: 'San Marcos', tipo: 'municipio', poblacion: 18000, plan: 'escudo', total: 35, mfa: 24 },
  { id: 3, nombre: 'Río Claro', tipo: 'municipio', poblacion: 42000, plan: 'escudo', total: 80, mfa: 52 },
  { id: 4, nombre: 'Las Palmas', tipo: 'municipio', poblacion: 9500, plan: 'guardianes', total: 22, mfa: 9 },
  { id: 5, nombre: 'El Salto', tipo: 'municipio', poblacion: 65000, plan: 'escudo', total: 150, mfa: 124 },
  { id: 6, nombre: 'Escuela Técnica N°12', tipo: 'ong', poblacion: 900, plan: 'guardianes', total: 15, mfa: 4 },
  { id: 7, nombre: 'Club Social Unión', tipo: 'ong', poblacion: 600, plan: 'guardianes', total: 6, mfa: 1 },
]
for (const o of ORGS) ins('organizaciones', { id: o.id, nombre: o.nombre, tipo: o.tipo, poblacion: o.poblacion, plan: o.plan, cuentas_total: o.total, cuentas_mfa: o.mfa, creado: fmt(NOW - 200 * DAY) })

// ---------- usuarios ----------
const USERS = [
  [1, 1, 'referente@villaejemplo.demo', 'María Gómez', 'referente', 1], [2, 1, 'intendente@villaejemplo.demo', 'Carlos Ruiz', 'intendente', 1],
  [3, 2, 'referente@sanmarcos.demo', 'Laura Benítez', 'referente', 1], [4, 3, 'referente@rioclaro.demo', 'Diego Sosa', 'referente', 0],
  [5, 4, 'referente@laspalmas.demo', 'Ana Luna', 'referente', 0], [6, 5, 'referente@elsalto.demo', 'Pablo Ortiz', 'referente', 0],
  [7, 6, 'referente@escuela12.demo', 'Marta Quiroga', 'referente', 1], [8, 7, 'referente@clubunion.demo', 'Raúl Díaz', 'referente', 0],
  [9, null, 'analista@red.demo', 'Sofía Páez', 'analista', 1],
  [10, null, 'guardian1@red.demo', 'Lucía Méndez', 'guardian', 1], [11, null, 'guardian2@red.demo', 'Tomás Giménez', 'guardian', 0],
  [12, null, 'guardian3@red.demo', 'Camila Suárez', 'guardian', 0], [13, null, 'guardian4@red.demo', 'Joaquín Rojas', 'guardian', 0],
] as const
for (const [id, org, email, nombre, rol, demo] of USERS) {
  const salt = Array.from({ length: 16 }, () => ri(0, 255).toString(16).padStart(2, '0')).join('')
  ins('usuarios', { id, org_id: org, email, nombre, rol, pass_hash: hash('demo1234', salt), salt, es_demo: demo, creado: fmt(NOW - 190 * DAY) })
}
const ANALISTA = 9
const GUARDIANES = [10, 11, 12, 13]
const SUPERVISORES = ['Ing. R. Paz', 'Lic. A. Ferreyra']
const REFERENTE_DE: Record<number, number> = { 1: 1, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8 }

// ---------- diagnósticos, tareas ----------
const PRESET: Record<string, string> = { q1: 'parcial', q2: 'no', q3: 'no', q4: 'no', q5: 'si', q6: 'no', q7: 'parcial', q8: 'si', q9: 'no', q10: 'parcial', q11: 'no', q12: 'si' }
const VILLA_PASOS: string[][] = [['q4=si', 'q3=parcial'], ['q1=si', 'q6=si'], ['q3=si', 'q2=parcial']]
let tareaId = 1
for (const o of ORGS) {
  let r: Record<string, string>
  let fechas: number[]
  const pasos: string[][] = []
  if (o.id === 1) {
    r = { ...PRESET }
    fechas = [150, 90, 45, 10]
    pasos.push(...VILLA_PASOS)
  } else {
    r = {}
    for (const p of PREGUNTAS) r[p.id] = pick(o.tipo === 'ong' ? ['no', 'no', 'parcial'] : ['no', 'parcial', 'parcial', 'si'])
    const n = o.tipo === 'ong' ? 2 : 4
    fechas = [170, 110, 60, 14].slice(0, n).map((d) => d + ri(-6, 6))
    for (let i = 1; i < n; i++) {
      const cand = PREGUNTAS.filter((p) => r[p.id] !== 'si')
      pasos.push(Array.from({ length: ri(1, 3) }, () => { const p = pick(cand); return `${p.id}=${NIVEL[NIVEL.indexOf(r[p.id]) + 1] ?? 'si'}` }))
    }
  }
  const primero = { ...r }
  const cuandoSi: Record<string, number> = {}
  const emitir = (idx: number) => { const p = puntaje(r); ins('diagnosticos', { municipio: o.nombre, poblacion: o.poblacion, tipo: o.tipo, puntaje: p, nivel: nivel(p), respuestas: JSON.stringify(r), org_id: o.id, creado: fmt(NOW - fechas[idx] * DAY + ri(8, 17) * 3600000) }) }
  emitir(0)
  for (let i = 1; i < fechas.length; i++) {
    for (const s of pasos[i - 1]) {
      const [id, v] = s.split('=')
      if (VAL[v] > VAL[r[id]]) { r[id] = v; if (v === 'si') cuandoSi[id] = fechas[i] }
    }
    emitir(i)
  }
  // tareas hechas (preguntas que llegaron a "sí") y pendientes (las más importantes que siguen fallando)
  let g = 0
  for (const p of PREGUNTAS) {
    if (primero[p.id] !== 'si' && r[p.id] === 'si' && cuandoSi[p.id]) {
      ins('tareas', { id: tareaId++, org_id: o.id, titulo: p.accion, area: p.area, impacto: p.impacto, esfuerzo: p.esfuerzo, estado: 'hecha', asignado_a: GUARDIANES[g++ % 4], supervisor: SUPERVISORES[g % 2], pregunta_id: p.id, creado: fmt(NOW - (cuandoSi[p.id] + 12) * DAY), completada: fmt(NOW - (cuandoSi[p.id] + 1) * DAY) })
    }
  }
  const faltan = PREGUNTAS.filter((p) => r[p.id] !== 'si').sort((a, b) => b.impacto - a.impacto || a.esfuerzo - b.esfuerzo).slice(0, 5)
  faltan.forEach((p, i) => {
    const asignada = i < 3
    ins('tareas', { id: tareaId++, org_id: o.id, titulo: p.accion, area: p.area, impacto: p.impacto, esfuerzo: p.esfuerzo, estado: asignada && i === 0 ? 'en_curso' : 'pendiente', asignado_a: asignada ? GUARDIANES[g++ % 4] : null, supervisor: asignada ? SUPERVISORES[g % 2] : null, pregunta_id: p.id, creado: fmt(NOW - ri(2, 9) * DAY) })
  })
}

// ---------- inventario ----------
const INV_MUNI = [
  ['Planilla de beneficiarios de programas sociales', 'Desarrollo Social', 'salud', 4000, 'Servidor de archivos / Desarrollo Social'],
  ['Padrón de contribuyentes', 'Rentas', 'fiscal', 12000, 'Sistema de tasas'],
  ['Historias clínicas del centro de salud', 'Salud', 'salud', 6500, 'Sistema de salud'],
  ['Legajos del personal municipal', 'Recursos Humanos', 'personal', 320, 'Servidor de archivos / RRHH'],
  ['Registro de subsidios y becas', 'Desarrollo Social', 'social', 2100, 'Planilla compartida'],
] as const
const INV_ONG = [['Listado de alumnos y tutores', 'Secretaría', 'personal', 420, 'Planilla en la nube'], ['Registro de socios y cuotas', 'Tesorería', 'fiscal', 260, 'Planilla en la nube']] as const
for (const o of ORGS) {
  const items = o.tipo === 'ong' ? INV_ONG : INV_MUNI
  items.forEach(([nombre, area, tipo, titulares, ub], i) => {
    const escala = o.tipo === 'ong' ? 1 : Math.max(0.2, o.poblacion / 30000)
    ins('inventario', { org_id: o.id, nombre, area_municipal: area, tipo_dato: tipo, titulares: Math.round(titulares * (o.id === 1 ? 1 : escala)), ubicacion: ub, acceso_restringido: o.id === 1 ? (i === 0 ? 1 : i % 2) : ri(0, 1) })
  })
}

// ---------- vulnerabilidades ----------
const VULNS = [['Servidor de archivos sin parche crítico (SMB)', 'Servidor de archivos', 'critica'], ['Panel de administración expuesto a Internet', 'Router / firewall', 'alta'], ['Certificado del portal de trámites por vencer', 'Portal de trámites', 'media'], ['Versión antigua de PHP en el sitio web', 'Sitio web municipal', 'media'], ['Cabeceras de seguridad ausentes', 'Sitio web municipal', 'baja'], ['Windows 7 sin soporte en un equipo', 'PC administrativa', 'alta']] as const
for (const o of ORGS.filter((x) => x.plan === 'escudo')) {
  for (const [nombre, activo, sev] of VULNS.filter(() => rnd() > 0.3)) {
    const mit = rnd() > 0.55
    ins('vulnerabilidades', { org_id: o.id, nombre, activo, severidad: sev, estado: mit ? 'mitigada' : 'abierta', detectada: fmt(NOW - ri(20, 80) * DAY), mitigada: mit ? fmt(NOW - ri(1, 18) * DAY) : null })
  }
}

// ---------- alertas ----------
let alertaId = 1, pasoId = 1
function alerta(o: Org, t: ReturnType<typeof Object>, f: { tipo: string; creada: number; estado: string; titulo?: string; ip?: string; user?: string; minutos?: number; hechos?: number; eventos?: [number, string, string][] }) {
  const p = PLANTILLAS[f.tipo as keyof typeof PLANTILLAS]
  const id = alertaId++
  const cerrada = ['contenida', 'cerrada'].includes(f.estado)
  const minutos = f.minutos ?? ri(8, 55)
  ins('alertas', { id, org_id: o.id, tipo: f.tipo, titulo: f.titulo ?? p.titulo, descripcion: p.descripcion, severidad: p.severidad, estado: f.estado, ip_origen: f.ip ?? ipAleatoria(rnd), usuario_seudonimo: f.user ?? seudonimo(rnd), asignada_a: f.estado === 'nueva' ? null : ANALISTA, creada: fmt(f.creada), contenida_en: cerrada ? fmt(f.creada + minutos * 60000) : null, origen: 'seed' })
  const hechos = cerrada ? p.pasos.length : f.hechos ?? 0
  p.pasos.forEach((txt, i) => ins('alerta_pasos', { id: pasoId++, alerta_id: id, orden: i + 1, texto: txt, hecho: i < hechos ? 1 : 0, hecho_por: i < hechos ? ANALISTA : null, hecho_en: i < hechos ? fmt(f.creada + Math.round(((i + 1) * minutos) / p.pasos.length) * 60000) : null }))
  const ev = f.eventos ?? [[0, 'Sistema', 'Alerta detectada por el SOC compartido']]
  if (!f.eventos) {
    if (f.estado !== 'nueva') ev.push([3, 'Sofía Páez', `Asignada a Sofía Páez`])
    if (f.estado === 'falso_positivo') ev.push([20, 'Sofía Páez', 'Estado: en_investigacion → falso_positivo'])
    if (cerrada) ev.push([minutos, 'Sofía Páez', 'Incidente contenido (checklist completa)'])
  }
  for (const [min, autor, texto] of ev) ins('alerta_eventos', { alerta_id: id, ts: fmt(f.creada + min * 60000), autor, texto })
  return id
}
// El caso del PDF: martes 22:40, cuenta de proveedor sin MFA en Villa Ejemplo
const martes = new Date(NOW - 16 * DAY); while (martes.getUTCDay() !== 2) martes.setUTCDate(martes.getUTCDate() - 1); martes.setUTCHours(22, 40, 0, 0)
const MARTES = martes.getTime()
alerta(ORGS[0], {}, {
  tipo: 'acceso_masivo', creada: MARTES, estado: 'cerrada', titulo: 'Acceso masivo a carpetas desde cuenta de proveedor sin MFA', ip: '203.0.113.45', user: 'Usuario #A3F9', minutos: 25,
  eventos: [[0, 'Sistema', 'Login con cuenta de proveedor (sin MFA) desde 203.0.113.45'], [1, 'Sistema', 'Recorrido masivo de carpetas compartidas (1.240 archivos en 3 min)'], [3, 'Sistema', 'Alerta crítica detectada por el SOC compartido'], [5, 'Sofía Páez', 'Asignada a Sofía Páez; llamada al referente municipal'], [14, 'Sofía Páez', 'Paso completado: Deshabilitar la cuenta comprometida'], [20, 'Sofía Páez', 'Paso completado: Cerrar todas las sesiones activas'], [25, 'Sofía Páez', 'Incidente contenido (checklist completa)'], [60, 'María Gómez', 'Los registros muestran que el atacante llegó a la carpeta anterior, pero el Excel sensible ya no estaba ahí. Consulta enviada al área legal.']],
})
for (const o of ORGS.filter((x) => x.plan === 'escudo')) {
  const n = o.id === 1 ? 11 : ri(8, 11)
  const edades = Array.from({ length: n }, () => rnd() * 88 * DAY).sort((a, b) => a - b) // ms atrás, más recientes primero
  edades.forEach((e, i) => {
    const hora = rnd() < 0.4 ? ri(20, 23) : ri(8, 19)
    const d = new Date(NOW - e); d.setUTCHours(hora, ri(0, 59), ri(0, 59))
    const creada = Math.min(d.getTime(), NOW - 20 * 60000)
    const reciente = i < 2
    const estado = reciente ? pick(['nueva', 'en_investigacion', 'en_investigacion']) : e < 14 * DAY ? pick(['contenida', 'cerrada', 'cerrada']) : rnd() < 0.18 ? 'falso_positivo' : pick(['cerrada', 'cerrada', 'contenida'])
    alerta(o, {}, { tipo: pick(TIPOS), creada, estado, hechos: estado === 'en_investigacion' ? ri(1, 2) : 0 })
  })
}

// ---------- red de amenazas compartidas ----------
const INDS = [[1, 'ip', '203.0.113.45', 'IP de origen del acceso masivo en Villa Ejemplo', 1, 1], [2, 'dominio', 'munic1pal-pagos.com', 'Dominio de engaño usado en phishing de Tesorería', 1, 1], [3, 'ip', '198.51.100.7', 'Fuerza bruta contra correo institucional', 2, null], [4, 'dominio', 'tesoreria-muni.net', 'Dominio adulterado que simula a Tesorería', 2, null]] as const
for (const [id, tipo, valor, desc, org, alerta_id] of INDS) ins('indicadores', { id, tipo, valor, descripcion: desc, org_origen: org, alerta_id, creado: fmt(MARTES + (id <= 2 ? 40 : 7 * 1440) * 60000) })
for (const [i, o] of [[1, 2], [1, 3], [2, 2], [2, 3], [3, 1], [3, 3], [4, 1], [4, 5]]) ins('bloqueos', { indicador_id: i, org_id: o, creado: fmt(MARTES + 3 * 3600000) })

// ---------- capacitación ----------
for (const o of ORGS.filter((x) => x.tipo === 'municipio' || x.id === 6)) {
  const u = REFERENTE_DE[o.id]
  for (let i = 0; i < ri(3, 6); i++) { const aciertos = Math.min(3, ri(1, 3) + (i > 2 ? 1 : 0)); ins('quiz_resultados', { usuario_id: u, org_id: o.id, aciertos, total: 3, fecha: fmt(NOW - ri(2, 120) * DAY) }) }
}
ins('quiz_resultados', { usuario_id: 2, org_id: 1, aciertos: 3, total: 3, fecha: fmt(NOW - 12 * DAY) })

console.log(out.join('\n'))
