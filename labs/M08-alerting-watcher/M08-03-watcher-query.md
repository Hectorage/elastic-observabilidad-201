# Laboratorio M08-03 — Watcher con consulta programada

[▲ Módulo M08](README.md) · [← Anterior](M08-02-regla-errores-logs.md) · [Siguiente →](M08-04-accion-webhook.md)

> ⏱️ ~45 min

**Objetivo:** crear un **watch** que busque errores recientes y registre el resultado.

> **Watcher vs Kibana rules:** M08-01/02 usaron reglas UI — suficientes para umbrales y KQL. **Watcher** (API `_watcher`) permite orquestación compleja: múltiples inputs, condiciones encadenadas, acciones throttled, integración con transformaciones. En 8.x muchos equipos usan Kibana rules; Watcher sigue para automatización avanzada y GitOps.

---

### Paso 1 — Crear watch

Desglosa el JSON antes de pegarlo:

| Bloque | Función |
|--------|---------|
| `trigger.schedule` | Cada 1 min evalúa (lab; prod sería 5–15 min) |
| `input.search` | Query sobre `filebeat-*` últimos 5 min |
| `condition` | Dispara si ≥1 hit ERROR |
| `actions.logging` | Escribe en log de ES (visible en `docker logs`) |

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
                { "term": { "log_source": "demo-app" } },
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

**Equivalencia M08-02:** misma intención (ERROR recientes), distinto motor. Watcher te da el JSON versionable en Git.

---

### Paso 2 — Ejecutar manualmente

No esperes al schedule — fuerza una evaluación:

```bash
curl -fsS -X PUT 'http://localhost:9200/_watcher/watch/lab-m08-error-watch/_execute?pretty'
```

En la respuesta busca `state` y `record` — indica si la condición se cumplió y qué acciones corrieron.

---

### Paso 3 — Historial

```bash
curl -fsS 'http://localhost:9200/_watcher/watch/lab-m08-error-watch?pretty' | head -40
docker logs lab-elasticsearch --tail 30 2>/dev/null | grep -i watch || true
```

| Resultado | Interpretación |
|-----------|----------------|
| Condición true + log action | Watch OK, hay ERROR en ventana |
| Condición false | No hay ERROR recientes — normal si loggen parado |
| Error 4xx al crear | Watcher no disponible (licencia/plan en algunos despliegues) |

---

## Validación

- [ ] Watch creado sin error 4xx.
- [ ] `_execute` devuelve `state` interpretable.
- [ ] Puedes explicar cuándo elegirías Watcher vs regla Kibana.

---

## Antes de seguir

Watcher es potente para orquestación; Kibana rules cubren el 80 % operativo. M08-04 añade webhook — mismo watch, canal externo.
