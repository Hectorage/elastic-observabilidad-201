# Laboratorio M04-03 — Ingest pipeline nativo en Elasticsearch

[▲ Módulo M04](README.md) · [← Anterior](M04-02-filtros-grok-logstash.md) · [Siguiente →](M04-04-rutas-condicionales.md)

> ⏱️ ~55 min · 🧩 Puedes usar stack **sin** Logstash para este ejercicio

**Objetivo:** aplicar el mismo parseo con un **ingest pipeline** de Elasticsearch y simular un documento con `_simulate`.

---

### Paso 1 — Volver a Filebeat directo (opcional pero recomendado)

```bash
docker compose -f infra/docker-compose.yml -f infra/docker-compose.logstash.yml --profile beats --profile logstash down
docker compose -f infra/docker-compose.yml --profile beats up -d
```

---

### Paso 2 — Cargar pipelines del repo

```bash
./scripts/apply-ingest-pipelines.sh
curl -fsS 'http://localhost:9200/_ingest/pipeline/lab-parse-demo-app?pretty'
```

---

### Paso 3 — Simular sin indexar

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

Salida esperada: en `doc._source`, `http.response.status_code: 500`, `latency_ms: 420`.

---

### Paso 4 — Asociar pipeline al índice de prueba

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

---

### Paso 5 — Tabla comparativa (rellena tú)

| Criterio | Logstash | Ingest pipeline |
|----------|----------|-----------------|
| Dónde corre | Contenedor LS | Nodo ES |
| Ideal para | Fuentes múltiples, buffers | Parseo al indexar |
| Operación extra | Sí (JVM Logstash) | No |

---

## Validación

- [ ] `_simulate` devuelve campos parseados.
- [ ] Documento en `lab-ingest-test` con `status` 404.
- [ ] Completada la tabla comparativa.

---

## Antes de seguir

### Pon el foco en

- Los ingest pipelines se versionan en Git (`infra/ingest-pipelines/`) y se despliegan por API.
- Filebeat también puede declarar `pipeline` en `output.elasticsearch` (ver doc oficial).

### Reto

¿Qué pipeline usarías si la fuente es solo API `_bulk` sin Beats?
