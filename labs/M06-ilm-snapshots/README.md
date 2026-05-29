# M06 — Gestión de índices: rollover, snapshots e ILM

[← Página anterior](../M05-dashboards-kibana/M05-04-saved-objects-y-alertas-vista.md) · [Siguiente →](M06-01-politica-ilm-basica.md)

> ⏱️ ~2 h 30 min (4 ejercicios) · 🧩 Elasticsearch healthy

## Qué aprenderás

- Definir políticas **ILM** (hot/warm/delete acelerado para lab).
- Hacer **rollover** en índice con alias.
- Registrar repositorio **snapshot** en filesystem.
- Observar la fase **delete** en índice de prueba.

## Tabla de ejercicios

| ID | Guion | Objetivo |
|----|-------|----------|
| M06-01 | [Política ILM](M06-01-politica-ilm-basica.md) | `lab-hot-warm-delete` |
| M06-02 | [Rollover](M06-02-rollover-alias.md) | Nuevo backing index |
| M06-03 | [Snapshots](M06-03-snapshot-repositorio.md) | Backup `_snapshot` |
| M06-04 | [Fase delete](M06-04-fase-delete-lab.md) | Retención corta |

```bash
./scripts/setup-ilm-lab.sh
```
