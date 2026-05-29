# Chuleta — comandos y KQL del laboratorio

Referencia rápida para M01–M03. Todos los comandos se ejecutan desde la **raíz del repo** salvo que se indique.

## Ciclo de vida del stack

```bash
# Núcleo (Elasticsearch + Kibana)
docker compose -f infra/docker-compose.yml up -d
# Con Beats (Filebeat, Metricbeat, Auditbeat, loggen)
docker compose -f infra/docker-compose.yml --profile beats up -d

# Estado / reinicio / parada
docker compose -f infra/docker-compose.yml ps
docker compose -f infra/docker-compose.yml restart filebeat
docker compose -f infra/docker-compose.yml --profile beats down      # conserva datos (volumen esdata)
docker compose -f infra/docker-compose.yml --profile beats down -v   # ¡borra datos!

# Salud
./scripts/health-check.sh
```

## Logs de contenedores

```bash
docker logs lab-elasticsearch --tail 50
docker logs lab-kibana --tail 50
docker logs lab-filebeat --tail 20
docker logs lab-metricbeat --tail 20
docker logs lab-auditbeat --tail 20
```

## API de Elasticsearch (REST)

```bash
curl -fsS http://localhost:9200/                                  # versión / build
curl -fsS 'http://localhost:9200/_cluster/health?pretty'          # salud
curl -fsS 'http://localhost:9200/_cat/nodes?v'                    # nodos
curl -fsS 'http://localhost:9200/_cat/indices?v'                 # índices
curl -fsS 'http://localhost:9200/_cat/shards?v'                  # shards (rojos = problema)
curl -fsS 'http://localhost:9200/filebeat-*/_count'              # nº de docs
curl -fsS 'http://localhost:9200/filebeat-*/_search?size=1&sort=@timestamp:desc&pretty'
```

Búsqueda con cuerpo JSON:

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{"size":3,"query":{"match":{"message":"ERROR"}}}'
```

## Patrones de data stream (familias)

| Familia | Patrón de consulta | Backing index real |
|---------|--------------------|--------------------|
| Logs | `filebeat-*` | `.ds-filebeat-8.17.2-*` |
| Métricas | `metricbeat-*` | `.ds-metricbeat-8.17.2-*` |
| Auditoría / FIM | `auditbeat-*` | `.ds-auditbeat-8.17.2-*` |

## KQL útil en Discover

```text
log.source : "demo-app"            # eventos del generador
message : *ERROR*                  # texto libre
status : 500                       # respuestas con error
log.level : "warn"                 # nivel
event.module : "docker"            # módulo Metricbeat (¡no metricset.module!)
metricset.name : "cpu"             # tipo de métrica
event.action : "deleted"           # acción FIM (Auditbeat)
file.path : *audit-watch*          # ficheros vigilados
host.name : "lab-es01"             # filtrar por host (correlación)
```

Combinaciones:

```text
log.source : "demo-app" and status >= 500
event.module : "docker" and metricset.name : "memory"
```

## Campos clave (ECS) para correlacionar

- `@timestamp` — siempre en UTC.
- `host.name` — dimensión común entre logs/métricas/auditoría.
- `event.module`, `event.dataset`, `event.action` — clasificación de eventos.
- `service.name`, `log.source`, `environment` — gobierno y troceo.

## Referencias oficiales

Ver lista actualizada en [docs/enlaces-oficiales.md](../docs/enlaces-oficiales.md).

- Elastic Stack: https://www.elastic.co/docs/get-started/the-stack
- ECS: https://www.elastic.co/docs/reference/ecs
- Data streams: https://www.elastic.co/docs/manage-data/data-store/data-streams
- KQL: https://www.elastic.co/docs/explore-analyze/query-filter/languages/kql
