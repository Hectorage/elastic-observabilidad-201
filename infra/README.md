# Infraestructura de laboratorio

Stack Docker Compose para **Elastic Stack Observabilidad Lab First** (edición `8.17.2`).

## Arranque rápido

```bash
cp .env.example .env
docker compose up -d                          # Elasticsearch + Kibana
docker compose --profile beats up -d          # + loggen, Filebeat, Metricbeat, Auditbeat
```

Desde la raíz del repo:

```bash
./scripts/health-check.sh
```

Kibana: http://localhost:5601 — Elasticsearch: http://localhost:9200

## Servicios

| Servicio | Perfil | Puerto |
|----------|--------|--------|
| elasticsearch | (base) | 9200 |
| kibana | (base) | 5601 |
| loggen | beats | — |
| filebeat | beats | — |
| metricbeat | beats | — |
| auditbeat | beats | — |

Seguridad deshabilitada a propósito hasta el módulo M09.

## Requisitos

- Docker + Docker Compose v2
- ~8 GB RAM recomendados en Codespaces
- `vm.max_map_count` en host Linux bare metal (en Codespaces suele no aplicar)
