# Elasticsearch

[← Índice](README.md)

## Propósito

Motor distribuido de **almacenamiento, indexación y búsqueda**. Recibe documentos JSON (logs, métricas, eventos de auditoría), los persiste en índices o data streams y responde consultas vía API REST. Es la fuente de verdad del stack: Kibana y las alertas leen de aquí, no al revés.

## Rol en el pipeline

```text
  Ingesta (Beats, Logstash, API)  ──bulk index──►  Elasticsearch  ◄──query──  Kibana / Watcher
                                                        │
                                                   shards / réplicas
```

## Tecnología subyacente

- **Lucene** por shard: índices invertidos para búsqueda full-text, filtros y agregaciones.
- Modelo **documento-orientado**: cada evento es JSON con campos tipados (`keyword`, `text`, `date`, `long`, …).
- **Clúster**: uno o más nodos con roles (master-eligible, data, ingest, …). Coordinación de shards, elección de master y routing de consultas.
- **Data streams**: convención para series temporales (logs/métricas) con backing indices gestionados por ILM.
- **ECS** (Elastic Common Schema): convención de nombres de campos compartida por Beats y muchas integraciones.

## Modo de despliegue

| | |
|---|---|
| **Alta disponibilidad (producción)** | Clúster **multi-nodo**: varios nodos data con réplicas de shard, al menos tres nodos master-eligible para quorum. Un nodo caído no implica pérdida de servicio si hay réplicas asignadas. |
| **Standalone / desarrollo** | **Single-node** (`discovery.type=single-node`): un solo proceso ES. Sin redundancia; caída del nodo = clúster indisponible. |
| **En este repositorio** | Single-node (`lab-es01`, `discovery.type=single-node`). |

Los Beats y Kibana pueden escalar por separado; la HA de los datos depende del topología del clúster Elasticsearch.

Marco CAP y consistencia del pipeline completo: [cap-y-consistencia-stack.md](../cap-y-consistencia-stack.md).

## Operación y estado

| Área | Qué vigilar |
|------|-------------|
| **Salud del clúster (`green` / `yellow` / `red`)** | Estados **nativos de Elasticsearch**, expuestos por la API `GET /_cluster/health` (campo `status`). No los define el curso: `health-check.sh` y el healthcheck de Docker Compose solo **leen** esa respuesta. `green` = todos los shards primarios y réplicas asignados. `yellow` = primarios OK, alguna réplica sin asignar (habitual en single-node). `red` = al menos un shard primario sin asignar; requiere acción. |
| **Shards** | Distribución equilibrada, shards sin asignar (`/_cat/shards`, `/_cluster/allocation/explain`). Picos de segmentos o shards por nodo degradan rendimiento. |
| **Disco** | Espacio libre y watermarks (`flood stage` bloquea escritura). Curva de crecimiento de índices vs políticas ILM. |
| **Memoria JVM** | Heap (`-Xms`/`-Xmx`) ~50 % de RAM del nodo; el resto para OS page cache (Lucene). OOM o GC constante = sizing o query load. |
| **CPU y I/O** | Merge de segmentos, bulk indexing y búsquedas pesadas compiten por CPU y disco. |
| **Persistencia** | Datapath en volumen dedicado; snapshots periódicos al repositorio configurado (`path.repo`). |
| **Seguridad** | TLS, autenticación y RBAC en producción; rotación de credenciales de servicio. |
| **Actualizaciones** | Rolling restart por nodos; comprobar compatibilidad de versión con Beats/Kibana antes de subir minor/major. |

## Señales y comprobaciones

```bash
curl -fsS 'http://localhost:9200/_cluster/health?pretty'
curl -fsS 'http://localhost:9200/_cat/nodes?v'
curl -fsS 'http://localhost:9200/_cat/indices?v&s=store.size:desc'
curl -fsS 'http://localhost:9200/_cat/shards?v' | grep -v STARTED
```

Logs del nodo: errores de disco, circuit breakers, rechazos de bulk, master not discovered.

## Documentación oficial

- [Elasticsearch overview](https://www.elastic.co/docs/solutions/search/elasticsearch)
- [Cluster health](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/cluster-health)
- [Resilience and production guidance](https://www.elastic.co/docs/deploy-manage/production-guidance)
- [Data streams](https://www.elastic.co/docs/manage-data/data-store/data-streams)
