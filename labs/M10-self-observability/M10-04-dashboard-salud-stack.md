# Laboratorio M10-04 — Dashboard de salud del stack

[▲ Módulo M10](README.md) · [← Anterior](M10-03-metricbeat-stack.md) · [Siguiente módulo →](../M11-integraciones-externas/M11-01-fluent-bit-a-es.md)

> ⏱️ ~40 min

**Objetivo:** dashboard `lab-m10-stack-health` con cluster, JVM y conteo Beats.

---

### Paso 1 — Panel cluster status

Usa métricas de Stack Monitoring o anota manualmente en **Markdown** panel el resultado de:

```bash
curl -fsS 'http://localhost:9200/_cluster/health?pretty'
```

---

### Paso 2 — Lens heap

Si tienes índice de métricas de stack, grafica `jvm.mem.heap.used.pct`; si no, **Metric** con valor manual actualizado (limitación lab).

Alternativa API:

```bash
curl -fsS 'http://localhost:9200/_nodes/stats/jvm?filter_path=nodes.*.jvm.mem.heap.used_percent'
```

---

### Paso 3 — Tres contadores Beats

Tres métricas Lens desde `filebeat-*`, `metricbeat-*`, `auditbeat-*` count últimos 15 min — o reutiliza salida de `health-check.sh` en markdown.

---

### Paso 4 — Guardar

Dashboard `lab-m10-stack-health` + enlace al runbook [TROUBLESHOOTING.md](../TROUBLESHOOTING.md).

---

## Validación

- [ ] Dashboard guardado con ≥3 paneles.
- [ ] Enlace a troubleshooting documentado.

---

## Antes de seguir

Self-observability alimenta SLOs del equipo de plataforma, no solo de apps.
