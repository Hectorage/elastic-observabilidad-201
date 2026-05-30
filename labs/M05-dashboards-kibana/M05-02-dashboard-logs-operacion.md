# Laboratorio M05-02 — Dashboard operativo de logs

[▲ Módulo M05](README.md) · [← Anterior](M05-01-lens-primeros-pasos.md) · [Siguiente →](M05-03-dashboard-metricas-host.md)

> ⏱️ ~45 min

**Objetivo:** dashboard con **tasa de ERROR**, **latencia media** y tabla de últimos eventos.

> **Modelo mental:** un dashboard de guardia responde tres preguntas en segundos: **¿cuántos fallos?** **¿van peor que lo normal?** **¿qué líneas concretas debo mirar?** Cada panel mapea a una pregunta.

---

### Paso 1 — Panel: conteo ERROR

Nueva Lens en `filebeat-*`:

- Filtro KQL: `log_source : "demo-app" and (http.response.status_code >= 500 or message : *status=500*)`
- Métrica: **Count** · Tipo: **Metric** (número grande).

Guardar como `lab-m05-error-count`.

**Por qué un solo número:** en una alerta nocturna el operador no quiere interpretar un gráfico — quiere saber si hay **0** o **47** errores 5xx en la ventana. El time picker del dashboard acota «en los últimos 15 min».

---

### Paso 2 — Panel: latencia

- Métrica: **Average** de `latency_ms` (campo del `loggen`; si falta, runtime field desde `message`).
- Filtro: mismos logs `demo-app` (sin filtrar solo ERROR — quieres ver degradación general).
- Tipo: **Line** vs `@timestamp`.

Guardar como `lab-m05-latency-avg`.

**Caso de uso:** latencia media sube antes que exploten los 500 (conexiones lentas, DB saturada). Línea temporal ayuda a correlacionar con despliegues (`@timestamp`).

---

### Paso 3 — Panel: últimos eventos

**Logs** panel o tabla embebida desde Discover:

- Columnas: `@timestamp`, `message`, `url.path`, `http.response.status_code`
- Orden: `@timestamp` desc · Tamaño: 10 filas.

**Por qué tabla:** los números agregados no dan `request_id` ni path concreto. La tabla es el salto a investigación en Discover o a tickets.

---

### Paso 4 — Crear dashboard

**Dashboards** → **Create dashboard** → añade los tres paneles → **Save** como `lab-m05-ops-logs`.

![Biblioteca de dashboards — captura real](../../docs/imagenes/kibana/kibana-dashboards-list.png)

Anota la URL (incluye el id del objeto). Comparte ese enlace en un runbook real sería el «primer tab» en incidente de checkout.

**Layout sugerido:** métrica ERROR arriba a la izquierda (grande), latencia a la derecha (serie temporal), tabla abajo a ancho completo.

---

### Paso 5 — Simular incidente

El `loggen` ya mezcla ~10 % de respuestas 500 — no hace falta romper nada. Tu trabajo es **detectar** el patrón en el dashboard.

1. Time picker: **Last 15 minutes** · Refresh 30 s.
2. Observa si el panel ERROR es > 0 de forma sostenida.
3. En Discover, mismo rango: `log_source : "demo-app" and message : *status=500*` — cruza con la tabla del dashboard.

**Reflexión:** ¿dispararías una alerta con «count > 0 en 1 min» (ruidoso) o «count > 50 en 5 min» (M08)? El dashboard informa; la alerta actúa.

---

## Validación

- [ ] Dashboard `lab-m05-ops-logs` con ≥3 paneles.
- [ ] Métrica ERROR reacciona al time picker.
- [ ] Tabla muestra eventos recientes reconocibles.

---

## Antes de seguir

Un dashboard operativo no sustituye logs crudos — los **prioriza**. M05-04 exportará este trabajo; M08 convertirá umbrales en acciones automáticas.
