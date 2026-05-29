# Laboratorio M07-03 — User agent

[▲ Módulo M07](README.md) · [← Anterior](M07-02-geoip-cliente.md) · [Siguiente →](M07-04-pipeline-enriquecimiento-completo.md)

> ⏱️ ~35 min

**Objetivo:** extraer navegador y detectar **Googlebot** en user agent.

---

### Paso 1 — Simulate

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/_ingest/pipeline/lab-enrich-user-agent/_simulate?pretty' \
  -d '{"docs":[{"_source":{"user_agent.original":"Mozilla/5.0 (compatible; Googlebot/2.1)"}}]}'
```

---

### Paso 2 — KQL en Discover

```text
user_agent.name : *Googlebot* or user_agent.original : *Googlebot*
```

Sobre `lab-access-test` (tercera línea del fichero sample).

---

### Paso 3 — Panel Lens

Donut por `user_agent.name` o `user_agent.os.name`.

---

## Validación

- [ ] Bot vs Chrome distinguibles en datos.
- [ ] Pipeline `lab-enrich-user-agent` cargado.

---

## Antes de seguir

User agent parsing ayuda a fraudes y scraping; combínalo con geoIP.
