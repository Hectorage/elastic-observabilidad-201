# Laboratorio M03-02 — Un stack trace = un solo evento (multiline)

[← Página anterior](M03-01-dos-origenes-logs.md) · [▲ Módulo M03](README.md) · [Siguiente página →](M03-03-metricbeat-docker-correlacion.md)

> ⏱️ ~40 min · 🧩 Requisitos: M03-01 · 🖥️ Terminal + Discover + editor de `filebeat.yml`

**Objetivo:** ver el problema de **una línea = un documento**, configurar multiline en Filebeat y comprobar con `_count` y Discover que el stack trace queda unificado.

---

### Paso 1 — Inyectar un error multilínea

```bash
cat >> infra/samples/logs/app-errors.log <<'EOF'
2026-05-29T11:00:00Z ERROR payments-api Unhandled exception in checkout
java.lang.NullPointerException: Cannot invoke method on null reference
    at com.example.CheckoutService.charge(CheckoutService.java:88)
    at com.example.CheckoutController.pay(CheckoutController.java:41)
2026-05-29T11:00:01Z INFO payments-api Request completed request_id=abc-123 status=500
EOF
sleep 30
```

---

### Paso 2 — Medir el problema (antes de multiline)

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_count' \
  -d '{"query":{"match":{"message":"NullPointerException"}}}'
```

Anota el número **ANTES** (suele ser > 1 si cada línea del stack es un documento distinto).

En Discover: `message : *NullPointerException*` — ¿cuántas filas ves para un solo error?

---

### Paso 3 — Añadir input multiline en Filebeat

En `infra/filebeat/filebeat.yml`, añade bajo `filebeat.inputs:`:

```yaml
  - type: filestream
    id: lab-multiline-errors
    enabled: true
    paths:
      - /var/log/lab/app-errors.log
    parsers:
      - multiline:
          type: pattern
          pattern: '^\d{4}-\d{2}-\d{2}'
          negate: true
          match: after
    fields:
      log_source: payments-api
      log.parser: multiline-lab
    fields_under_root: true
```

```bash
docker compose -f infra/docker-compose.yml restart filebeat
```

Genera **otro** error para forzar lectura:

```bash
cat >> infra/samples/logs/app-errors.log <<'EOF'
2026-05-29T11:05:00Z ERROR payments-api Second failure in checkout
java.lang.IllegalStateException: cart empty
    at com.example.CheckoutService.validate(CheckoutService.java:12)
EOF
sleep 30
```

---

### Paso 4 — Medir el arreglo (después de multiline)

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{"size":1,"sort":[{"@timestamp":"desc"}],"query":{"term":{"log.parser":"multiline-lab"}}}'
```

Discover:

```text
log.parser : "multiline-lab"
```

Expande el documento: `message` debe contener **varias líneas** (fecha del error + `at com.example...`).

Compara de nuevo:

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_count' \
  -d '{"query":{"term":{"log.parser":"multiline-lab"}}}'
```

---

### Paso 5 — Cuándo no hace falta multiline (comprobación)

El `loggen` escribe **una línea por evento** (`app.log`). En Discover:

```text
log_source : "demo-app"
```

No necesita multiline. Los logs JSON de una línea por evento usarían parser `ndjson` (M04/M07).

---

## Validación

- [ ] Antes del parser, el stack trace estaba fragmentado (varios docs o varias filas).
- [ ] Tras multiline, al menos un doc con `log.parser: multiline-lab` contiene el stack completo en `message`.
- [ ] Entiendes el patrón: líneas que **no** empiezan por fecha se pegan a la anterior.

---

## Antes de seguir

### Pon el foco en

- Multiline = regla de negocio (“qué es un evento”).
- El patrón `^\d{4}-\d{2}-\d{2}` está acoplado al formato del log.
- Parseo pesado (grok) → M04 Logstash / ingest pipelines y M07.

### Reto (tómate tu tiempo)

1. Si el patrón falla, ¿qué ves en Discover? (fragmentación)
2. ¿Cuándo moverías esto a un ingest pipeline en Elasticsearch?
3. (Opcional) [Filebeat multiline](https://www.elastic.co/docs/reference/beats/filebeat/multiline-examples)
