# Chuleta — comandos y KQL del laboratorio

Referencia rápida para **M01–M12**. Comandos desde la **raíz del repo** salvo que se indique.

## Ciclo de vida del stack

```bash
# Núcleo (Elasticsearch + Kibana)
docker compose -f infra/docker-compose.yml up -d
# Con Beats (Filebeat, Metricbeat, Auditbeat, loggen)
docker compose -f infra/docker-compose.yml --profile beats up -d
# M04 — Logstash en el camino
docker compose -f infra/docker-compose.yml -f infra/docker-compose.logstash.yml \
  --profile beats --profile logstash up -d
# M11 — Fluent Bit, Redpanda, Prometheus
docker compose -f infra/docker-compose.yml -f infra/docker-compose.integrations.yml \
  --profile integrations up -d
# M09 — seguridad (reinicio; ver guion)
docker compose -f infra/docker-compose.yml -f infra/docker-compose.security.yml \
  --profile beats up -d

docker compose -f infra/docker-compose.yml ps
./scripts/health-check.sh
```

## Scripts de apoyo

```bash
./scripts/apply-ingest-pipelines.sh    # M04/M07
./scripts/setup-ilm-lab.sh             # M06
```

## Logs de contenedores

```bash
docker logs lab-elasticsearch --tail 50
docker logs lab-kibana --tail 50
docker logs lab-filebeat --tail 20
docker logs lab-logstash --tail 20
docker logs lab-fluent-bit --tail 20
```

## API de Elasticsearch (REST)

```bash
curl -fsS http://localhost:9200/_cluster/health?pretty
curl -fsS http://localhost:9200/_cat/indices?v
curl -fsS http://localhost:9200/filebeat-*/_count
curl -fsS http://localhost:9200/_ingest/pipeline/lab-parse-demo-app?pretty
curl -fsS http://localhost:9200/_ilm/policy/lab-hot-warm-delete?pretty
curl -fsS http://localhost:9200/_snapshot/lab_fs/_all?pretty
curl -fsS http://localhost:9200/_watcher/watch/lab-m08-error-watch?pretty
```

Con seguridad (M09+):

```bash
source infra/.env
curl -fsS -u "elastic:${ELASTIC_PASSWORD}" http://localhost:9200/_cluster/health?pretty
```

## Logstash

```bash
curl -fsS http://localhost:9600/_node/stats/pipelines?pretty
```

## Patrones de índice / data stream

| Familia | Patrón | Notas |
|---------|--------|-------|
| Logs Beats | `filebeat-*` | data stream por defecto |
| Errores M04 | `filebeat-errors-*` | pipeline condicional |
| Métricas | `metricbeat-*` | |
| Auditoría | `auditbeat-*` | |
| Fluent Bit M11 | `lab-fluent-bit` | índice clásico |
| ILM lab | `lab-ilm-demo-*` | |
| Access parse | `lab-access-test`, `lab-access-bulk` | M07 |

## KQL útil en Discover

```text
log.source : "demo-app"
http.response.status_code >= 500
latency_ms > 300
event.module : "docker" and metricset.name : "cpu"
client.geo.country_name : *
user_agent.name : *Googlebot*
```

## ILM y snapshots (M06)

```bash
curl -fsS -X POST http://localhost:9200/lab-ilm-demo/_rollover
curl -fsS http://localhost:9200/lab-ilm-demo-*/_ilm/explain?pretty
```

## Referencias oficiales

[docs/enlaces-oficiales.md](../docs/enlaces-oficiales.md)
