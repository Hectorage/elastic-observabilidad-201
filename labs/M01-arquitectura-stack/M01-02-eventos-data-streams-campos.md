# Laboratorio M01-02 — Explorar eventos, data streams y campos

[← Página anterior](M01-01-arranque-flujo-completo.md) · [▲ Módulo M01](README.md) · [Siguiente página →](M01-03-romper-reparar-pipeline.md)

> ⏱️ ~35 min · 🧩 Requisitos: M01-01 (stack en marcha) · 🖥️ Terminal + Kibana Discover

Ahora que el stack ingiere datos, vamos a abrir documentos reales en Elasticsearch y Kibana: distinguir **data stream** de **índice clásico** y practicar filtros sobre campos ECS. La documentación oficial queda al final de cada bloque como referencia, no como sustituto del ejercicio.

---

### Paso 1 — Sacar un documento completo de Filebeat

Antes de filtrar en Kibana, miramos el **documento crudo** que Elasticsearch indexa. Ahí vive el contrato de campos (`@timestamp`, ECS, custom fields) que usaremos en KQL, alertas y dashboards — no el texto plano del fichero.

```bash
curl -fsS 'http://localhost:9200/filebeat-*/_search?size=1&sort=@timestamp:desc&pretty' \
  | head -80
```

En `_source`, localizamos y anotamos el valor de:

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

Desde 7.x+, Beats escriben en **data streams**, no en índices con nombre fijo que creamos nosotros. Operamos con el alias lógico (`filebeat-*`); Elasticsearch gestiona los backing indices (`.ds-*`) y la rotación por ILM en M06.

```bash
curl -fsS 'http://localhost:9200/_data_stream?pretty' | grep '"name"'
curl -fsS 'http://localhost:9200/_cat/indices/.ds-filebeat*?v&h=index,docs.count,store.size'
```

Veremos:

- Un **nombre lógico** (`filebeat-8.17.2` o similar) al que enviamos búsquedas.
- **Backing indices** ocultos (`.ds-filebeat-...`) donde Elasticsearch guarda los datos por rollo.

Eso es la diferencia operativa: consultamos `filebeat-*`; Elasticsearch gestiona los `.ds-*` detrás.

---

### Paso 3 — Crear un índice clásico y comparar (5 minutos)

Conviven dos modelos de almacenamiento en el mismo clúster. Indexar con `POST /lab-contrato/_doc` reproduce el patrón **legacy** (nombre fijo, controlamos el mapping inicial). Filebeat usa el patrón **moderno** (data stream + plantillas). En migraciones reales veremos ambos durante meses.

Indexamos un documento “a mano” en un índice con nombre fijo (patrón antiguo, aún válido para pruebas y smoke tests como M02-01):

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

En **M06** veremos por qué los data streams encajan mejor con ILM; aquí solo comprobamos que **conviven** ambos modelos.

---

### Paso 4 — Filtrar en Discover (KQL sobre datos reales)

KQL traduce a consultas sobre campos indexados — no busca texto libre en el fichero original. Cada filtro nos obliga a decidir **qué campo** representa la intención (`log_source` para origen, `message` para contenido). Esa decisión es la misma que tomaremos al definir reglas de alerta.

En Kibana Discover (`filebeat-*`):

![Discover con filtros KQL — captura real del stack](../../docs/imagenes/kibana/kibana-discover-con-eventos.png)

1. `log_source : "demo-app" and message : *ERROR*` — solo errores de la app demo.
2. `log_source : "demo-app" and message : *status=500*` — respuestas HTTP 500.
3. Cambia el data view a `lab-contrato` (créalo si hace falta) y busca `message : "contrato manual"`.

