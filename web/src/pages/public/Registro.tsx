import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../../auth/AuthContext'
import { btnPrimary, Campo, Card, ErrorMsg, inputCls } from '../../components/ui'

function precargado() {
  try { return JSON.parse(sessionStorage.getItem('prometeo-diag') ?? 'null') as { orgNombre: string; poblacion: number; tipo: 'municipio' | 'ong'; email: string; respuestas: unknown } | null } catch { return null }
}

export function Registro() {
  const { registro } = useAuth()
  const nav = useNavigate()
  const pre = precargado()
  const [f, setF] = useState({ orgNombre: pre?.orgNombre ?? '', tipo: pre?.tipo ?? 'municipio', poblacion: pre?.poblacion ?? 10000, nombre: '', email: pre?.email ?? '', password: '' })
  const m = useMutation({
    mutationFn: () => registro({ ...f, respuestas: pre?.respuestas }),
    onSuccess: () => { try { sessionStorage.removeItem('prometeo-diag') } catch { /* nada */ } nav('/app/panel', { replace: true }) },
  })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: k === 'poblacion' ? Number(e.target.value) : e.target.value })

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Card>
        <h1 className="text-xl font-bold text-ink">Crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-600">Registrá tu organización. Vas a ser su referente de seguridad.</p>
        {pre && <p className="mt-2 rounded-md bg-teal-50 p-2 text-sm text-teal-800">Vamos a guardar el resultado de tu autodiagnóstico en la nueva cuenta.</p>}
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); m.mutate() }}>
          <Campo label="Organización"><input required className={inputCls} value={f.orgNombre} onChange={set('orgNombre')} /></Campo>
          <Campo label="Tipo"><select className={inputCls} value={f.tipo} onChange={set('tipo')}><option value="municipio">Municipio</option><option value="ong">Organización social</option></select></Campo>
          <Campo label="Población / habitantes"><input type="number" min={0} className={inputCls} value={f.poblacion} onChange={set('poblacion')} /></Campo>
          <Campo label="Tu nombre"><input required className={inputCls} value={f.nombre} onChange={set('nombre')} /></Campo>
          <Campo label="Email"><input type="email" required className={inputCls} value={f.email} onChange={set('email')} autoComplete="username" /></Campo>
          <Campo label="Contraseña (mín. 8 caracteres)"><input type="password" required minLength={8} className={inputCls} value={f.password} onChange={set('password')} autoComplete="new-password" /></Campo>
          <div className="sm:col-span-2">
            {m.error && <div className="mb-3"><ErrorMsg error={m.error} /></div>}
            <button className={btnPrimary + ' w-full'} disabled={m.isPending}>{m.isPending ? 'Creando…' : 'Crear cuenta'}</button>
          </div>
        </form>
        <p className="mt-4 text-sm text-slate-600">¿Ya tenés cuenta? <Link className="text-brand underline" to="/login">Ingresá</Link></p>
      </Card>
    </div>
  )
}
