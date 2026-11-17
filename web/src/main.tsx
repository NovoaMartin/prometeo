import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { StoreProvider } from './state/store'
import { Layout } from './components/Layout'
import { Inicio } from './pages/Inicio'
import { Diagnostico } from './pages/Diagnostico'
import { Resultado } from './pages/Resultado'
import { Panel } from './pages/Panel'
import { AlertaDetalle } from './pages/AlertaDetalle'
import { Guardianes } from './pages/Guardianes'
import { Red } from './pages/Red'
import { Soc } from './pages/Soc'
import { Reporte } from './pages/Reporte'
import { Planes } from './pages/Planes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Inicio />} />
            <Route path="diagnostico" element={<Diagnostico />} />
            <Route path="diagnostico/resultado" element={<Resultado />} />
            <Route path="panel" element={<Panel />} />
            <Route path="alertas/:id" element={<AlertaDetalle />} />
            <Route path="guardianes" element={<Guardianes />} />
            <Route path="red" element={<Red />} />
            <Route path="soc" element={<Soc />} />
            <Route path="reporte" element={<Reporte />} />
            <Route path="planes" element={<Planes />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  </StrictMode>,
)
