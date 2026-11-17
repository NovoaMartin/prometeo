export type Respuesta = 'si' | 'parcial' | 'no'
export const VALOR: Record<Respuesta, number> = { si: 1, parcial: 0.5, no: 0 }

export const AREAS = ['Accesos y MFA', 'Datos sensibles', 'Copias de seguridad', 'Equipos', 'Personas', 'Respuesta'] as const
export type Area = (typeof AREAS)[number]

export interface Pregunta {
  id: string
  area: Area
  texto: string
  accion: string // qué hacer si falla
  impacto: 1 | 2 | 3
  esfuerzo: 1 | 2 | 3
}

export const PREGUNTAS: Pregunta[] = [
  { id: 'q1', area: 'Accesos y MFA', texto: '¿Las cuentas del personal tienen verificación en dos pasos (MFA)?', accion: 'Activar MFA en todas las cuentas del personal y proveedores', impacto: 3, esfuerzo: 1 },
  { id: 'q2', area: 'Accesos y MFA', texto: '¿Cada persona usa su propia contraseña (sin compartirlas)?', accion: 'Eliminar cuentas compartidas y usar un gestor de contraseñas', impacto: 2, esfuerzo: 2 },
  { id: 'q3', area: 'Datos sensibles', texto: '¿Tienen un inventario de dónde están los datos sensibles (salud, fiscales, sociales)?', accion: 'Armar el inventario de datos sensibles y eliminar columnas innecesarias', impacto: 3, esfuerzo: 2 },
  { id: 'q4', area: 'Datos sensibles', texto: '¿Las carpetas con datos sensibles tienen acceso restringido?', accion: 'Mover los archivos sensibles a un espacio con acceso restringido', impacto: 3, esfuerzo: 1 },
  { id: 'q5', area: 'Copias de seguridad', texto: '¿Se hacen copias de seguridad periódicas?', accion: 'Programar copias automáticas diarias', impacto: 2, esfuerzo: 2 },
  { id: 'q6', area: 'Copias de seguridad', texto: '¿Se probó alguna vez restaurar una copia?', accion: 'Probar una restauración completa y documentarla', impacto: 3, esfuerzo: 1 },
  { id: 'q7', area: 'Equipos', texto: '¿Los equipos y servidores están actualizados?', accion: 'Actualizar sistemas operativos y aplicar parches críticos', impacto: 2, esfuerzo: 3 },
  { id: 'q8', area: 'Equipos', texto: '¿Hay antivirus / EDR activo en todos los equipos?', accion: 'Desplegar antivirus o agente de monitoreo en todos los equipos', impacto: 2, esfuerzo: 2 },
  { id: 'q9', area: 'Personas', texto: '¿El personal recibió capacitación en seguridad este año?', accion: 'Capacitar al personal con los Guardianes Digitales', impacto: 2, esfuerzo: 2 },
  { id: 'q10', area: 'Personas', texto: '¿El personal sabe reconocer un correo de phishing?', accion: 'Hacer el mini quiz de phishing con todo el personal', impacto: 2, esfuerzo: 1 },
  { id: 'q11', area: 'Respuesta', texto: '¿Existe un protocolo escrito ante incidentes?', accion: 'Definir un protocolo básico de respuesta a incidentes', impacto: 3, esfuerzo: 2 },
  { id: 'q12', area: 'Respuesta', texto: '¿Saben a quién llamar fuera de horario si hay un incidente?', accion: 'Conectar el municipio al SOC compartido con guardia 24/7', impacto: 3, esfuerzo: 2 },
]

// Respuestas de "Villa Ejemplo": 3 sí + 3 parcial + 6 no => 4.5/12 => 38/100
export const PRESET_VILLA_EJEMPLO: Record<string, Respuesta> = {
  q1: 'parcial', q2: 'no', q3: 'no', q4: 'no', q5: 'si', q6: 'no',
  q7: 'parcial', q8: 'si', q9: 'no', q10: 'parcial', q11: 'no', q12: 'si',
}
