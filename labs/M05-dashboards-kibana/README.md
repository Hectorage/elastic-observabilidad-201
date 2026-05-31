# M05 — Dashboards en Kibana: logs, métricas y alertas

[← Página anterior](../M04-logstash-pipelines/M04-04-rutas-condicionales.md) · [Siguiente página →](M05-01-lens-primeros-pasos.md)

> ⏱️ ~3 h (4 ejercicios) · 🧩 M03 (datos en las tres familias) · 📎 [Chuleta](../CHEATSHEET.md)

## Qué aprenderás

- Crear visualizaciones **Lens** desde Discover (donut, métrica, línea).
- Montar un **dashboard operativo** de logs (errores, latencia, status).
- Añadir panel de **métricas Docker** del mismo host.
- Exportar objetos guardados y enlazar **reglas de alerta** (vista previa).

## Stack recomendado

```bash
# Mínimo — logs y métricas (M05 funciona con runtime fields en el data view)
docker compose -f infra/docker-compose.yml --profile beats up -d

# Opcional — campos ECS parseados (M04 completado)
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.logstash.yml \
  --profile beats --profile logstash up -d
```

**Capturas del módulo:** tras levantar el stack, `npm run capture-m05-screenshots` regenera las 13 PNG en `docs/imagenes/kibana/m05-*.png`.

## Tabla de ejercicios

| ID | Guion | Objetivo | Capturas clave |
|----|-------|----------|----------------|
| M05-01 | [Lens primeros pasos](M05-01-lens-primeros-pasos.md) | Donut por `status_code` | Discover, Lens donut |
| M05-02 | [Dashboard logs](M05-02-dashboard-logs-operacion.md) | Errores + latencia + status | Métrica, línea, dashboard ops |
| M05-03 | [Dashboard métricas](M05-03-dashboard-metricas-host.md) | CPU Docker + correlación | Discover metricbeat, Lens CPU |
| M05-04 | [Saved objects](M05-04-saved-objects-y-alertas-vista.md) | Export/import + regla umbral | Saved Objects, Alerts |

## Galería rápida

| Imagen | Pantalla |
|--------|----------|
| [m05-discover-demo-app.png](../../docs/imagenes/kibana/m05-discover-demo-app.png) | Discover — `demo-app` |
| [m05-lens-donut-status.png](../../docs/imagenes/kibana/m05-lens-donut-status.png) | Lens — status codes |
| [m05-dashboard-ops-logs.png](../../docs/imagenes/kibana/m05-dashboard-ops-logs.png) | Dashboard operativo |
| [m05-dashboard-host-metrics.png](../../docs/imagenes/kibana/m05-dashboard-host-metrics.png) | Dashboard métricas |

Catálogo completo: [`docs/imagenes/README.md`](../../docs/imagenes/README.md).
