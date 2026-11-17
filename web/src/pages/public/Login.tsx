import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth/AuthContext'
import { HOME } from '../../auth/Guards'
import { btnPrimary, Campo, Card, ErrorMsg, inputCls } from '../../components/ui'
import { api } from '../../lib/api'

interface Demo { email: string; nombre: string; rol: keyof typeof HOME; org: string | null }
const ROL_LABEL = { referente: 'Referente', intendente: 'Intendente', analista: 'Analista SOC', guardian: 'Guardián' }

export function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { data: demos } = useQuery({ queryKey: ['demo'], queryFn: () => api<Demo[]>('/auth/demo') })

  const m = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: async () => {
      const me = await api<{ usuario: { rol: keyof typeof HOME } }>('/auth/me')
      nav(from && from.startsWith('/app') ? from : HOME[me.usuario.rol], { replace: true })
    },
  })

  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-10 md:grid-cols-2">
      <Card>
        <h1 className="text-xl font-bold text-ink">Ingresar</h1>
        <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); m.mutate() }}>
          <Campo label="Email"><input type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></Campo>
          <Campo label="Contraseña"><input type="password" required className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Campo>
          {m.error && <ErrorMsg error={m.error} />}
          <button className={btnPrimary + ' w-full'} disabled={m.isPending}>{m.isPending ? 'Ingresando…' : 'Ingresar'}</button>
        </form>
        <p className="mt-4 text-sm text-slate-600">¿No tenés cuenta? <Link className="text-brand underline" to="/registro">Creá una</Link></p>
      </Card>

      <Card className="bg-slate-50">
        <h2 className="font-semibold text-ink">Cuentas de demostración</h2>
        <p className="mt-1 text-xs text-slate-500">Datos ficticios. Contraseña de todas: <code className="rounded bg-white px-1">demo1234</code></p>
        <ul className="mt-3 space-y-2">
          {demos?.map((d) => (
            <li key={d.email}>
              <button type="button" onClick={() => { setEmail(d.email); setPassword('demo1234') }} className="w-full rounded-md border border-slate-200 bg-white p-2 text-left text-sm hover:border-brand">
                <div className="font-medium">{d.nombre} <span className="text-xs font-normal text-slate-500">· {ROL_LABEL[d.rol]}</span></div>
                <div className="text-xs text-slate-500">{d.email}{d.org ? ` · ${d.org}` : ''}</div>
              </button>
            </li>
          ))}
          {!demos && <li className="text-sm text-slate-400">Sin cuentas de demostración cargadas.</li>}
        </ul>
      </Card>
    </div>
  )
}
