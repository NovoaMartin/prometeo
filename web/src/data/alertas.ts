export interface Alerta {
  id: string
  titulo: string
  severidad: 'critica' | 'alta' | 'media' | 'baja'
  municipio: string
  hora: string
  origen: string
  usuario: string // seudonimizado
}

export const ALERTA_CRITICA: Alerta = {
  id: 'a-001',
  titulo: 'Acceso masivo a carpetas desde cuenta de proveedor sin MFA',
  severidad: 'critica',
  municipio: 'Villa Ejemplo',
  hora: '22:40',
  origen: '203.0.113.45',
  usuario: 'Usuario #A3F9',
}

export const ALERTAS_MENORES: Alerta[] = [
  { id: 'a-002', titulo: '5 intentos fallidos de login en el correo', severidad: 'media', municipio: 'Villa Ejemplo', hora: '19:12', origen: '198.51.100.7', usuario: 'Usuario #C21B' },
  { id: 'a-003', titulo: 'Servidor de archivos sin parches críticos', severidad: 'alta', municipio: 'Villa Ejemplo', hora: '14:03', origen: 'interno', usuario: 'Usuario #—' },
  { id: 'a-004', titulo: 'Nuevo dispositivo en cuenta de Tesorería', severidad: 'baja', municipio: 'Villa Ejemplo', hora: '09:55', origen: '198.51.100.22', usuario: 'Usuario #F70E' },
]

// Cola de otros municipios (vista SOC, datos seudonimizados)
export const COLA_SOC: Alerta[] = [
  ALERTA_CRITICA,
  { id: 'b-101', titulo: 'Escaneo de puertos desde IP externa', severidad: 'media', municipio: 'San Marcos', hora: '21:58', origen: '192.0.2.18', usuario: 'Usuario #D4A1' },
  { id: 'b-102', titulo: 'Intento de acceso con dominio de engaño', severidad: 'alta', municipio: 'Río Claro', hora: '21:15', origen: '203.0.113.45', usuario: 'Usuario #8B2C' },
  { id: 'b-103', titulo: 'Descarga masiva de planillas', severidad: 'alta', municipio: 'Las Palmas', hora: '20:41', origen: 'interno', usuario: 'Usuario #19EE' },
  { id: 'b-104', titulo: 'Antivirus desactivado en 2 equipos', severidad: 'baja', municipio: 'Villa Ejemplo', hora: '18:30', origen: 'interno', usuario: 'Usuario #—' },
]

export const TIMELINE = [
  { t: '22:40', txt: 'Login con cuenta de proveedor (sin MFA) desde IP 203.0.113.45' },
  { t: '22:41', txt: 'Recorrido masivo de carpetas compartidas (1.240 archivos en 3 min)' },
  { t: '22:43', txt: 'Wazuh dispara alerta crítica y notifica al SOC' },
  { t: '22:45', txt: 'El analista de guardia revisa el evento y llama al referente' },
]

export const CHECKS = [
  { id: 'c1', txt: 'Llamar al referente municipal', min: 4 },
  { id: 'c2', txt: 'Deshabilitar la cuenta del proveedor', min: 9 },
  { id: 'c3', txt: 'Cerrar todas las sesiones activas', min: 7 },
  { id: 'c4', txt: 'Revisar a qué carpetas se accedió', min: 5 },
]

export const VULNERABILIDADES = [
  { id: 'v1', nombre: 'Servidor de archivos sin parche crítico (SMB)', sev: 'Crítica' },
  { id: 'v2', nombre: 'Panel de administración expuesto a Internet', sev: 'Alta' },
  { id: 'v3', nombre: 'Certificado del portal de trámites por vencer', sev: 'Media' },
  { id: 'v4', nombre: 'Versión antigua de PHP en el sitio web', sev: 'Media' },
  { id: 'v5', nombre: 'Cabeceras de seguridad ausentes', sev: 'Baja' },
]

export const INDICADORES = [
  { tipo: 'Dominio', valor: 'munic1pal-pagos.com' },
  { tipo: 'IP', valor: '203.0.113.45' },
]

export const RED_MUNICIPIOS = [
  { nombre: 'Villa Ejemplo', x: 50, y: 50, bloqueo: false },
  { nombre: 'San Marcos', x: 18, y: 28, bloqueo: true },
  { nombre: 'Río Claro', x: 80, y: 25, bloqueo: true },
  { nombre: 'Las Palmas', x: 22, y: 75, bloqueo: false },
  { nombre: 'El Salto', x: 78, y: 72, bloqueo: false },
  { nombre: 'Monte Verde', x: 50, y: 14, bloqueo: false },
]
