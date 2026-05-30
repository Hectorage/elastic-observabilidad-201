# Laboratorio M07-01 — Grok sobre logs tipo nginx

[▲ Módulo M07](README.md) · [Siguiente →](M07-02-geoip-cliente.md)

> ⏱️ ~40 min

**Objetivo:** indexar líneas de `access-lab.log` con grok y campos HTTP ECS.

> **Contexto:** logs de acceso web (nginx, Apache, ALB) llegan como **una línea de texto**. Sin parseo solo puedes buscar substrings. Con grok obtienes `client.ip`, `http.response.status_code`, `url.original` — base para dashboards, GeoIP y alertas.

---

### Paso 1 — Simular ingestión

Usamos índice clásico `lab-access-test` con pipeline `lab-enrich-completo` (carga grok + geoip + user_agent en pasos siguientes). El bucle lee el fichero estático del repo.

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

**Producción:** Filebeat/Fluent Bit leerían el fichero en continuo; aquí simulas un batch histórico.

---

### Paso 2 — Inspeccionar

```bash
curl -fsS 'http://localhost:9200/lab-access-test/_search?pretty' \
  -H 'Content-Type: application/json' \
  -d '{"size":3}'
```

Salida esperada por documento:

| Campo ECS | Ejemplo | Uso |
|-----------|---------|-----|
| `client.ip` | IP del cliente | GeoIP, rate limiting |
| `http.response.status_code` | 200, 404, 500 | SLI error rate |
| `url.original` | path solicitado | Top endpoints lentos |

Si solo ves `message`, el pipeline no corrió — verifica `default_pipeline` y `./scripts/apply-ingest-pipelines.sh`.

---

### Paso 3 — Discover

Crea data view `lab-access-test` → filtra `http.response.status_code : 500`.

Localiza la línea de **checkout** (500) — en incidente real correlacionarías con trazas de pago o logs de aplicación backend.

**Compara con M04:** Logstash grok vs ingest pipeline grok; el objetivo de negocio es idéntico.

---

## Validación

- [ ] Tres líneas indexadas con campos parseados.
- [ ] Status 500 identificado (checkout).
- [ ] Puedes nombrar un dashboard que construirías con estos campos.

---

## Antes de seguir

Fluent Bit (M11) puede enviar al mismo índice con formato distinto — unifica con pipeline común para no duplicar lógica grok.
