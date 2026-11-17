import { generateText } from 'ai'
import { createDeepSeek } from '@ai-sdk/deepseek'

export type Perfil = 'referente' | 'intendente' | 'analista' | 'ong'
export interface Msg { role: 'user' | 'assistant'; content: string }

const ESTILO: Record<Perfil, string> = {
  referente: 'Hablás con el Responsable de Sistemas de un municipio pequeño: una sola persona sin equipo de seguridad. Usá lenguaje simple, sin jerga, con analogías cotidianas, y pasos numerados y concretos.',
  intendente: 'Hablás con el Intendente o un secretario (cliente que paga, no técnico). Sé ejecutivo: impacto, riesgo, costo y evidencia de cumplimiento. Nada de jerga.',
  analista: 'Hablás con un analista SOC (estudiante supervisado). Podés ser técnico: IOCs, MITRE ATT&CK, contención, logs, pivotes en MISP.',
  ong: 'Hablás con una organización social (escuela, club, ONG) sin conocimientos técnicos. Lenguaje muy simple y pasos baratos o gratuitos.',
}

const CONTEXTO = `Sos el Asistente de Ciberseguridad de la "Red de Ciberseguridad Comunitaria": una red de universidades, estudiantes supervisados y un SOC compartido que protege a municipios pequeños y organizaciones sociales.
Niveles de servicio: Autodiagnóstico (gratis), Guardianes Digitales (gratis/subsidiado), Escudo Municipal (abono USD 700/1.400/2.500 por mes según población), Asistente de IA (plan Free o abono).
Reglas: respondé en castellano rioplatense, en no más de 120 palabras. Solo orientación defensiva: no des instrucciones ofensivas. No inventes datos que no estén en el contexto. Si algo es decisión legal, sugerí consultar al área legal.`

// Devuelve null si no hay API key o falla: el front usa el guion local.
export async function responderIA(
  env: { DEEPSEEK_API_KEY?: string; DEEPSEEK_MODEL?: string },
  perfil: Perfil,
  org: { nombre: string; tipo: string; poblacion: number; plan: string } | null,
  pantalla: string,
  alertaCtx: string | undefined,
  mensajes: Msg[],
): Promise<string | null> {
  const apiKey = env.DEEPSEEK_API_KEY
  if (!apiKey) return null
  const system = [
    CONTEXTO,
    ESTILO[perfil],
    org ? `Organización del usuario: ${org.nombre} (${org.tipo}, ${org.poblacion} habitantes, plan ${org.plan}).` : 'El usuario pertenece a la red (no a una organización en particular).',
    alertaCtx ?? `Pantalla actual: ${pantalla}.`,
  ].join('\n\n')
  try {
    const deepseek = createDeepSeek({ apiKey })
    const { text } = await generateText({
      model: deepseek(env.DEEPSEEK_MODEL ?? 'deepseek-chat'),
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
