# M07 — Enriquecimiento: grok, geoIP y user agent

[← Página anterior](../M06-ilm-snapshots/M06-04-fase-delete-lab.md) · [Siguiente →](M07-01-grok-access-logs.md)

> ⏱️ ~2 h 30 min · 🧩 `access-lab.log` en `infra/samples/logs/`

## Tabla de ejercicios

| ID | Guion | Objetivo |
|----|-------|----------|
| M07-01 | [Grok access logs](M07-01-grok-access-logs.md) | Parseo nginx |
| M07-02 | [GeoIP](M07-02-geoip-cliente.md) | `client.geo` |
| M07-03 | [User agent](M07-03-user-agent-parse.md) | Navegador/bot |
| M07-04 | [Pipeline completo](M07-04-pipeline-enriquecimiento-completo.md) | `lab-enrich-completo` |

```bash
./scripts/apply-ingest-pipelines.sh
```
