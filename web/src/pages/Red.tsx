import { Card, PageTitle } from '../components/ui'
import { useStore } from '../state/store'
import { INDICADORES, RED_MUNICIPIOS } from '../data/alertas'

export function Red() {
  const { s } = useStore()
  const publicado = s.alerta.contenida
  const nodos = RED_MUNICIPIOS.map((m) => ({ ...m, bloqueo: m.bloqueo && publicado }))
  const hub = nodos[0]

  return (
    <div>
      <PageTitle title="Red de amenazas compartidas" sub="Cada municipio que se suma protege a los demás (efecto red)." pain="Ventaja especial del Canvas: lo que le pasa a un municipio protege a toda la red. Reemplaza a MISP en el prototipo." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <svg viewBox="0 0 100 90" className="w-full">
            {nodos.slice(1).map((n) => (
              <line key={n.nombre} x1={hub.x} y1={hub.y} x2={n.x} y2={n.y} stroke={publicado ? '#0d9488' : '#cbd5e1'} strokeWidth="0.6" strokeDasharray={publicado ? '0' : '2'} />
            ))}
            {nodos.map((n) => (
              <g key={n.nombre}>
                <circle cx={n.x} cy={n.y} r="5" fill={n.nombre === 'Villa Ejemplo' ? '#1d4ed8' : n.bloqueo ? '#0d9488' : '#94a3b8'} />
                <text x={n.x} y={n.y + 10} textAnchor="middle" fontSize="3.5" fill="#334155">{n.nombre}</text>
              </g>
            ))}
          </svg>
          <p className="text-center text-sm text-slate-600">
            {publicado ? <strong className="text-teal-700">2 municipios bloquearon intentos similares</strong> : 'Contené el incidente para publicar los indicadores en la red.'}
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold text-ink">Feed de indicadores compartidos</h2>
          {!publicado ? <p className="text-sm text-slate-500">Sin indicadores nuevos.</p> : (
            <ul className="space-y-2">
              {INDICADORES.map((i) => (
                <li key={i.valor} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="text-xs uppercase text-slate-500">{i.tipo} · publicado por Villa Ejemplo</div>
                  <div className="font-mono font-semibold">{i.valor}</div>
                </li>
              ))}
              <li className="rounded-md bg-teal-50 p-3 text-sm text-teal-800">San Marcos y Río Claro bloquearon automáticamente estos indicadores.</li>
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
