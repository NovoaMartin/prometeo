import { Card } from './ui'
import { AREAS, PREGUNTAS, type Respuesta } from '@shared/preguntas'

const OPC: { v: Respuesta; l: string }[] = [{ v: 'si', l: 'Sí' }, { v: 'parcial', l: 'Parcial' }, { v: 'no', l: 'No' }]

export function Cuestionario({ value, onChange }: { value: Record<string, Respuesta>; onChange: (id: string, v: Respuesta) => void }) {
  return (
    <>
      {AREAS.map((area) => (
        <div key={area} className="mb-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">{area}</h2>
          <div className="space-y-2">
            {PREGUNTAS.filter((p) => p.area === area).map((p) => (
              <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 !p-4">
                <span className="text-sm">{p.texto}</span>
                <div className="flex gap-1">
                  {OPC.map((o) => (
                    <button key={o.v} type="button" onClick={() => onChange(p.id, o.v)}
                      className={`rounded-md border px-3 py-1 text-sm ${value[p.id] === o.v ? 'border-brand bg-brand text-white' : 'border-slate-300 hover:bg-slate-100'}`}>{o.l}</button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
