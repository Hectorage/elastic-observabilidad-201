# M05 — Dashboards en Kibana: logs, métricas y alertas

[← Página anterior](../M04-logstash-pipelines/M04-04-rutas-condicionales.md) · [Siguiente página →](M05-01-lens-primeros-pasos.md)

> ⏱️ ~3 h (4 ejercicios) · 🧩 M03 (datos en las tres familias) · 📎 [Chuleta](../CHEATSHEET.md)

## Qué aprenderás

- Crear visualizaciones **Lens** desde Discover.
- Montar un **dashboard operativo** de logs (errores, latencia).
- Añadir panel de **métricas Docker** del mismo host.
- Exportar objetos guardados y enlazar **reglas de alerta** (vista previa).

## Tabla de ejercicios

| ID | Guion | Objetivo |
|----|-------|----------|
| M05-01 | [Lens primeros pasos](M05-01-lens-primeros-pasos.md) | Barras por `http.response.status_code` |
| M05-02 | [Dashboard logs](M05-02-dashboard-logs-operacion.md) | Tablero errores + latencia |
| M05-03 | [Dashboard métricas](M05-03-dashboard-metricas-host.md) | CPU/memoria + correlación |
| M05-04 | [Saved objects](M05-04-saved-objects-y-alertas-vista.md) | Export/import + regla umbral |

```bash
docker compose -f infra/docker-compose.yml --profile beats up -d
```
