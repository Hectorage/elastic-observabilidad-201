# Laboratorio M07-02 — GeoIP

[▲ Módulo M07](README.md) · [← Anterior](M07-01-grok-access-logs.md) · [Siguiente →](M07-03-user-agent-parse.md)

> ⏱️ ~35 min

**Objetivo:** enriquecer `client.ip` con `client.geo.country_name` (base GeoLite del cluster).

---

### Paso 1 — Simulate geoip solo

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/_ingest/pipeline/lab-enrich-geoip/_simulate?pretty' \
  -d '{"docs":[{"_source":{"client.ip":"203.0.113.10"}}]}'
```

---

### Paso 2 — Documentos reales

Reindexa o vuelve a indexar una línea con IP pública de prueba:

```bash
curl -fsS -X POST 'http://localhost:9200/lab-access-test/_doc?pipeline=lab-enrich-completo' \
  -H 'Content-Type: application/json' \
  -d '{"message":"203.0.113.10 - - [29/May/2026:10:00:01 +0000] \"GET / HTTP/1.1\" 200 100 \"-\" \"Mozilla/5.0\""}'
```

---

### Paso 3 — Lens por país

Si `client.geo.country_name` existe, gráfico de barras en `lab-access-test`.

---

## Validación

- [ ] `_simulate` muestra objeto `client.geo`.
- [ ] Al menos un doc con país (puede ser `United States` para 203.0.113.0/24 TEST-NET-3).

---

## Antes de seguir

IPs privadas (`10.x`) no geolocalizan — normal en logs internos.
