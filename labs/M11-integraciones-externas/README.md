# M11 — Integración con Kafka, Fluent Bit y Prometheus

[← Página anterior](../M10-self-observability/M10-04-dashboard-salud-stack.md) · [Siguiente →](M11-01-fluent-bit-a-es.md)

> ⏱️ ~3 h · Perfil `integrations` en compose

## Tabla de ejercicios

| ID | Guion | Objetivo |
|----|-------|----------|
| M11-01 | [Fluent Bit](M11-01-fluent-bit-a-es.md) | `lab-fluent-bit` índice |
| M11-02 | [Kafka buffer](M11-02-kafka-redpanda-buffer.md) | Redpanda + concepto cola |
| M11-03 | [Prometheus](M11-03-prometheus-metricas.md) | Scraping y correlación |
| M11-04 | [Patrón K8s](M11-04-patron-kubernetes.md) | Arquitectura sin kind obligatorio |

```bash
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.integrations.yml \
  --profile integrations up -d
```
