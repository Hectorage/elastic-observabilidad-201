# Referencia rápida — bloque M02 (2 h)

## Arranque (cada sesión)

```bash
cd <raíz-del-repo>
docker compose -f infra/docker-compose.yml --profile beats up -d
./scripts/health-check.sh
```

## ¿Quién escucha dónde?

| Puerto | Servicio | Uso en el lab |
|--------|----------|----------------|
| **9200** | Elasticsearch | `curl`, `_count`, `_search`, `_cluster/health` |
| **5601** | Kibana | Discover, Index Management |
| — | Filebeat | Sin API de consulta; logs con `docker logs lab-filebeat` |

Dentro de contenedores: host ES = **`elasticsearch:9200`**, no `localhost`.

## Ingesta viva (Elasticsearch)

```bash
curl -fsS 'http://localhost:9200/filebeat-*/_count'
curl -fsS 'http://localhost:9200/filebeat-*/_search?size=1&sort=@timestamp:desc&pretty'
```

## Data stream vs índice

```bash
curl -fsS 'http://localhost:9200/_data_stream?pretty' | grep '"name"'
curl -fsS 'http://localhost:9200/_cat/indices/.ds-filebeat*?v&h=index,docs.count'
curl -fsS 'http://localhost:9200/_cat/indices/lab-*?v&h=index,docs.count'
```

## Kibana Discover

- Data view logs: `filebeat-*` → time picker **Last 15 minutes** (o 1 h).
- Data view smoke: `lab-smoke` → **Last 1 year** (fecha fija en el doc).
- Filtro demo: `log_source : "demo-app"`.

## Salud del clúster

```bash
curl -fsS 'http://localhost:9200/_cluster/health?pretty' | grep -E 'status|number_of_nodes'
curl -fsS 'http://localhost:9200/_cat/shards/filebeat-*?v&h=index,shard,prirep,state' | head -15
```

`yellow` + 1 nodo + `rep=1` → **normal en lab** (réplicas sin asignar).

## Fallos frecuentes

| Síntoma | Mirar primero |
|---------|----------------|
| Discover vacío | `_count`, time picker, data view |
| `_count` no sube | `docker compose ps filebeat loggen`, perfil `beats` |
| Kibana no carga | `docker logs lab-kibana`, puerto 5601 reenviado |
| ES no arranca | `docker logs lab-elasticsearch`, RAM / `ES_JAVA_OPTS` |

## Apagar sin borrar datos

```bash
docker compose -f infra/docker-compose.yml --profile beats down
# NO usar -v salvo reset total
```

## Enlaces labs del bloque

- [M02-02](../labs/M02-despliegue-stack/M02-02-kibana-discover.md)
- [M02-03](../labs/M02-despliegue-stack/M02-03-filebeat-ingesta-viva.md)
- [M02-04](../labs/M02-despliegue-stack/M02-04-fallos-y-recovery.md)
- [M02-05](../labs/M02-despliegue-stack/M02-05-ha-shards-replicas.md)
