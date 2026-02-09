
## 2025-02-09 — Rediseño Frontend DTS V1 Resultados

### Diseño
- Rediseño completo estilo Supabase: sidebar fija, header con barra azul 3px
- Paleta monocroma: blue-500 (#0283f8) como único acento
- Cards con border border-slate-200 (sin sombras)
- Frenos con borde+fondo coloreado por tipo (CRITICO=red, ESTRUCTURAL=amber)
- Score ring SVG animado, número en slate-900
- Textos body en slate-700 (más legibles)
- Iconos PNG custom por dimensión (public/icons/*.png)
- Botón flotante avatar/copiloto esquina inferior derecha
- User avatar + rol en sidebar

### Estructura de rutas DTS V1
```
/dts                                    → Home (siguiente)
/dts/onboarding/[assessmentId]          → Onboarding (siguiente)  
/dts/diagnostico/[assessmentId]         → Diagnóstico (siguiente)
/dts/resultados/[assessmentId]          → Resultados ✅ HECHO
```

### Archivos modificados
- src/app/dts/resultados/[assessmentId]/page.tsx — Rediseño completo
- src/app/dts/layout.tsx — Layout mínimo
- public/icons/ — database.png, target.png, handshake.png, gears.png, users.png, chip.png

### Principios de diseño adoptados
- Frontend solo pinta (datos del RPC, cero lógica)
- Estilo Supabase/SaaS minimalista
- Sidebar como navegación principal (fases + secciones página)
- Border-based cards (no shadows)
- Blue-500 único color de acento
