# Laboratorio M08-03 — Watcher con consulta programada

[▲ Módulo M08](README.md) · [← Anterior](M08-02-regla-errores-logs.md) · [Siguiente →](M08-04-accion-webhook.md)

> ⏱️ ~45 min

**Objetivo:** crear un **watch** que busque errores recientes y registre el resultado.

---

### Paso 1 — Crear watch

```bash
curl -fsS -X PUT 'http://localhost:9200/_watcher/watch/lab-m08-error-watch' \
  -H 'Content-Type: application/json' \
  -d '{
  "trigger": { "schedule": { "interval": "1m" } },
  "input": {
    "search": {
      "request": {
        "indices": ["filebeat-*"],
        "body": {
          "size": 0,
          "query": {
            "bool": {
              "must": [
                { "term": { "log.source": "demo-app" } },
                { "query_string": { "default_field": "message", "query": "ERROR" } }
              ],
              "filter": [{ "range": { "@timestamp": { "gte": "now-5m" } } }]
            }
          }
        }
      }
    }
  },
  "condition": {
    "compare": { "ctx.payload.hits.total", "gte": 1 }
  },
  "actions": {
    "log_error": {
      "logging": { "text": "Lab watch: {{ctx.payload.hits.total}} errores en 5m" }
    }
  }
}'
```

---

### Paso 2 — Ejecutar manualmente

```bash
curl -fsS -X PUT 'http://localhost:9200/_watcher/watch/lab-m08-error-watch/_execute?pretty'
```

---

### Paso 3 — Historial

```bash
curl -fsS 'http://localhost:9200/_watcher/watch/lab-m08-error-watch?pretty' | head -40
docker logs lab-elasticsearch --tail 30 2>/dev/null | grep -i watch || true
```

---

## Validación

- [ ] Watch creado sin error 4xx.
- [ ] `_execute` devuelve `state` conocido.
- [ ] Condición coherente con datos del `loggen`.

---

## Antes de seguir

Watcher es potente para orquestación; Kibana rules cubren el 80 % operativo.
