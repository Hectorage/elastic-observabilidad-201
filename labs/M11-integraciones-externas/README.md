# M11 — Integración con Kafka, Fluent Bit y Prometheus

[← Página anterior](../M10-self-observability/M10-04-dashboard-salud-stack.md) · [Siguiente →](M11-01-fluent-bit-a-es.md)

> ⏱️ ~3 h · Perfil `integrations` en compose

## Qué aprenderás

- Ingerir con **Fluent Bit** (alternativa a Filebeat en edge/K8s).
- Patrón **Kafka/Redpanda** como buffer de desacoplamiento.
- Correlacionar **Prometheus** (pull) con Metricbeat/ES (push).
- Mapear arquitectura Docker del lab a **Kubernetes** (M11-04).

## Contexto

- No sustituye Beats del lab — convive en perfil `integrations`.
- Cada ejercicio explica **cuándo** usar la tecnología, no solo cómo arrancarla.

## Tabla de ejercicios

| ID | Guion | Objetivo |
|----|-------|----------|
| M11-01 | [Fluent Bit](M11-01-fluent-bit-a-es.md) | Índice `lab-fluent-bit` |
| M11-02 | [Kafka buffer](M11-02-kafka-redpanda-buffer.md) | Topic + backpressure |
| M11-03 | [Prometheus](M11-03-prometheus-metricas.md) | Pull vs push |
| M11-04 | [Patrón K8s](M11-04-patron-kubernetes.md) | Equivalencias arquitectura |

```bash
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.integrations.yml \
  --profile integrations up -d
```

## Antes de seguir (cierre M11)

- [ ] Fluent Bit indexa `access-lab.log`.
- [ ] Mensaje en topic Kafka consumido.
- [ ] Tabla Prometheus vs Metricbeat completada.
