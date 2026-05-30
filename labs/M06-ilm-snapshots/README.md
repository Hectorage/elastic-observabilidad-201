# M06 — Gestión de índices: rollover, snapshots e ILM

[← Página anterior](../M05-dashboards-kibana/M05-04-saved-objects-y-alertas-vista.md) · [Siguiente →](M06-01-politica-ilm-basica.md)

> ⏱️ ~2 h 30 min (4 ejercicios) · 🧩 Elasticsearch healthy

## Qué aprenderás

- Definir políticas **ILM** (hot/warm/delete acelerado para lab) y relacionarlas con retención de negocio.
- Hacer **rollover** en índice con alias (patrón previo a data streams).
- Registrar repositorio **snapshot** como red de seguridad antes de delete.
- Observar la fase **delete** y recuperar desde snapshot (opcional).

> Los ejercicios van en cadena: política (M06-01) → datos y rollover (M06-02) → backup (M06-03) → delete y restore (M06-04). No saltes M06-03 si quieres hacer M06-04 con sentido.

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

Capturas Kibana (ILM y snapshots): [docs/imagenes/](../../docs/imagenes/README.md)
