export const MUNICIPIO = {
  nombre: 'Villa Ejemplo',
  poblacion: 30000,
  personalSistemas: 1,
  cuentas: 48,
  beneficiarios: 4000,
  mfaInicial: 42,
}

export type Rol = 'referente' | 'intendente' | 'analista' | 'ong'

export const ROLES: Record<Rol, { nombre: string; descripcion: string; rutas: string[] }> = {
  referente: {
    nombre: 'Referente municipal',
    descripcion: 'Usuario final · Responsable de Sistemas',
    rutas: ['/', '/diagnostico', '/panel', '/guardianes', '/red'],
  },
  intendente: {
    nombre: 'Intendente / Secretaría',
    descripcion: 'Cliente pagador (B2G)',
    rutas: ['/', '/panel', '/reporte', '/planes'],
  },
  analista: {
    nombre: 'Analista SOC',
    descripcion: 'Estudiante supervisado',
    rutas: ['/', '/soc', '/panel', '/red'],
  },
  ong: {
    nombre: 'Organización social',
    descripcion: 'Escuela, club u ONG',
    rutas: ['/', '/diagnostico', '/guardianes'],
  },
}

export const RUTA_LABEL: Record<string, string> = {
  '/': 'Inicio',
  '/diagnostico': 'Autodiagnóstico',
  '/panel': 'Panel',
  '/guardianes': 'Guardianes',
  '/red': 'Red',
  '/soc': 'Consola SOC',
  '/reporte': 'Reporte',
  '/planes': 'Planes',
}
