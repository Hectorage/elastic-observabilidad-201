# M04 — Procesamiento con Logstash e ingest pipelines

[← Página anterior](../M03-recoleccion-beats/M03-04-auditbeat-tres-familias.md) · [Siguiente página →](M04-01-logstash-en-el-camino.md)

> ⏱️ ~3 h 30 min (4 ejercicios) · 🧩 Requisitos: M03 completado · 📎 [Chuleta](../CHEATSHEET.md) · [Troubleshooting](../TROUBLESHOOTING.md)

## Qué aprenderás

- Insertar **Logstash** entre Filebeat y Elasticsearch sin perder data streams.
- Parsear líneas `demo-app` con **grok** y tipos numéricos.
- Replicar transformaciones con **ingest pipelines** nativos y comparar enfoques.
- **Enrutar** eventos ERROR a un data stream distinto.

## Contexto

- M01–M03 envían Beats **directo** a Elasticsearch; M04 usa el override `infra/docker-compose.logstash.yml`.
- Al terminar M04 puedes volver al compose base o seguir con pipelines de ingest en M07.

## Tabla de ejercicios

| ID | Guion | Objetivo |
|----|-------|----------|
| M04-01 | [Logstash en el camino](M04-01-logstash-en-el-camino.md) | Filebeat → Logstash → ES |
| M04-02 | [Filtros grok](M04-02-filtros-grok-logstash.md) | `status`, `latency_ms` estructurados |
| M04-03 | [Ingest pipeline nativo](M04-03-ingest-pipeline-nativo.md) | Mismo parseo sin Logstash |
| M04-04 | [Rutas condicionales](M04-04-rutas-condicionales.md) | ERROR → `filebeat-errors` |

```bash
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.logstash.yml \
  --profile beats --profile logstash up -d
```

## Antes de seguir (cierre M04)

- [ ] Logstash healthy en puerto 9600.
- [ ] Documentos con `http.response.status_code` numérico en Discover.
- [ ] Sabes cuándo elegir Logstash vs ingest pipeline.
