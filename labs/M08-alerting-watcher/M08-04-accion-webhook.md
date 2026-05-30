# Laboratorio M08-04 — Acción webhook (simulación)

[▲ Módulo M08](README.md) · [← Anterior](M08-03-watcher-query.md) · [Siguiente módulo →](../M09-seguridad-tls-rbac/M09-01-habilitar-seguridad.md)

> ⏱️ ~35 min

**Objetivo:** extender el watch con acción **webhook** hacia un receptor de prueba.

> **Caso de uso:** conectar Elasticsearch a Slack, PagerDuty, ServiceNow o un microservicio interno sin pasar por Kibana. El webhook POST lleva payload JSON con contadores del watch.

---

### Paso 1 — Listener de prueba (terminal aparte)

Necesitas URL alcanzable **desde el contenedor ES** — en Codespaces localhost del host no siempre funciona.

| Opción | Cuándo |
|--------|--------|
| [webhook.site](https://webhook.site) | URL pública HTTPS — recomendado en Codespaces |
| `python3 -m http.server 9999` | Solo si ES puede alcanzar tu IP host (raro en cloud) |

Copia la URL única de webhook.site antes del paso 2.

---

### Paso 2 — Actualizar watch (ejemplo webhook.site)

Sustituye `host`/`path` por los de tu URL (dominio y UUID del path):

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
            "term": { "log_source": "demo-app" }
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

Umbral `>= 10` docs totales `demo-app` — más fácil de disparar que ERROR puro para validar el canal.

**Producción:** autenticación (Bearer token), retry, timeout y validación TLS en el webhook.

---

### Paso 3 — Forzar ejecución

```bash
curl -fsS -X PUT 'http://localhost:9200/_watcher/watch/lab-m08-error-watch/_execute?pretty'
```

Refresca webhook.site — deberías ver POST con `count`. Si no llega: red del contenedor, firewall Codespaces, o condición false.

---

### Paso 4 — Limpiar

```bash
curl -fsS -X DELETE 'http://localhost:9200/_watcher/watch/lab-m08-error-watch'
```

Evita watches de lab consumiendo ciclos en background.

---

## Validación

- [ ] Recibiste petición en webhook.site **o** documentaste limitación de red con evidencia (`_execute` response).
- [ ] Watch eliminado al final.
- [ ] Diferencias anotadas: Log action (M08-03) vs webhook (integración externa).

---

## Antes de seguir

M09 activará auth: las reglas y watches necesitarán roles con privilegios `manage_watcher` y usuarios de servicio — no uses `elastic` en prod para watches.
