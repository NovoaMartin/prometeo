# Red Prometeo · Prototipo MVP (Entregable 5)

Prototipo clickeable de la Red de Ciberseguridad Comunitaria (Desafío 4). Cuenta el caso de uso del PDF:
Villa Ejemplo (30.000 hab.), Excel con 4.000 beneficiarios y la alerta de las 22:40. **Datos ficticios; integraciones simuladas.**

## Cómo correrlo

```bash
# Terminal 1 (opcional: sin el back todo funciona igual)
cd server && npm install && npm run dev          # http://localhost:3001
# con IA real:  DEEPSEEK_API_KEY=... npm run dev

# Terminal 2
cd web && npm install && npm run dev             # http://localhost:62467
```

El front funciona completo sin back: el contador de autodiagnósticos usa un valor de ejemplo y el asistente responde con guion.
Con back y sin `DEEPSEEK_API_KEY`, el asistente también usa el guion. Con key, responde DeepSeek vía AI SDK (`deepseek-chat`, configurable con `DEEPSEEK_MODEL`).
Para publicar: `npm run build` en `web/` (hosting estático) y definir `VITE_API_URL` si el back está en otro dominio.

## Guion de la demo (2–3 min)
Activá **Presentador** (arriba a la derecha) y avanzá con "Siguiente":
1. Inicio · 2. Autodiagnóstico 38/100 · 3. Guardianes (sube a 61, MFA 95 %) · 4. Panel · 5. **Simular ataque** ·
6. Detalle de alerta + Asistente IA (cambiá de rol para ver el tono) · 7. Contención en 25 min · 8. La red comparte la IP · 9. Reporte (rol Intendente).
**Reiniciar** deja la demo en el estado inicial.

## Qué se simula
| En la propuesta | En el prototipo |
|---|---|
| Wazuh | `web/src/data/alertas.ts` + botón "Simular ataque" |
| Greenbone | Lista fija de vulnerabilidades |
| DFIR-IRIS | Checklist y línea de tiempo en el estado (localStorage) |
| MISP | Feed fijo de indicadores, publicado al contener el incidente |
| Keycloak | Selector de rol |
| Asistente IA | Guion por intención y rol; opcionalmente DeepSeek vía `/api/asistente` |

## Trazabilidad: dolor del mapa de empatía → funcionalidad
| Dolor / aspiración | Funcionalidad |
|---|---|
| No tiene SOC propio / no monitorea 24 hs | Panel con alertas y estado "Protegido 24/7" |
| Los usuarios cometen errores | Guardianes Digitales y quiz de phishing |
| Le cuesta justificar inversiones | Puntaje de madurez y reporte de cumplimiento |
| No tiene tiempo | Plan priorizado (top 5 acciones, impacto/esfuerzo) |
| Asistencia inmediata | Asistente de IA por rol |
| Tener evidencia de cumplimiento | Reporte imprimible a PDF |
| Efecto red (ventaja especial del Canvas) | Red de amenazas compartidas |
| Usuario final vs. cliente pagador | Roles Referente / Intendente |
