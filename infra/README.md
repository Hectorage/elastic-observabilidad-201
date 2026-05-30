# Infraestructura de laboratorio

Stack Docker Compose para **Elastic Stack Observabilidad Lab First** (edición `8.17.2`).

## Arranque rápido

```bash
cp .env.example .env
docker compose --profile beats up -d   # ES + Kibana + loggen + Beats (M01-01 y siguientes)
```

Solo Elasticsearch + Kibana (sin ingesta): `docker compose up -d` (sin perfil `beats`).

Desde la raíz del repo:

```bash
./scripts/health-check.sh
```

Kibana: http://localhost:5601 — Elasticsearch: http://localhost:9200

## Servicios base

Referencia: [docs/componentes/](../docs/componentes/README.md)

| Servicio | Perfil | Puerto |
|----------|--------|--------|
| [elasticsearch](../docs/componentes/elasticsearch.md) | (base) | 9200 |
| [kibana](../docs/componentes/kibana.md) | (base) | 5601 |
| [loggen](../docs/componentes/loggen.md) | beats | — |
| [filebeat](../docs/componentes/filebeat.md) | beats | — |
| [metricbeat](../docs/componentes/metricbeat.md) | beats | — |
| [auditbeat](../docs/componentes/auditbeat.md) | beats | — |

Seguridad deshabilitada hasta **M09** (compose base).

## Overrides por módulo

| Archivo | Módulo | Uso |
|---------|--------|-----|
| `docker-compose.logstash.yml` | M04 | `--profile logstash` + Filebeat → Logstash |
| `docker-compose.security.yml` | M09 | `xpack.security.enabled=true` |
| `docker-compose.integrations.yml` | M11 | `--profile integrations` |

Ejemplo M04:

```bash
docker compose -f docker-compose.yml -f docker-compose.logstash.yml \
  --profile beats --profile logstash up -d
```

## Directorios de config

| Ruta | Contenido |
|------|-----------|
| `filebeat/` | `filebeat.yml` (directo ES), `filebeat-logstash.yml` (M04) |
| `logstash/pipeline/` | Pipelines `.conf` |
| `ingest-pipelines/` | JSON para `_ingest/pipeline` |
| `fluent-bit/` | Salida a índice `lab-fluent-bit` |
| `prometheus/` | Scrape de lab |
| `snapshots/` | Repositorio FS para snapshots M06 |

## Scripts (raíz `scripts/`)

- `apply-ingest-pipelines.sh` — carga `infra/ingest-pipelines/*.json`
- `setup-ilm-lab.sh` — política `lab-hot-warm-delete` acelerada para lab

## Requisitos

- Docker + Docker Compose v2
- ~8 GB RAM recomendados en Codespaces
- `vm.max_map_count` en host Linux bare metal (en Codespaces suele no aplicar)
