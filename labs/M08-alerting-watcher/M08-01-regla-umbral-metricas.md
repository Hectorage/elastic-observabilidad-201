# Laboratorio M08-01 — Regla de umbral en métricas

[▲ Módulo M08](README.md) · [Siguiente →](M08-02-regla-errores-logs.md)

> ⏱️ ~40 min · 🧩 Metricbeat activo

**Objetivo:** alerta cuando **CPU Docker** supere umbral (ajusta al percentil real de tu entorno).

---

### Paso 1 — Baseline en Discover

`metricbeat-*` → `event.module : "docker" and metricset.name : "cpu"` → anota valor medio de `docker.cpu.total.pct` (o campo equivalente).

---

### Paso 2 — Crear regla

**Alerts** → **Create rule** → **Metric threshold**:

![Rules en Stack Management — captura real](../../docs/imagenes/kibana/kibana-alerting-rules.png)

- Metric: average `docker.cpu.total.pct`
- Group by: `container.name`
- Threshold: **above 0.5** (ajusta: 50 % si el campo es 0–1)
- Ventana: 5 min

Nombre: `lab-m08-cpu-high`.

---

### Paso 3 — Observar disparos

Con carga normal puede no disparar — baja umbral temporalmente a **0.01** para validar el mecanismo y vuelve a subirlo.

---

## Validación

- [ ] Regla guardada y **Enabled**.
- [ ] Al menos un evento en historial de la regla (aunque sea con umbral bajo).

---

## Antes de seguir

Las reglas de Kibana 8 usan el stack de alerting unificado; Watcher sigue disponible por API.
