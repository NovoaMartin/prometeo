import { Link } from 'react-router-dom'
import { Badge, Card, PageTitle, sevTone } from '../components/ui'
import { useStore } from '../state/store'
import { COLA_SOC } from '../data/alertas'

export function Soc() {
  const { s } = useStore()
  const cola = COLA_SOC.filter((a) => a.id !== 'a-001' || (s.alerta.activa && !s.alerta.contenida))
  return (
    <div>
      <PageTitle title="Consola del analista SOC" sub="Cola de alertas de varios municipios. Los datos personales llegan seudonimizados." />
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr><th className="py-2">Sev.</th><th>Alerta</th><th>Municipio</th><th>Usuario</th><th>Origen</th><th>Hora</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cola.map((a) => (
              <tr key={a.id}>
                <td className="py-2"><Badge tone={sevTone(a.severidad)}>{a.severidad}</Badge></td>
                <td>{a.id === 'a-001' ? <Link to="/alertas/a-001" className="text-brand hover:underline">{a.titulo}</Link> : a.titulo}</td>
                <td>{a.municipio}</td>
                <td className="font-mono">{a.usuario}</td>
                <td className="font-mono">{a.origen}</td>
                <td>{a.hora}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
