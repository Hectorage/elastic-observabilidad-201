# Laboratorio M07-02 — GeoIP

[▲ Módulo M07](README.md) · [← Anterior](M07-01-grok-access-logs.md) · [Siguiente →](M07-03-user-agent-parse.md)

> ⏱️ ~35 min

**Objetivo:** enriquecer `client.ip` con `client.geo.country_name` (base GeoLite del cluster).

> **Caso de uso:** detectar tráfico desde países inesperados, priorizar incidentes por región, cumplir requisitos de auditoría («¿desde dónde accedieron?»). GeoIP **no** identifica usuarios — solo ubicación aproximada de la IP.

---

### Paso 1 — Simulate geoip solo

Prueba aislada del processor antes de mezclar con grok:

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/_ingest/pipeline/lab-enrich-geoip/_simulate?pretty' \
  -d '{"docs":[{"_source":{"client.ip":"203.0.113.10"}}]}'
```

`203.0.113.0/24` es TEST-NET-3 (RFC 5737) — en bases GeoLite suele mapear a US. En prod usarías IPs reales de tus logs.

| Resultado | Significado |
|-----------|-------------|
| `client.geo.country_name` presente | Processor OK |
| Campo vacío | IP privada, reservada o base GeoIP desactualizada |
| `error` en simulate | Pipeline no cargado |

---

### Paso 2 — Documentos reales

Reindexa línea con IP pública de prueba en formato access log:

```bash
curl -fsS -X POST 'http://localhost:9200/lab-access-test/_doc?pipeline=lab-enrich-completo' \
  -H 'Content-Type: application/json' \
  -d '{"message":"203.0.113.10 - - [29/May/2026:10:00:01 +0000] \"GET / HTTP/1.1\" 200 100 \"-\" \"Mozilla/5.0\""}'
```

El pipeline completo debe: grok → extraer IP → geoip → user_agent (si aplica).

---

### Paso 3 — Lens por país

Si `client.geo.country_name` existe, crea gráfico de barras en `lab-access-test`.

**Interpretación:** un pico desde un país donde no tienes clientes puede ser scraping o ataque — combínalo con M07-03 (user agent) antes de bloquear.

---

## Validación

- [ ] `_simulate` muestra objeto `client.geo`.
- [ ] Al menos un doc con país en índice de prueba.
- [ ] Sabes por qué IPs `10.x` no geolocalizan en logs internos.

---

## Antes de seguir

IPs privadas (`10.x`, `192.168.x`) no geolocalizan — normal en microservicios east-west. En prod enriqueces en el edge (IP pública del load balancer) o usas `X-Forwarded-For` con cuidado (spoofing).
