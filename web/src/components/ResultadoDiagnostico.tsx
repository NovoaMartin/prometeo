import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { Badge, Card } from './ui'
import { esfuerzoLabel, impactoLabel, nivel, porArea, topAcciones, type Respuestas } from '@shared/scoring'

export function ResultadoDiagnostico({ respuestas, puntaje }: { respuestas: Respuestas; puntaje: number }) {
  const niv = nivel(puntaje)
  const tone = puntaje < 40 ? 'text-red-600' : puntaje < 70 ? 'text-amber-600' : 'text-emerald-600'
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="text-center">
          <div className="text-xs font-medium uppercase text-slate-500">Madurez de ciberseguridad</div>
          <div className={`text-6xl font-bold ${tone}`}>{puntaje}<span className="text-2xl text-slate-400">/100</span></div>
          <Badge tone={puntaje < 40 ? 'red' : puntaje < 70 ? 'amber' : 'green'}>{niv}</Badge>
        </Card>
        <Card className="md:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <RadarChart data={porArea(respuestas)}>
                <PolarGrid /><PolarAngleAxis dataKey="area" tick={{ fontSize: 12 }} />
                <Radar dataKey="valor" stroke="#1d4ed8" fill="#1d4ed8" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <h2 className="mb-2 mt-6 text-xl font-bold text-ink">Plan de mejora: las 5 acciones prioritarias</h2>
      <div className="space-y-2">
        {topAcciones(respuestas).map((a, i) => (
          <Card key={a.id} className="flex flex-wrap items-center gap-3 !p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink font-bold text-white">{i + 1}</span>
            <div className="flex-1"><div className="font-medium">{a.accion}</div><div className="text-xs text-slate-500">{a.area}</div></div>
            <Badge tone="green">Impacto {impactoLabel(a.impacto)}</Badge>
            <Badge tone="slate">Esfuerzo {esfuerzoLabel(a.esfuerzo)}</Badge>
          </Card>
        ))}
        {topAcciones(respuestas).length === 0 && <Card>¡No quedan acciones pendientes!</Card>}
      </div>
    </div>
  )
}
