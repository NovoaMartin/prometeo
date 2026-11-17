import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { AuthProvider } from './auth/AuthContext'
import { HomeRedirect, RequireAuth, RequireRol } from './auth/Guards'
import { PublicLayout } from './layouts/PublicLayout'
import { AppLayout } from './layouts/AppLayout'
import { Landing } from './pages/public/Landing'
import { Precios } from './pages/public/Precios'
import { Autodiagnostico } from './pages/public/Autodiagnostico'
import { Login } from './pages/public/Login'
import { Registro } from './pages/public/Registro'
import { Panel } from './pages/app/Panel'
import { Diagnostico } from './pages/app/Diagnostico'
import { Plan } from './pages/app/Plan'
import { Inventario } from './pages/app/Inventario'
import { Alertas } from './pages/app/Alertas'
import { AlertaDetalle } from './pages/app/AlertaDetalle'
import { Vulnerabilidades } from './pages/app/Vulnerabilidades'
import { Red } from './pages/app/Red'
import { Capacitacion } from './pages/app/Capacitacion'
import { Reporte } from './pages/app/Reporte'
import { Soc } from './pages/app/Soc'
import { MisTareas } from './pages/app/MisTareas'
import { Configuracion } from './pages/app/Configuracion'

const qc = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, staleTime: 15_000 } } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Landing />} />
              <Route path="precios" element={<Precios />} />
              <Route path="autodiagnostico" element={<Autodiagnostico />} />
              <Route path="login" element={<Login />} />
              <Route path="registro" element={<Registro />} />
            </Route>
            <Route path="app" element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<HomeRedirect />} />
                <Route element={<RequireRol roles={['referente', 'intendente']} />}>
                  <Route path="panel" element={<Panel />} />
                  <Route path="plan" element={<Plan />} />
                  <Route path="reporte" element={<Reporte />} />
                </Route>
                <Route element={<RequireRol roles={['referente']} />}>
                  <Route path="diagnostico" element={<Diagnostico />} />
                  <Route path="inventario" element={<Inventario />} />
                  <Route path="capacitacion" element={<Capacitacion />} />
                  <Route path="configuracion" element={<Configuracion />} />
                </Route>
                <Route element={<RequireRol roles={['referente', 'intendente', 'analista']} />}>
                  <Route path="alertas" element={<Alertas />} />
                  <Route path="alertas/:id" element={<AlertaDetalle />} />
                  <Route path="red" element={<Red />} />
                </Route>
                <Route element={<RequireRol roles={['referente']} />}>
                  <Route path="vulnerabilidades" element={<Vulnerabilidades />} />
                </Route>
                <Route element={<RequireRol roles={['analista']} />}>
                  <Route path="soc" element={<Soc />} />
                </Route>
                <Route element={<RequireRol roles={['guardian']} />}>
                  <Route path="mis-tareas" element={<MisTareas />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