Documentación de sintaxis: [KQL](https://www.elastic.co/docs/explore-analyze/query-filter/languages/kql).

---

### Paso 5 — Añadir una línea de log y verla ingestada

Comprobamos que el pipeline reacciona a **eventos reales fuera del generador**. Si nuestra línea aparece con el mismo esquema que las de `loggen`, la ruta fichero → Beat → ES está validada para cualquier texto que añadamos al path vigilado.

Generamos actividad nueva en el fichero que Filebeat ya vigila:

```bash
echo "$(date -Iseconds) INFO demo-app request_id=manual-lab method=GET path=/api/manual status=200 latency_ms=1" \
  >> infra/samples/logs/app.log
```

Espera 15–30 s y en Discover filtra:

```text
message : *manual-lab*
```

Hemos demostrado el contrato mínimo: **misma ruta de ingesta**, nuevo evento con campos buscables.

---

### Paso 6 — Tres familias de datos (vista anticipada)

Un clúster de observabilidad no es solo logs. Métricas (series numéricas) y auditoría (eventos de sistema) comparten el mismo motor pero **patrones de índice y campos distintos**. M03 profundiza en cada Beat; aquí confirmamos que conviven sin pisarse.

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

En M03 profundizaremos en cada Beat; aquí solo confirmamos que **conviven** en el mismo clúster.

---

### Paso 7 — Referencia ECS (lectura corta, opcional)

ECS no es decoración — es el **idioma común** entre equipos, integraciones y reglas predefinidas. Un `host.name` en logs y en métricas permite correlacionar «¿qué pasaba en el host cuando saltó este ERROR?» sin joins ad-hoc.

ECS (Elastic Common Schema) estandariza nombres para que dashboards, alertas y equipos distintos hablen el mismo idioma. Un campo `host.name` en Filebeat significa lo mismo que en Metricbeat — eso permite correlacionar en M03.

Comparamos el documento del paso 1 con la tabla de campos en [ECS reference](https://www.elastic.co/docs/reference/ecs). Anotamos 3 campos que ya reconocíamos sin saber que eran ECS (`@timestamp`, `host.name`, `agent.type` cuentan).

| Campo en `_source` | Equivalente ECS | ¿Lo usaríamos en alerta/dashboard? |
|-----------------------|-----------------|----------------------------------|
| | | |
| | | |

Para data streams en profundidad: [Data streams](https://www.elastic.co/docs/manage-data/data-store/data-streams).

---

## Validación

- [ ] Hemos abierto un `_source` real de Filebeat y localizado los 5 campos de la tabla.
- [ ] Diferencias en una frase: data stream `filebeat-*` vs índice `lab-contrato`.
- [ ] Nuestra línea `manual-lab` aparece en Discover.
- [ ] Un filtro KQL con `ERROR` o `status=500` devuelve resultados.

---

## Antes de seguir

- Un **evento** = documento JSON con `@timestamp`; no un fichero suelto en Kibana.
- `host.name` y `@timestamp` serán nuestro eje de correlación logs ↔ métricas (M03).
- Campos con punto (`host.name`) son convención ECS; evita inventar `hostName`.
- Los cambios de config del Beat no reescriben eventos ya indexados.

### Reto (tómate tu tiempo)

1. ¿Por qué las búsquedas usan `filebeat-*` y no el nombre largo `.ds-filebeat-...`?
2. Propón un nombre de data stream para logs nginx en prod (`logs-...`).
3. En el documento manual, ¿qué campo usarías en una alerta de M08? (pista: `event.dataset` o `service.name`)
4. (Opcional) Compara [Beats vs Logstash](https://www.elastic.co/docs/reference/beats/auditbeat/diff-logstash-beats) y di cuándo añadirías Logstash al diagrama de M01-01.

<details>
<summary>Ver respuestas</summary>

**1. `filebeat-*` vs `.ds-filebeat-...`**

`filebeat-*` es el **nombre lógico** del data stream (lo que pones en data views y en `_search`). Los índices `.ds-filebeat-8.17.2-2026.05.30-000001` son **backing indices** que Elasticsearch crea y rota por detrás (ILM). Operas sobre el alias lógico; no necesitas apuntar al `.ds-*` concreto.

**2. Data stream para nginx en prod**

Convención Elastic: `logs-{dataset}-{namespace}`, p. ej. `logs-nginx.prod`, `logs-nginx-default` o `logs-nginx-production`. Lo importante: tipo `logs`, dataset que identifique la fuente y namespace que separe entorno/equipo.

**3. Campo para alerta (documento manual)**

En el doc manual del paso 3 suele bastar `event.dataset : "lab-manual"` o `service.name : "lab-manual"` (según cómo lo indexamos). Son campos ECS estables para reglas; evita alertar solo por `_id` o por texto libre en `message`.

**4. Cuándo añadir Logstash (opcional)**

Añade Logstash cuando necesites **transformación pesada** (grok multilínea, enriquecimiento, rutas condicionales), **varios destinos** o **buffer** desacoplado. Beats → ES directo (M01) es el camino mínimo; Beats → Logstash → ES (M04) cuando el procesamiento en el edge no basta.

</details>
