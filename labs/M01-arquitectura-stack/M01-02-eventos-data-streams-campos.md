# Laboratorio M01-02 — Explorar eventos, data streams y campos

[← Página anterior](M01-01-arranque-flujo-completo.md) · [▲ Módulo M01](README.md) · [Siguiente página →](M01-03-romper-reparar-pipeline.md)

> ⏱️ ~35 min · 🧩 Requisitos: M01-01 (stack en marcha) · 🖥️ Terminal + Kibana Discover

**Objetivo:** inspeccionar documentos reales en Elasticsearch y Kibana, distinguir **data stream** frente a **índice clásico**, y practicar filtros sobre campos ECS que usarás en todo el curso.

> Trabajas sobre datos que ya ingiere Filebeat; la documentación oficial es referencia al final de cada bloque, no el ejercicio en sí.

---

### Paso 1 — Sacar un documento completo de Filebeat

```bash
curl -fsS 'http://localhost:9200/filebeat-*/_search?size=1&sort=@timestamp:desc&pretty' \
  | head -80
```

En `_source`, localiza y anota el valor de:

| Campo | ¿Qué representa? (1 palabra) |
|-------|------------------------------|
| `@timestamp` | |
| `message` | |
| `host.name` | |
| `agent.type` | |
| `log_source` | Etiqueta del origen (`demo-app`); ver nota ECS abajo |

Estos campos son la base del “contrato” de observabilidad del curso.

> **Nota ECS:** el campo se llama `log_source` (guión bajo), no `log.source`. Filebeat también rellena el objeto `log.file.path`; un custom field `log.source` choca con ese mapping y Elasticsearch **rechaza** el documento (en logs de Filebeat: `events were dropped`).

---

### Paso 2 — Listar data streams (no solo índices)

```bash
curl -fsS 'http://localhost:9200/_data_stream?pretty' | grep '"name"'
curl -fsS 'http://localhost:9200/_cat/indices/.ds-filebeat*?v&h=index,docs.count,store.size'
```

Verás:

- Un **nombre lógico** (`filebeat-8.17.2` o similar) al que envías búsquedas.
- **Backing indices** ocultos (`.ds-filebeat-...`) donde Elasticsearch guarda los datos por rollo.

Eso es la diferencia operativa: tú consultas `filebeat-*`; Elasticsearch gestiona los `.ds-*` detrás.

---

### Paso 3 — Crear un índice clásico y comparar (5 minutos)

Indexa un documento “a mano” en un índice con nombre fijo (patrón antiguo, aún válido para pruebas):

```bash
curl -fsS -X POST 'http://localhost:9200/lab-contrato/_doc' \
  -H 'Content-Type: application/json' \
  -d '{
    "@timestamp": "2026-05-29T14:00:00Z",
    "message": "contrato manual M01-02",
    "service": { "name": "payments-api" },
    "host": { "name": "lab-manual" },
    "event": { "dataset": "lab.contrato" },
    "environment": "lab"
  }'
curl -fsS 'http://localhost:9200/_cat/indices/lab-*?v'
```

| Pregunta | Respuesta tras mirar `_cat/indices` |
|----------|-------------------------------------|
| ¿`lab-contrato` aparece como un solo índice? | |
| ¿`filebeat-*` aparece como `.ds-filebeat-...`? | |

En **M06** verás por qué los data streams encajan mejor con ILM; aquí solo comprueba que **conviven** ambos modelos.

---

### Paso 4 — Filtrar en Discover (KQL sobre datos reales)

En Kibana Discover (`filebeat-*`):

1. `log_source : "demo-app" and message : *ERROR*` — solo errores de la app demo.
2. `log_source : "demo-app" and message : *status=500*` — respuestas HTTP 500.
3. Cambia el data view a `lab-contrato` (créalo si hace falta) y busca `message : "contrato manual"`.

Documentación de sintaxis: [KQL](https://www.elastic.co/docs/explore-analyze/query-filter/languages/kql).

---

### Paso 5 — Añadir TU línea de log y verla ingestada

Genera actividad nueva en el fichero que Filebeat ya vigila:

```bash
echo "$(date -Iseconds) INFO demo-app request_id=manual-lab method=GET path=/api/manual status=200 latency_ms=1" \
  >> infra/samples/logs/app.log
```

Espera 15–30 s y en Discover filtra:

```text
message : *manual-lab*
```

Has demostrado el contrato mínimo: **misma ruta de ingesta**, nuevo evento con campos buscables.

---

### Paso 6 — Tres familias de datos (vista anticipada)

Si Metricbeat y Auditbeat están en marcha (`--profile beats`):

```bash
curl -fsS 'http://localhost:9200/metricbeat-*/_count'
curl -fsS 'http://localhost:9200/auditbeat-*/_count'
```

| Familia | Patrón | Un campo para filtrar en M03 |
|---------|--------|------------------------------|
| Logs | `filebeat-*` | `message`, `log_source` |
| Métricas | `metricbeat-*` | `event.module`, `metricset.name` |
| Auditoría / FIM | `auditbeat-*` | `file.path`, `event.action` |

En M03 profundizarás en cada Beat; aquí solo confirmas que **conviven** en el mismo clúster.

---

### Paso 7 — Referencia ECS (lectura corta, opcional)

Compara tu documento del paso 1 con la tabla de campos en [ECS reference](https://www.elastic.co/docs/reference/ecs).

Para data streams en profundidad: [Data streams](https://www.elastic.co/docs/manage-data/data-store/data-streams).

---

## Validación

- [ ] Has abierto un `_source` real de Filebeat y localizado los 5 campos de la tabla.
- [ ] Diferencias en una frase: data stream `filebeat-*` vs índice `lab-contrato`.
- [ ] Tu línea `manual-lab` aparece en Discover.
- [ ] Un filtro KQL con `ERROR` o `status=500` devuelve resultados.

---

## Antes de seguir

### Pon el foco en

- Un **evento** = documento JSON con `@timestamp`; no un fichero suelto en Kibana.
- `host.name` y `@timestamp` serán tu eje de correlación logs ↔ métricas (M03).
- Campos con punto (`host.name`) son convención ECS; evita inventar `hostName`.
- Los cambios de config del Beat no reescriben eventos ya indexados.

### Reto (tómate tu tiempo)

1. ¿Por qué las búsquedas usan `filebeat-*` y no el nombre largo `.ds-filebeat-...`?
2. Propón un nombre de data stream para logs nginx en prod (`logs-...`).
3. En el documento manual, ¿qué campo usarías en una alerta de M08? (pista: `event.dataset` o `service.name`)
4. (Opcional) Compara [Beats vs Logstash](https://www.elastic.co/docs/reference/beats/auditbeat/diff-logstash-beats) y di cuándo añadirías Logstash al diagrama de M01-01.
