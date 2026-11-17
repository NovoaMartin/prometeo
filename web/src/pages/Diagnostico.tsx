import { useNavigate } from 'react-router-dom'
import { Card, PageTitle } from '../components/ui'
import { useStore } from '../state/store'
import { AREAS, PREGUNTAS, type Respuesta } from '../data/preguntas'

const OPC: { v: Respuesta; l: string }[] = [{ v: 'si', l: 'Sí' }, { v: 'parcial', l: 'Parcial' }, { v: 'no', l: 'No' }]

export function Diagnostico() {
  const { s, d } = useStore()
  const nav = useNavigate()
  const completo = PREGUNTAS.every((p) => s.respuestas[p.id])

  return (
    <div>
      <PageTitle title="Autodiagnóstico de ciberseguridad" sub="12 preguntas, 3 minutos. Gratis, sin compromiso." />
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">Organización
            <input value={s.municipio.nombre} onChange={(e) => d({ type: 'SET_MUNICIPIO', municipio: { ...s.municipio, nombre: e.target.value } })} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
          </label>
          <label className="text-sm">Población
            <input type="number" value={s.municipio.poblacion} onChange={(e) => d({ type: 'SET_MUNICIPIO', municipio: { ...s.municipio, poblacion: Number(e.target.value) } })} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
          </label>
          <label className="text-sm">Tipo
            <select value={s.municipio.tipo} onChange={(e) => d({ type: 'SET_MUNICIPIO', municipio: { ...s.municipio, tipo: e.target.value as 'municipio' | 'ong' } })} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5">
              <option value="municipio">Municipio</option>
              <option value="ong">Organización social</option>
            </select>
          </label>
        </div>
        <button onClick={() => d({ type: 'PRESET' })} className="mt-3 rounded-md border border-brand px-3 py-1.5 text-sm text-brand hover:bg-blue-50">
          Completar como Villa Ejemplo
        </button>
      </Card>

      {AREAS.map((area) => (
        <div key={area} className="mb-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{area}</h2>
          <div className="space-y-2">
            {PREGUNTAS.filter((p) => p.area === area).map((p) => (
              <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 !p-4">
                <span className="text-sm">{p.texto}</span>
                <div className="flex gap-1">
                  {OPC.map((o) => (
                    <button key={o.v} onClick={() => d({ type: 'RESPONDER', id: p.id, valor: o.v })}
                      className={`rounded-md border px-3 py-1 text-sm ${s.respuestas[p.id] === o.v ? 'border-brand bg-brand text-white' : 'border-slate-300 hover:bg-slate-100'}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <button disabled={!completo} onClick={() => { d({ type: 'FINALIZAR_DIAGNOSTICO' }); nav('/diagnostico/resultado') }}
        className="rounded-lg bg-brand px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
        Ver mi resultado
      </button>
      {!completo && <span className="ml-3 text-sm text-slate-500">Respondé las 12 preguntas para continuar.</span>}
    </div>
  )
}
