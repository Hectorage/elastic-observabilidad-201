# Laboratorio M07-03 — User agent

[▲ Módulo M07](README.md) · [← Anterior](M07-02-geoip-cliente.md) · [Siguiente →](M07-04-pipeline-enriquecimiento-completo.md)

> ⏱️ ~35 min

**Objetivo:** extraer navegador y detectar **Googlebot** en user agent.

> **Caso de uso:** separar tráfico humano vs bots (SEO, scrapers, monitores), detectar clientes obsoletos, investigar fraude (user agent falsificado). El user agent es **declarativo** — no confíes en él para seguridad fuerte.

---

### Paso 1 — Simulate

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/_ingest/pipeline/lab-enrich-user-agent/_simulate?pretty' \
  -d '{"docs":[{"_source":{"user_agent.original":"Mozilla/5.0 (compatible; Googlebot/2.1)"}}]}'
```

Campos típicos tras parseo:

| Campo | Googlebot | Chrome desktop |
|-------|-----------|----------------|
| `user_agent.name` | Googlebot | Chrome |
| `user_agent.os.name` | (varía) | Windows / macOS |
| `user_agent.device.type` | bot | desktop |

---

### Paso 2 — KQL en Discover

Sobre `lab-access-test` (tercera línea del sample simula bot):

```text
user_agent.name : *Googlebot* or user_agent.original : *Googlebot*
```

**Operaciones:** excluir bots de métricas de conversión; alerta si «Googlebot» viene de IP no Google (posible spoof).

---

### Paso 3 — Panel Lens

Donut por `user_agent.name` o `user_agent.os.name`.

Compara proporción bot vs browser — en e-commerce, bots pueden ser >50 % del tráfico HTTP sin ser «usuarios».

---

## Validación

- [ ] Bot vs Chrome distinguibles en datos.
- [ ] Pipeline `lab-enrich-user-agent` cargado.
- [ ] Una frase: cómo combinarías geoIP + user agent en investigación.

---

## Antes de seguir

User agent parsing ayuda a fraudes y scraping; combínalo con geoIP y rate limits en el WAF — Elasticsearch es capa de análisis, no de bloqueo.
