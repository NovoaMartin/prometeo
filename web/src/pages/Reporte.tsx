import { Printer } from 'lucide-react'
import { Card, PageTitle } from '../components/ui'
import { mfaActual, minutosContencion, puntajeActual, useStore } from '../state/store'
import { puntajeBase } from '../lib/scoring'
import { PRESET_VILLA_EJEMPLO } from '../data/preguntas'
import { TAREAS } from '../data/tareas'

export function Reporte() {
  const { s } = useStore()
  const hay = Object.keys(s.respuestas).length > 0
  const inicial = puntajeBase(hay ? s.respuestas : PRESET_VILLA_EJEMPLO)
  const actual = hay ? puntajeActual(s) : inicial
  const hechas = TAREAS.filter((t) => s.tareas[t.id])

  return (
    <div>
      <div className="no-print flex items-start justify-between">
        <PageTitle title="Reporte de cumplimiento" />
        <button onClick={() => window.print()} className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"><Printer size={16} /> Imprimir / PDF</button>
      </div>
      <Card>
        <h2 className="text-xl font-bold text-ink">Informe ejecutivo de ciberseguridad · {s.municipio.nombre}</h2>
        <p className="text-sm text-slate-500">Red de Ciberseguridad Comunitaria · Datos ficticios de prototipo</p>

        <h3 className="mt-5 font-bold">1. Madurez de seguridad</h3>
        <p className="text-sm">Puntaje inicial <strong>{inicial}/100</strong> → actual <strong>{actual}/100</strong>. Cuentas con MFA: <strong>{mfaActual(s)}%</strong>.</p>

        <h3 className="mt-5 font-bold">2. Medidas adoptadas</h3>
        {hechas.length ? (
          <ul className="list-disc pl-5 text-sm">{hechas.map((t) => <li key={t.id}>{t.titulo} (Guardián: {t.estudiante}, supervisor {t.supervisor})</li>)}</ul>
        ) : <p className="text-sm text-slate-500">Aún no hay medidas registradas.</p>}

        <h3 className="mt-5 font-bold">3. Incidentes</h3>
        {s.alerta.contenida ? (
          <p className="text-sm">Acceso masivo desde cuenta de proveedor sin MFA (martes 22:40). <strong>Contenido en {minutosContencion(s)} min</strong> (meta &lt; 30). El archivo sensible ya estaba en un espacio restringido. Indicadores compartidos con la red; 2 municipios bloquearon intentos similares.</p>
        ) : <p className="text-sm text-slate-500">Sin incidentes contenidos en el período.</p>}

        <h3 className="mt-5 font-bold">4. Cumplimiento</h3>
        <p className="text-sm">Registros del SOC con datos personales seudonimizados. Evidencia de medidas técnicas y organizativas disponible para el área legal.</p>
      </Card>
    </div>
  )
}
