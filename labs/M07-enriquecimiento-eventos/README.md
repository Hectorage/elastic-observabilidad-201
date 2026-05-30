# M07 — Enriquecimiento: grok, geoIP y user agent

[← Página anterior](../M06-ilm-snapshots/M06-04-fase-delete-lab.md) · [Siguiente →](M07-01-grok-access-logs.md)

> ⏱️ ~2 h 30 min · 🧩 `access-lab.log` en `infra/samples/logs/`

## Qué aprenderás

- Parsear logs **nginx/access** a campos ECS (`client.ip`, `http.response.status_code`).
- Enriquecer con **GeoIP** y **user agent** (bots vs humanos).
- Operar pipeline compuesto `lab-enrich-completo` y medir calidad bajo bulk.

## Contexto

- M04 parseó logs `demo-app` en Logstash/ingest; M07 aplica el mismo pensamiento a **access logs** estáticos.
- Los pipelines viven en `infra/ingest-pipelines/` y se despliegan con `./scripts/apply-ingest-pipelines.sh`.
- M08 alertas y M05 Lens funcionan mejor con campos tipados que produce este módulo.

## Tabla de ejercicios

| ID | Guion | Objetivo |
|----|-------|----------|
| M07-01 | [Grok access logs](M07-01-grok-access-logs.md) | Parseo nginx |
| M07-02 | [GeoIP](M07-02-geoip-cliente.md) | `client.geo` |
| M07-03 | [User agent](M07-03-user-agent-parse.md) | Navegador/bot |
| M07-04 | [Pipeline completo](M07-04-pipeline-enriquecimiento-completo.md) | Bulk + checklist calidad |

```bash
./scripts/apply-ingest-pipelines.sh
```

## Antes de seguir (cierre M07)

- [ ] `_simulate` y bulk devuelven campos ECS esperados.
- [ ] Sabes orden grok → geoip → user_agent.
- [ ] Puedes nombrar un dashboard de fraude/geo que construirías con estos campos.
