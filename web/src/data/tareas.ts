export interface Tarea {
  id: string
  titulo: string
  estudiante: string
  supervisor: string
  puntos: number // suma al puntaje de madurez
}

// 5 tareas = +23 puntos: 38 -> 61
export const TAREAS: Tarea[] = [
  { id: 't1', titulo: 'Eliminar columnas innecesarias del Excel de beneficiarios', estudiante: 'Lucía M.', supervisor: 'Ing. R. Paz', puntos: 5 },
  { id: 't2', titulo: 'Mover el archivo a un espacio con acceso restringido', estudiante: 'Tomás G.', supervisor: 'Ing. R. Paz', puntos: 5 },
  { id: 't3', titulo: 'Activar MFA en las cuentas del personal y proveedores', estudiante: 'Camila S.', supervisor: 'Lic. A. Ferreyra', puntos: 6 },
  { id: 't4', titulo: 'Probar una restauración de copias de seguridad', estudiante: 'Joaquín R.', supervisor: 'Lic. A. Ferreyra', puntos: 4 },
  { id: 't5', titulo: 'Conectar correo, accesos y servidores al SOC compartido', estudiante: 'Valentina D.', supervisor: 'Ing. R. Paz', puntos: 3 },
]

export const QUIZ = [
  { q: 'Recibís un mail urgente de "Tesorería" pidiendo tu clave. ¿Qué hacés?', op: ['Respondo con mi clave', 'No respondo y lo reporto al referente', 'Lo reenvío a mis compañeros'], ok: 1 },
  { q: 'El link del mail muestra "munic1pal-pagos.com". ¿Es confiable?', op: ['Sí, parece el sitio oficial', 'No, el dominio está adulterado', 'Depende del logo'], ok: 1 },
  { q: '¿Qué te protege aunque alguien robe tu contraseña?', op: ['Cambiarla cada día', 'MFA (segundo factor)', 'Nada'], ok: 1 },
]
