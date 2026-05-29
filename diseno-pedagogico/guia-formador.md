# Guía del formador — M01–M03

Apoyo para impartir la primera capa. Complementa `ritmo-clase.md` (tiempos) y `mapa-modulos.md` (alcance).

## Antes de empezar la jornada

- Confirma que cada alumno tiene su **fork** y un **Codespace** con ≥ 8 GB RAM.
- Pre-`pull` de imágenes la noche anterior si hay red lenta (M01-04 ritual recovery, o al final de M01-01).
- Ten abierto `labs/TROUBLESHOOTING.md` y `labs/CHEATSHEET.md`.

## Checkpoints verificables por módulo

| Módulo | Artefacto que debe existir | Comando de verificación |
|--------|----------------------------|--------------------------|
| M01 | Stack UP + evento visto en Discover | `./scripts/health-check.sh`; KQL `log.source : "demo-app"` |
| M02 | Cluster + Kibana + Filebeat (desglose) | `_cluster/health`; `lab-smoke` indexado |
| M03 | Tres familias de datos | `_cat/indices` muestra filebeat/metricbeat/auditbeat |

## Orientación a los retos de “Antes de seguir” (M01)

M01 es **hands-on desde el ejercicio 1**: no hay tabla ni diagrama sin stack en marcha.

### M01-01 (arranque y flujo)
1. **Parar Filebeat:** `_count` deja de crecer; Discover sin eventos nuevos.
2. **`elasticsearch` vs `localhost`:** DNS interno de Docker Compose; `localhost` dentro del contenedor apunta al propio contenedor.
3. **Filtro ERROR:** debe devolver eventos (~10 % del loggen); si 0, revisar time picker o que loggen esté Up.
4. **Elastic Agent:** agente unificado que sustituye/complementa Beats sueltos en despliegues modernos.

### M01-02 (eventos y data streams)
1. **`filebeat-*` vs `.ds-*`:** el alias lógico simplifica consultas; los backing indices rotan con ILM.
2. **Nombre nginx:** `logs-nginx.access-default` o similar (`logs-{dataset}-{namespace}`).
3. **Alerta M08:** `event.dataset: lab.contrato` o `service.name: payments-api`.
4. **Logstash:** cuando hace falta transformación pesada o salidas múltiples antes de ES.

### M01-03 (límites)
1. **Parar loggen:** `app.log` sigue creciendo localmente pero si Filebeat está Up sigue ingestando; si Filebeat parado, no llega a ES.
2. **Puerto 9200:** `ss -tlnp | grep 9200`.
3. **Síntoma operador:** cluster green pero dashboards “planos” sin datos nuevos.

### M01-04 (checklist)
1. **`down -v`:** borra volumen `esdata` → pierdes índices.
2. **Kibana falla:** logs `lab-kibana`, esperar arranque, puerto 5601.
3. **Explicación flujo:** fichero → Filebeat → API ES → Kibana lee ES.

## M02 — capa a capa (respuestas guía retos)

- **M02-01:** `GET /` muestra versión; recreate sin `-v` conserva `lab-smoke`.
- **M02-02:** Discover vacío → time picker, data view, `_search` en ES.
- **M02-03:** Parar Filebeat detiene `_count`; `add_host_metadata` → `host.*`.
- **M02-04:** `UNASSIGNED` en `_cat/shards`; dentro del beat solo `elasticsearch:9200` resuelve.

## M03 — tres familias (respuestas guía retos)

- **M03-01:** KQL `message : *sshd* and message : *WARN*`; mezclar logs sin etiquetar rompe alertas por dataset.
- **M03-02:** Patrón malo → varios docs por stack; ingest pipeline cuando parseo compartido y pesado.
- **M03-03:** Sin métricas no ves saturación de contenedor; socket error si no hay `/var/run/docker.sock`.
- **M03-04:** `event.action` deleted/updated según versión; campos comunes `@timestamp`, `host.name`, `agent.*`.

### M02-01
1. **`GET /`:** versión, build, lucene; útil para confirmar nodo y versión en incidentes.
2. **Fila `lab-smoke`:** índice clásico (no data stream), 1 doc, salud yellow/green.
3. **Borrar contenedor sin volumen:** los datos persisten en `esdata`; al recrear, `lab-smoke` sigue.

### M02-02
1. **URL interna:** `http://elasticsearch:9200` (DNS de Compose).
2. **Discover vacío:** rango de tiempo, data view, ¿hay docs (`_count`)?
3. **Stack Monitoring:** uso de heap, shards, estado del nodo.

### M02-03
1. **Parar Filebeat:** `_count` deja de crecer (no hay nuevos eventos).
2. **`add_host_metadata`:** añade `host.*` (nombre, OS, arquitectura).
3. **Campo nuevo:** solo en eventos futuros tras reinicio.

### M02-04
1. **`down -v`:** borra el volumen → datos perdidos; aceptable en lab para reset, nunca en prod.
2. **`connection refused`:** ES caído, nombre/host mal, red de Compose.
3. **Shards rojos:** `_cat/shards?v` y `allocation/explain`.

### M03-01
1. **Mezclar app+seguridad:** dificulta RBAC, retención y alertas diferenciadas.
2. **WARN del fichero:** `message : *sshd* and message : *WARN*` (o por nivel si está parseado).
3. **No aparece fichero:** permisos del volumen `ro`, ruta del path, que loggen/Filebeat estén Up.

### M03-02
1. **Multiline roto:** stack trace fragmentado en varios documentos.
2. **Mover a ingest pipeline:** cuando el parseo es complejo/compartido o quieres aligerar el edge.
3. **JSON por línea:** no necesitas multiline; usa parser `ndjson`.

### M03-03
1. **Solo logs:** pierdes saturación de recursos (CPU/mem) que explica latencia/errores.
2. **`metricset.name`:** cpu, memory, network, container…
3. **Socket no montado:** error de conexión a `/var/run/docker.sock`.

### M03-04
1. **Borrado:** `event.action : "deleted"`.
2. **Campos comunes:** `@timestamp`, `host.name`, `event.*`, `agent.*`.
3. **Security en M09:** se separa para no bloquear labs iniciales con TLS/RBAC.

## Errores frecuentes en clase

- Alumnos ejecutando `curl localhost:9200` **dentro** de un contenedor → usar el host de Compose.
- Olvidar `--profile beats` y preguntar por qué no hay datos.
- Time picker de Kibana demasiado estrecho → “No results”.
- Editar configs y no reiniciar el beat.

Ver `labs/TROUBLESHOOTING.md` para la matriz completa.
