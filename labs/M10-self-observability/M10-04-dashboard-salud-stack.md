# Laboratorio M10-04 — Dashboard de salud del stack

[▲ Módulo M10](README.md) · [← Anterior](M10-03-metricbeat-stack.md) · [Siguiente módulo →](../M11-integraciones-externas/M11-01-fluent-bit-a-es.md)

> ⏱️ ~40 min

**Objetivo:** dashboard `lab-m10-stack-health` con cluster, JVM y conteo Beats.

> **Audiencia:** equipo de **plataforma** (no solo desarrollo). Responde: «¿Elasticsearch respira?» «¿los Beats siguen enviando?» En incidente de ingesta, este dashboard se abre **antes** que el de logs de negocio.

---

### Paso 1 — Panel cluster status

Fuente de verdad operativa: `_cluster/health`. En prod lo scrapea Prometheus o Elastic Agent; aquí lo reflejas en panel.

Usa Stack Monitoring si tienes datos; si no, panel **Markdown** con salida periódica de:

```bash
curl -fsS 'http://localhost:9200/_cluster/health?pretty'
```

Anota en el markdown: `status`, `number_of_nodes`, `active_shards`. Actualízalo manualmente en lab — en prod sería query automática.

**Interpretación rápida**

| status | Acción típica |
|--------|----------------|
| green | Seguir investigando elsewhere |
| yellow | Réplicas sin asignar — revisar nodos/disco |
| red | Shards primarios sin asignar — prioritario |

---

### Paso 2 — Lens heap JVM

Si tienes índice `.monitoring-es-*` o métricas stack, grafica `jvm.mem.heap.used.pct` en el tiempo.

**Limitación lab:** sin collection, crea **Metric** con valor manual del paso M10-01 y refresca mentalmente «esto es snapshot, no serie».

Alternativa API (para anotar en markdown o actualizar metric):

```bash
curl -fsS 'http://localhost:9200/_nodes/stats/jvm?filter_path=nodes.*.jvm.mem.heap.used_percent'
```

**Caso de uso:** heap estable al 70 % vs escalera al 95 % antes de OOM — patrones distintos de incidente.

---

### Paso 3 — Tres contadores Beats

Tres paneles **Metric** (Lens) o markdown con `_count` últimos 15 min:

| Data view | Pregunta |
|-----------|----------|
| `filebeat-*` | ¿Entran logs? |
| `metricbeat-*` | ¿Entran métricas host/docker? |
| `auditbeat-*` | ¿Hay eventos de auditoría? |

Query mental: documentos con `@timestamp` en ventana del dashboard. Cero en uno solo → pipeline parcial roto (M01-03, TROUBLESHOOTING).

Reutiliza `./scripts/health-check.sh` si prefieres copiar números al panel Markdown.

---

### Paso 4 — Guardar y enlazar runbook

**Dashboards** → combina paneles → **Save** como `lab-m10-stack-health`.

Añade panel Markdown con enlace a [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) — sección «Discover vacío» y «Kibana no carga».

![Biblioteca de dashboards — captura real](../../docs/imagenes/kibana/kibana-dashboards-list.png)

**Buena práctica:** el dashboard dice *qué* está mal; el runbook dice *qué comandos* ejecutar.

---

## Validación

- [ ] Dashboard guardado con ≥3 paneles (cluster, JVM, ≥1 Beat).
- [ ] Enlace a troubleshooting visible.
- [ ] Puedes explicar qué panel mirarías primero si «no hay logs nuevos».

---

## Antes de seguir

Self-observability alimenta SLOs de plataforma (disponibilidad ES, lag de ingesta). No sustituye observabilidad de negocio — la complementa cuando el problema es la tubería, no la app.
