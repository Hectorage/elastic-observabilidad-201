# Laboratorio M11-03 — Prometheus y correlación

[▲ Módulo M11](README.md) · [← Anterior](M11-02-kafka-redpanda-buffer.md) · [Siguiente →](M11-04-patron-kubernetes.md)

> ⏱️ ~45 min

**Objetivo:** usar Prometheus del lab y contrastar modelo **pull** (Prometheus) vs **push** (Metricbeat).

> **Realidad enterprise:** muchas organizaciones tienen Prometheus para apps (Kubernetes) y Elasticsearch para logs (+ a veces métricas unificadas). Saber correlacionar temporalmente ambas fuentes evita guerra de herramientas.

---

### Paso 1 — UI Prometheus

http://localhost:9090 → **Status** → **Targets** → job `prometheus` **UP**.

Si DOWN: contenedor `lab-prometheus` caído o scrape mal configurado.

---

### Paso 2 — Query

En **Graph**: `up{job="prometheus"}` — debería ser 1.

Prueba también `scrape_duration_seconds` — latencia del scrape. En prod alertarías si scrape falla (equivalente a Beat caído).

---

### Paso 3 — Correlación manual

Con time picker alineado entre Prometheus (instante del scrape) y Discover (`metricbeat-*` o logs):

| Fuente | Modelo | Qué mide bien |
|--------|--------|---------------|
| Prometheus | **Pull** — scrape HTTP periódico | SLI apps, K8s cadvisor, alertmanager |
| Metricbeat | **Push** — envía a ES | Host, Docker, módulos Elastic integrados |
| Logs Filebeat | Push | Eventos discretos, contexto |

Simula mentalmente: paras Prometheus → métricas pull desaparecen; Metricbeat puede seguir enviando métricas de host — **no son redundantes**, cubren capas distintas.

---

### Paso 4 — Elastic Metricbeat prometheus module (lectura)

Documenta en tus notas:

> Metricbeat puede **scrapear** endpoints Prometheus (`/metrics`) y enviar series a Elasticsearch — alternativa a Prometheus server cuando quieres **una** plataforma de análisis (Kibana) con coste de cardinalidad en ES.

**Trade-off:** Prometheus optimizado para series temporales; ES para correlación log+métrica en un KQL.

---

## Validación

- [ ] Target prometheus UP.
- [ ] Tabla comparativa completada con ejemplo de correlación (aunque hipotético).
- [ ] Frase escrita sobre Metricbeat prometheus module.

---

## Antes de seguir

Muchas shops guardan Prometheus para SRE de apps y ES para logs/trazas unificados — diseña **enlaces** (mismos labels: `service`, `pod`, `@timestamp`) no duplicación ciega.
