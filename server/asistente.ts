import { generateText } from 'ai'
import { createDeepSeek } from '@ai-sdk/deepseek'

export type Rol = 'referente' | 'intendente' | 'analista' | 'ong'
export interface Msg { role: 'user' | 'assistant'; content: string }

const ESTILO: Record<Rol, string> = {
  referente: 'Hablás con el Responsable de Sistemas de un municipio pequeño: una sola persona sin equipo de seguridad. Usá lenguaje simple, sin jerga, con analogías cotidianas, y pasos numerados y concretos.',
  intendente: 'Hablás con el Intendente o un secretario (cliente que paga, no técnico). Sé ejecutivo: impacto, riesgo, costo y evidencia de cumplimiento. Nada de jerga.',
  analista: 'Hablás con un analista SOC (estudiante supervisado). Podés ser técnico: IOCs, MITRE ATT&CK, contención, logs, pivotes en MISP.',
  ong: 'Hablás con una organización social (escuela, club, ONG) sin conocimientos técnicos. Lenguaje muy simple y pasos baratos o gratuitos.',
}

const CONTEXTO = `Sos el Asistente de Ciberseguridad de la "Red de Ciberseguridad Comunitaria": una red de universidades, estudiantes supervisados y un SOC compartido que protege a municipios pequeños y organizaciones sociales.
Contexto de la demo (datos ficticios): Villa Ejemplo, 30.000 habitantes, 1 persona de sistemas, 48 cuentas, un Excel con datos de 4.000 beneficiarios (incluye diagnósticos médicos).
Niveles de servicio: Autodiagnóstico (gratis), Guardianes Digitales (gratis/subsidiado), Escudo Municipal (abono USD 700/1.400/2.500 por mes según población), Asistente de IA (plan Free o abono).
Reglas: respondé en castellano rioplatense, en no más de 120 palabras. Solo orientación defensiva: no des instrucciones ofensivas. No inventes datos que no estén en el contexto. Si algo es decisión legal, sugerí consultar al área legal.`

const ALERTA = `Alerta activa (a-001, crítica, martes 22:40): login con la cuenta de un proveedor que no tenía MFA, desde la IP 203.0.113.45, seguido de un recorrido masivo de carpetas compartidas (1.240 archivos en 3 minutos). Checklist de contención: llamar al referente, deshabilitar la cuenta, cerrar sesiones, revisar carpetas accedidas. El Excel sensible ya estaba en un espacio restringido.`

const MODELO = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat'

// Devuelve null si no hay API key o falla: el front usa el guion local.
export async function responderIA(rol: Rol, pantalla: string, alertaId: string | undefined, mensajes: Msg[]): Promise<string | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) return null
  const system = [CONTEXTO, ESTILO[rol], alertaId ? ALERTA : `Pantalla actual: ${pantalla}.`].join('\n\n')
  try {
    const deepseek = createDeepSeek({ apiKey })
    const { text } = await generateText({
      model: deepseek(MODELO),
      system,
      messages: mensajes.slice(-10),
      maxOutputTokens: 600,
      abortSignal: AbortSignal.timeout(15000),
    })
    return text.trim() || null
  } catch (e) {
    console.error('[asistente] fallo, se usa guion:', e instanceof Error ? e.message : e)
    return null
  }
}
