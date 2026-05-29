# Laboratorio M08-04 — Acción webhook (simulación)

[▲ Módulo M08](README.md) · [← Anterior](M08-03-watcher-query.md) · [Siguiente módulo →](../M09-seguridad-tls-rbac/M09-01-habilitar-seguridad.md)

> ⏱️ ~35 min

**Objetivo:** extender el watch con acción **webhook** hacia un receptor de prueba.

---

### Paso 1 — Listener de prueba (terminal aparte)

```bash
python3 -m http.server 9999
```

O usa https://webhook.site y copia la URL única.

---

### Paso 2 — Actualizar watch (ejemplo webhook.site)

Sustituye `WEBHOOK_URL` por tu URL:

```bash
curl -fsS -X PUT 'http://localhost:9200/_watcher/watch/lab-m08-error-watch' \
  -H 'Content-Type: application/json' \
  -d '{
  "trigger": { "schedule": { "interval": "2m" } },
  "input": {
    "search": {
      "request": {
        "indices": ["filebeat-*"],
        "body": {
          "size": 0,
          "query": {
            "term": { "log.source": "demo-app" }
          }
        }
      }
    }
  },
  "condition": {
    "compare": { "ctx.payload.hits.total", "gte": 10 }
  },
  "actions": {
    "notify_webhook": {
      "webhook": {
        "scheme": "https",
        "host": "webhook.site",
        "port": 443,
        "method": "post",
        "path": "/TU-UUID-AQUI",
        "headers": { "Content-Type": "application/json" },
        "body": "{ \"count\": {{ctx.payload.hits.total}} }"
      }
    }
  }
}'
```

Ajusta `host`/`path` según tu proveedor (el ejemplo es ilustrativo).

---

### Paso 3 — Forzar ejecución

```bash
curl -fsS -X PUT 'http://localhost:9200/_watcher/watch/lab-m08-error-watch/_execute?pretty'
```

---

### Paso 4 — Limpiar

```bash
curl -fsS -X DELETE 'http://localhost:9200/_watcher/watch/lab-m08-error-watch'
```

---

## Validación

- [ ] Recibiste petición en webhook.site o explicaste limitación de red en Codespaces.
- [ ] Watch eliminado al final.

---

## Antes de seguir

M09 activará auth: las reglas y watches necesitarán roles adecuados.
