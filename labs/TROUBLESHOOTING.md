# Troubleshooting — Elastic Stack Lab (M01–M03)

Matriz de síntomas → causa probable → acción. Empieza siempre por `./scripts/health-check.sh`.

## Elasticsearch no arranca / se reinicia en bucle

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Contenedor `Restarting`; log con `vm.max_map_count` | Límite de mmap bajo (host Linux bare metal) | `sudo sysctl -w vm.max_map_count=262144` y recrear. En Codespaces no suele aplicar. |
| Log con `Out of memory` / contenedor muere | JVM con poca RAM | Baja `ES_JAVA_OPTS` en `infra/.env` a `-Xms512m -Xmx512m`; `up -d --force-recreate elasticsearch`. |
| `bind: address already in use` (9200) | Puerto ocupado | `ss -tlnp | grep 9200`; libera el proceso o cambia el mapeo de puerto. |
| Healthcheck nunca pasa a `healthy` | Arranque lento / poca CPU | Espera (start_period 40s) y revisa `docker logs lab-elasticsearch`. |

## Kibana no carga o no conecta

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| `/api/status` no responde | Aún arrancando | Espera 60–90 s; Kibana tarda más que ES. |
| UI: “Kibana server is not ready yet” | ES no `healthy` todavía | Verifica `_cluster/health`; arranca ES antes que Kibana. |
| UI no abre en el navegador | Puerto no reenviado | Pestaña **Ports** en Codespaces → reenvía/abre 5601. |
| Errores de conexión a ES en logs | Host mal configurado | `ELASTICSEARCH_HOSTS=http://elasticsearch:9200` (DNS interno, no `localhost`). |

## No llegan datos (Discover vacío)

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| `app.log` no existe; `lab-loggen` / `lab-filebeat` no aparecen en `ps` | Arranque sin perfil `beats` (solo ES + Kibana) | `docker compose -f infra/docker-compose.yml --profile beats up -d` y verifica los 6 contenedores. |
| `filebeat-*/_count` = 0 | Filebeat no arrancó, no lee ficheros o **eventos rechazados por ES** | `docker logs lab-filebeat`; busca `events were dropped`. Causa habitual: campo custom `log.source` (conflicto ECS) — usar `log_source` en `filebeat.yml`. Recrea Filebeat tras actualizar. |
| Hay docs pero Discover vacío | Rango de tiempo del selector | **Last 15 minutes** / **Last 1 hour** (logs recientes de loggen). Guía: [guia-kibana-discover-data-view.md](../docs/guia-kibana-discover-data-view.md). |
| No existe el data view | Falta crear el data view | Discover → **Create data view** → patrón `filebeat-*`, timestamp `@timestamp`. Guía: [guia-kibana-discover-data-view.md](../docs/guia-kibana-discover-data-view.md). |
| `connection refused` a `elasticsearch:9200` | ES caído o nombre incorrecto | Arranca ES; usa el nombre de servicio, no `localhost`, dentro de contenedores. |
| Eventos viejos sin campo nuevo | Cambio de config no retroactivo | Los cambios solo afectan a eventos futuros; genera tráfico nuevo. |

## Metricbeat

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Sin métricas docker | Socket no montado | Verifica `/var/run/docker.sock` en el volumen del servicio. |
| Filtro `metricset.module` no devuelve nada | Campo incorrecto | Usa `event.module : "docker"` (8.x). |
| Permisos sobre el socket | Usuario sin acceso | El servicio corre como `root` en el lab; revisa permisos del host. |

## Auditbeat

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Sin eventos FIM | Carpeta vacía / sin cambios | Crea/mueve/borra ficheros en `infra/samples/audit-watch/`. |
| Esperabas `auditd` y no aparece | No disponible en contenedor | El lab usa `file_integrity`; auditd se ve en host bare metal (M09 referencia). |

## Cluster en estado `red`

```bash
curl -fsS 'http://localhost:9200/_cat/shards?v' | grep -v STARTED
curl -fsS 'http://localhost:9200/_cluster/allocation/explain?pretty'
```

En el lab single-node, `yellow` por réplicas sin asignar es normal; `red` indica shard primario perdido (revisa disco y logs de ES).

## Reset total del laboratorio (último recurso)

```bash
docker compose -f infra/docker-compose.yml --profile beats down -v   # borra el volumen esdata
docker compose -f infra/docker-compose.yml --profile beats up -d
./scripts/health-check.sh
```

> `down -v` elimina todos los datos indexados. Úsalo solo en laboratorio.
