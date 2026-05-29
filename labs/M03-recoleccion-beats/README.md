# M03 — Recolección con Filebeat, Metricbeat y Auditbeat

[← Página anterior](../M02-despliegue-stack/M02-04-fallos-y-recovery.md) · [Siguiente página →](M03-01-dos-origenes-logs.md)

> ⏱️ ~2 h 25 min (4 ejercicios) · 🧩 Requisitos: M02 completado · 📎 [Chuleta](../CHEATSHEET.md) · [Troubleshooting](../TROUBLESHOOTING.md)

## Qué aprenderás

- Separar orígenes de logs en el mismo Filebeat (app vs sistema simulado).
- Arreglar stack traces con **multiline** (antes/después medido con `_count`).
- Ingerir métricas Docker y **correlacionar** con logs por `host.name` y tiempo.
- Generar auditoría FIM y alinear **tres familias** en Discover.

## Contexto

- M03 usa el stack ya montado en M02; cada paso **genera datos** (ficheros, cambios, stress logs).
- Los ejercicios miden efecto en API y UI, no rellenan tablas vacías.
- M04 añadirá Logstash / ingest pipelines para parseo más pesado.

## Tabla de ejercicios

| ID | Guion | Objetivo |
|----|-------|----------|
| M03-01 | [Dos orígenes de logs](M03-01-dos-origenes-logs.md) | `demo-app` vs `sshd` + campo `environment` |
| M03-02 | [Multiline](M03-02-multiline-stack-trace.md) | Un stack trace = un documento |
| M03-03 | [Metricbeat Docker](M03-03-metricbeat-docker-correlacion.md) | Métricas + correlación con logs ERROR |
| M03-04 | [Auditbeat y cierre](M03-04-auditbeat-tres-familias.md) | FIM + tres familias en health-check |

```bash
docker compose -f infra/docker-compose.yml --profile beats up -d
```

## Antes de seguir (cierre M03)

- [ ] Tres data views operativas: `filebeat-*`, `metricbeat-*`, `auditbeat-*`.
- [ ] Correlacionas por `host.name` y `@timestamp`.
- [ ] `./scripts/health-check.sh` muestra las tres familias con documentos.
