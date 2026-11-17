export type TipoAlerta = 'acceso_masivo' | 'fuerza_bruta' | 'phishing' | 'malware' | 'escaneo' | 'exfiltracion'
export type Severidad = 'critica' | 'alta' | 'media' | 'baja'

export interface Plantilla {
  tipo: TipoAlerta
  nombre: string
  titulo: string
  descripcion: string
  severidad: Severidad
  pasos: string[]
  simple: string // explicación para usuarios no técnicos
  tecnica: string // explicación para analistas
}

export const PLANTILLAS: Record<TipoAlerta, Plantilla> = {
  acceso_masivo: {
    tipo: 'acceso_masivo', nombre: 'Acceso masivo a carpetas',
    titulo: 'Acceso masivo a carpetas desde cuenta sin MFA',
    descripcion: 'Una cuenta sin verificación en dos pasos inició sesión desde una IP no habitual y recorrió carpetas compartidas de forma masiva.',
    severidad: 'critica',
    pasos: ['Llamar al referente municipal', 'Deshabilitar la cuenta comprometida', 'Cerrar todas las sesiones activas', 'Revisar a qué carpetas se accedió', 'Evaluar con el área legal si corresponde notificar'],
    simple: 'Alguien entró con una cuenta que no tenía verificación en dos pasos y está abriendo muchas carpetas muy rápido. Es como si copiaran una llave y recorrieran todas las oficinas. Conviene bloquear esa cuenta ya.',
    tecnica: 'Login exitoso sin MFA desde IP no habitual seguido de enumeración masiva de archivos (cientos de lecturas en pocos minutos). Aislar la cuenta, revocar tokens/sesiones, bloquear la IP y revisar los logs de acceso por carpeta.',
  },
  fuerza_bruta: {
    tipo: 'fuerza_bruta', nombre: 'Intentos de login fallidos',
    titulo: 'Múltiples intentos fallidos de inicio de sesión',
    descripcion: 'Se detectaron decenas de intentos fallidos de login contra el correo institucional desde una misma IP.',
    severidad: 'media',
    pasos: ['Verificar si algún intento tuvo éxito', 'Bloquear la IP de origen', 'Forzar cambio de contraseña en las cuentas apuntadas', 'Activar MFA en las cuentas sin protección'],
    simple: 'Alguien está probando contraseñas una y otra vez para entrar al correo. Si las cuentas tienen verificación en dos pasos, el riesgo baja mucho.',
    tecnica: 'Patrón de password spraying / fuerza bruta: alto volumen de 4xx en autenticación desde una IP. Revisar éxitos posteriores al ráfaga, aplicar bloqueo por IP y rate limiting.',
  },
  phishing: {
    tipo: 'phishing', nombre: 'Correo de phishing',
    titulo: 'Correo de phishing con enlace a dominio adulterado',
    descripcion: 'Varios empleados recibieron un correo que simula ser de Tesorería con un enlace a un dominio parecido al oficial.',
    severidad: 'alta',
    pasos: ['Identificar quién recibió y quién hizo clic', 'Eliminar el correo de todos los buzones', 'Cambiar contraseñas de quienes hicieron clic', 'Publicar el dominio en la red de amenazas', 'Avisar al personal'],
    simple: 'Llegó un mail falso que parece de Tesorería y pide datos. Hay que saber quién hizo clic, borrar el mail y cambiar las claves de esas personas.',
    tecnica: 'Campaña de phishing con dominio typosquatting. Rastrear destinatarios y clics en el gateway de correo, purgar mensajes, rotar credenciales y compartir IOC (dominio, remitente, URL).',
  },
  malware: {
    tipo: 'malware', nombre: 'Malware en equipo',
    titulo: 'Antivirus detectó malware en un equipo',
    descripcion: 'El antivirus detectó y puso en cuarentena un archivo malicioso en un equipo del área administrativa.',
    severidad: 'alta',
    pasos: ['Aislar el equipo de la red', 'Verificar que la cuarentena fue completa', 'Escanear el resto de equipos del área', 'Restaurar el equipo desde una copia limpia', 'Identificar cómo ingresó el archivo'],
    simple: 'Un programa dañino llegó a una computadora. El antivirus lo frenó, pero hay que desconectar el equipo y revisar que no se haya propagado.',
    tecnica: 'Detección de binario malicioso con cuarentena exitosa. Aislar host, buscar persistencia y movimiento lateral, escanear el segmento y determinar el vector de entrada.',
  },
  escaneo: {
    tipo: 'escaneo', nombre: 'Escaneo de puertos',
    titulo: 'Escaneo de puertos desde IP externa',
    descripcion: 'Una IP externa recorrió sistemáticamente puertos del servidor expuesto a Internet.',
    severidad: 'baja',
    pasos: ['Confirmar qué puertos están expuestos', 'Bloquear la IP en el firewall', 'Cerrar los servicios innecesarios'],
    simple: 'Alguien de afuera está "tocando las puertas" de nuestros sistemas para ver cuáles están abiertas. Conviene cerrar las que no se usan.',
    tecnica: 'Reconocimiento activo (port scan) contra el perímetro. Validar superficie expuesta, bloquear la fuente y reducir servicios publicados.',
  },
  exfiltracion: {
    tipo: 'exfiltracion', nombre: 'Descarga masiva de datos',
    titulo: 'Descarga masiva de planillas con datos personales',
    descripcion: 'Una cuenta descargó un volumen inusual de planillas con datos personales fuera del horario habitual.',
    severidad: 'critica',
    pasos: ['Suspender la cuenta y cerrar sesiones', 'Determinar qué archivos se descargaron', 'Evaluar si hubo datos personales sensibles', 'Consultar al área legal sobre notificación', 'Registrar el incidente en el reporte'],
    simple: 'Alguien se llevó muchas planillas con datos de personas fuera de horario. Hay que frenar la cuenta, ver qué se llevó y consultar con el área legal.',
    tecnica: 'Volumen anómalo de egress/descargas con datos personales fuera de horario. Contener la cuenta, reconstruir el alcance con logs y evaluar obligación de notificación.',
  },
}

export const TIPOS = Object.keys(PLANTILLAS) as TipoAlerta[]

// IPs de documentación (RFC 5737): no pertenecen a nadie real
export function ipAleatoria(rnd: () => number): string {
  const bloque = ['203.0.113', '198.51.100', '192.0.2'][Math.floor(rnd() * 3)]
  return `${bloque}.${1 + Math.floor(rnd() * 253)}`
}

export function seudonimo(rnd: () => number): string {
  return `Usuario #${Math.floor(rnd() * 0xffff).toString(16).toUpperCase().padStart(4, '0')}`
}
