export type Perfil = 'referente' | 'intendente' | 'analista' | 'ong'
type Rol = Perfil

type Intent = 'explicar_alerta' | 'primeros_pasos' | 'notificar' | 'que_es_mfa' | 'mi_puntaje' | 'cuanto_cuesta' | 'default'

const T: Record<Intent, Record<Rol, string>> = {
  explicar_alerta: {
    referente: 'Alguien entró con la cuenta de un proveedor que no tenía verificación en dos pasos y está abriendo carpetas una tras otra a gran velocidad. Es como si copiaran una llave y recorrieran todas las oficinas. Es grave porque en esas carpetas puede haber datos de ciudadanos. Conviene bloquear esa cuenta ya.',
    intendente: 'Se detectó un acceso no autorizado con credenciales de un proveedor. El SOC ya está actuando y el riesgo se contiene en minutos. Los datos sensibles de los 4.000 beneficiarios ya estaban en un espacio restringido, así que el impacto es bajo. Quedará evidencia para el reporte.',
    analista: 'Login exitoso con cuenta de servicio de proveedor sin MFA desde 203.0.113.45 (no habitual). 1.240 lecturas de archivos en 3 min: patrón de enumeración masiva. Severidad crítica. Pivotear por IP en MISP, aislar la cuenta y revisar los logs de acceso a las carpetas.',
    ong: 'Alguien usó una cuenta con una clave robada para abrir muchos archivos. Activar la verificación en dos pasos evita que esto pase.',
  },
  primeros_pasos: {
    referente: '1) Llamá al analista de guardia si todavía no lo hiciste. 2) Deshabilitá la cuenta del proveedor. 3) Cerrá todas sus sesiones. 4) Revisá qué carpetas se abrieron. Podés ir tildando cada paso en la lista.',
    intendente: 'El equipo ya está ejecutando el protocolo: aislar la cuenta, cerrar sesiones y revisar el alcance. Usted no necesita hacer nada técnico; solo decidir, con el área legal, si hay que notificar.',
    analista: 'Contención: 1) disable de la cuenta en el IdP, 2) revocar tokens y sesiones, 3) bloquear 203.0.113.45 en el firewall, 4) revisar el log de accesos por carpeta, 5) publicar IOC (IP + dominio) en MISP.',
    ong: 'Pedí ayuda a tu Guardián Digital, cambiá la clave y activá la verificación en dos pasos.',
  },
  notificar: {
    referente: 'Eso lo define el área legal. Reuní los registros del incidente (línea de tiempo y checklist) y consultalo; el reporte de cumplimiento te sirve como evidencia.',
    intendente: 'Si hubo acceso a datos personales puede corresponder notificar; si no, debe documentarse igual. El reporte de cumplimiento reúne la evidencia para su área legal.',
    analista: 'Determiná el alcance con los logs (qué se accedió y si hubo exfiltración), documentá la línea de tiempo y pasalo al área legal del municipio.',
    ong: 'Consultá con tu referente. Guardá las capturas de lo ocurrido.',
  },
  que_es_mfa: {
    referente: 'MFA es un segundo paso al ingresar, como un código en el celular. Aunque alguien robe la contraseña, no puede entrar sin ese código. Es lo más barato y efectivo que podés activar.',
    intendente: 'MFA es una barrera adicional de acceso. Reduce drásticamente el riesgo de robo de cuentas con un costo casi nulo.',
    analista: 'MFA (TOTP/FIDO2) mitiga credential stuffing y reuse de credenciales. Priorizar cuentas de proveedores y administradores.',
    ong: 'Es un código extra en tu celular para entrar. Ayuda mucho a que no te roben la cuenta.',
  },
  mi_puntaje: {
    referente: 'Tu puntaje refleja cuántos controles básicos cumplís. Empezá por las acciones de impacto alto y esfuerzo bajo: MFA y mover los archivos sensibles. Los Guardianes te ayudan sin costo.',
    intendente: 'El puntaje mide la madurez de seguridad del municipio. Sirve como indicador para justificar la inversión y mostrar mejora continua.',
    analista: 'El puntaje pondera 12 controles en 6 áreas. Las brechas con mayor impacto y menor esfuerzo se priorizan primero.',
    ong: 'Tu puntaje muestra qué tan protegida está tu organización. Los Guardianes Digitales te acompañan gratis.',
  },
  cuanto_cuesta: {
    referente: 'El autodiagnóstico y el plan Free del asistente son gratis. El Escudo Municipal se paga mensual según la población: USD 700 hasta 20.000 hab., 1.400 hasta 50.000 y 2.500 hasta 100.000.',
    intendente: 'El abono es escalonado por población: USD 700, 1.400 o 2.500 por mes. Incluye monitoreo 24/7, respuesta guiada y evidencia de cumplimiento, sin armar un SOC propio.',
    analista: 'Modelo: abono B2G escalonado por población; las ONG se financian con patrocinios y subsidios.',
    ong: 'Para organizaciones sociales el nivel Guardianes Digitales es gratuito o subsidiado.',
  },
  default: {
    referente: 'Puedo explicarte la alerta, decirte qué hacer primero, qué es MFA o cuánto cuesta el servicio. Probá con alguna de las preguntas sugeridas.',
    intendente: 'Puedo resumirle el estado de seguridad, el costo del servicio o la evidencia de cumplimiento. Probá con las preguntas sugeridas.',
    analista: 'Puedo ayudarte a interpretar alertas, sugerir contención y pivotes de investigación. Probá con las preguntas sugeridas.',
    ong: 'Puedo ayudarte con tu puntaje, qué es MFA y qué pasos seguir. Probá con las preguntas sugeridas.',
  },
}

export interface CtxAlerta { simple: string; tecnica: string; pasosPendientes: string[] }

export function detectarIntencion(texto: string): Intent {
  const t = texto.toLowerCase()
  if (/explic|alerta|grave|pasó|paso/.test(t)) return 'explicar_alerta'
  if (/primero|hago|pasos|conten/.test(t)) return 'primeros_pasos'
  if (/notific|legal|denunci/.test(t)) return 'notificar'
  if (/mfa|dos pasos|verificaci/.test(t)) return 'que_es_mfa'
  if (/puntaje|madurez|diagn/.test(t)) return 'mi_puntaje'
  if (/cuesta|precio|plan|cuánto|cuanto/.test(t)) return 'cuanto_cuesta'
  return 'default'
}

// Con la alerta real en pantalla, explicación y pasos salen de sus datos
export function responderGuion(texto: string, rol: Rol, alerta?: CtxAlerta) {
  const i = detectarIntencion(texto)
  if (alerta && i === 'explicar_alerta') return rol === 'analista' ? alerta.tecnica : alerta.simple
  if (alerta && i === 'primeros_pasos') {
    return alerta.pasosPendientes.length ? 'Pasos pendientes de la checklist:\n' + alerta.pasosPendientes.map((p, n) => `${n + 1}) ${p}`).join('\n') : 'La checklist está completa. Registrá el cierre y revisá el reporte.'
  }
  return T[i][rol]
}

export const CHIPS: Record<string, string[]> = {
  alerta: ['Explicame esta alerta', '¿Qué hago primero?', '¿Tengo que notificar?'],
  diagnostico: ['¿Qué es MFA?', '¿Qué significa mi puntaje?', '¿Cuánto cuesta?'],
  default: ['¿Qué significa mi puntaje?', '¿Qué es MFA?', '¿Cuánto cuesta?'],
}
