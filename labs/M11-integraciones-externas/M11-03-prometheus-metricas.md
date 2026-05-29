# Laboratorio M11-03 — Prometheus y correlación

[▲ Módulo M11](README.md) · [← Anterior](M11-02-kafka-redpanda-buffer.md) · [Siguiente →](M11-04-patron-kubernetes.md)

> ⏱️ ~45 min

**Objetivo:** usar Prometheus del lab y correlacionar scrape con logs.

---

### Paso 1 — UI Prometheus

http://localhost:9090 → **Status** → **Targets** → job `prometheus` UP.

---

### Paso 2 — Query

En **Graph**: `up{job="prometheus"}`

---

### Paso 3 — Correlación manual

Con time picker alineado, anota si un `scrape_failure` (si lo simulas parando prometheus) coincidiría con gap en métricas — tabla:

| Fuente | Qué mide |
|--------|----------|
| Prometheus | Targets, métricas pull |
| Metricbeat | Docker/host push a ES |

---

### Paso 4 — Elastic Metricbeat prometheus module (lectura)

Documenta en una frase: Metricbeat puede **scrapear** endpoints Prometheus y enviar a ES — alternativa a remote_write.

---

## Validación

- [ ] Target prometheus UP.
- [ ] Tabla comparativa Prometheus vs Metricbeat.

---

## Antes de seguir

Muchas shops guardan Prometheus para apps y ES para logs/trazas unificados.
