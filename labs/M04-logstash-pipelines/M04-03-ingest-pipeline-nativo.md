# Laboratorio M04-03 — Ingest pipeline nativo en Elasticsearch

[▲ Módulo M04](README.md) · [← Anterior](M04-02-filtros-grok-logstash.md) · [Siguiente →](M04-04-rutas-condicionales.md)

> ⏱️ ~55 min · 🧩 Puedes usar stack **sin** Logstash para este ejercicio

**Objetivo:** aplicar el mismo parseo con un **ingest pipeline** de Elasticsearch y simular un documento con `_simulate`.

> **Idea central:** la transformación puede vivir **en el nodo ES** (ingest pipeline) o **en Logstash** (contenedor aparte). Misma necesidad de negocio — distinto lugar de ejecución.

---

### Paso 1 — Volver a Filebeat directo (opcional pero recomendado)

Aislar variables: si dejas Logstash activo, no sabes si parseó LS o el pipeline ES.

```bash
docker compose -f infra/docker-compose.yml -f infra/docker-compose.logstash.yml --profile beats --profile logstash down
docker compose -f infra/docker-compose.yml --profile beats up -d
```

---

### Paso 2 — Cargar pipelines del repo

Los pipelines viven en Git (`infra/ingest-pipelines/`) y se aplican por API — patrón GitOps.

```bash
./scripts/apply-ingest-pipelines.sh
curl -fsS 'http://localhost:9200/_ingest/pipeline/lab-parse-demo-app?pretty'
```

Revisa en la salida processors `grok` / `convert` — equivalente funcional al Logstash de M04-02.

---

### Paso 3 — Simular sin indexar

`_simulate` es tu «unit test» de pipeline: prueba JSON de entrada sin ensuciar índices.

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/_ingest/pipeline/lab-parse-demo-app/_simulate?pretty' \
  -d '{
    "docs": [{
      "_source": {
        "message": "2026-05-29T12:00:00+00:00 ERROR demo-app request_id=99 method=GET path=/api/checkout status=500 latency_ms=420"
      }
    }]
  }'
```

Salida esperada: en `doc._source`, `http.response.status_code: 500`, `latency_ms: 420`. Si hay `error` en la respuesta, el grok del pipeline no matcheó — ajusta patrón antes de indexar miles de docs.

---

### Paso 4 — Asociar pipeline al índice de prueba

Tres formas de invocar pipeline en prod — aquí usas `default_pipeline` a nivel índice:

```bash
curl -fsS -X PUT 'http://localhost:9200/lab-ingest-test' \
  -H 'Content-Type: application/json' \
  -d '{"settings":{"index.default_pipeline":"lab-parse-demo-app"}}'

curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/lab-ingest-test/_doc' \
  -d '{"message":"2026-05-29T12:01:00+00:00 WARN demo-app request_id=1 method=GET path=/api/orders status=404 latency_ms=80"}'

curl -fsS 'http://localhost:9200/lab-ingest-test/_search?pretty' \
  -H 'Content-Type: application/json' \
  -d '{"size":1,"query":{"match_all":{}}}'
```

El documento indexado debe mostrar campos parseados — no solo el `message` crudo.

---

### Paso 5 — Tabla comparativa (rellena con tus palabras)

| Criterio | Logstash | Ingest pipeline |
|----------|----------|-----------------|
| Dónde corre | Contenedor LS (JVM aparte) | Nodo ES (mismos recursos que indexación) |
| Ideal para | Multiples fuentes, Kafka, buffers, outputs múltiples | Parseo al indexar, `_bulk`, Beats con `pipeline:` |
| Operación extra | Sí — otro servicio que escalar/parchar | No — pero consume CPU del nodo ES |
| `_simulate` | No (usa `stdout` o filtros debug) | Sí — nativo |
| Tu caso lab checkout | ¿Cuál elegirías si solo hay Filebeat + parseo grok? | |

**Regla práctica:** parseo simple + una fuente → ingest pipeline; orquestación pesada → Logstash.

---

## Validación

- [ ] `_simulate` devuelve campos parseados.
- [ ] Documento en `lab-ingest-test` con status 404 parseado.
- [ ] Tabla comparativa completada con criterio de elección.

---

## Antes de seguir

### Pon el foco en

- Los ingest pipelines se versionan en Git (`infra/ingest-pipelines/`) y se despliegan por API.
- Filebeat también puede declarar `pipeline` en `output.elasticsearch` (ver doc oficial).

### Reto

¿Qué pipeline usarías si la fuente es solo API `_bulk` sin Beats?

<details>
<summary>Ver respuestas</summary>

El mismo **ingest pipeline** de Elasticsearch (`lab-parse-demo-app` u otro), referenciado en cada bulk:

- Parámetro de query: `POST /index/_bulk?pipeline=lab-parse-demo-app`
- O **`index.default_pipeline`** en el índice/data stream destino
- O campo `_pipeline` en cada línea del bulk NDJSON

Los Beats solo automatizan el envío; la transformación vive en el pipeline del nodo ES.

</details>
