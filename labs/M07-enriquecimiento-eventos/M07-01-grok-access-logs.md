# Laboratorio M07-01 — Grok sobre logs tipo nginx

[▲ Módulo M07](README.md) · [Siguiente →](M07-02-geoip-cliente.md)

> ⏱️ ~40 min

**Objetivo:** indexar líneas de `access-lab.log` con grok y campos HTTP ECS.

---

### Paso 1 — Simular ingestión

```bash
curl -fsS -X PUT 'http://localhost:9200/lab-access-test' \
  -H 'Content-Type: application/json' \
  -d '{"settings":{"index.default_pipeline":"lab-enrich-completo"}}'

while read -r line; do
  curl -fsS -X POST 'http://localhost:9200/lab-access-test/_doc' \
    -H 'Content-Type: application/json' \
    -d "{\"message\":$(echo "$line" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().strip()))')}"
done < infra/samples/logs/access-lab.log
```

---

### Paso 2 — Inspeccionar

```bash
curl -fsS 'http://localhost:9200/lab-access-test/_search?pretty' \
  -H 'Content-Type: application/json' \
  -d '{"size":3}'
```

Salida esperada: `client.ip`, `http.response.status_code`, `url.original`.

---

### Paso 3 — Discover

Crea data view `lab-access-test` → filtra `http.response.status_code : 500`.

---

## Validación

- [ ] Tres líneas indexadas con campos parseados.
- [ ] Status 500 identificado (checkout).

---

## Antes de seguir

Fluent Bit (M11) puede enviar al mismo índice con formato distinto — unifica con pipeline.
