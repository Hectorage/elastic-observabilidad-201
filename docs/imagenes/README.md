# Capturas de interfaz (Kibana 8.17.2)

Imágenes **reales** del stack local (`docker compose --profile beats up -d`), no mockups. Se regeneran con:

```bash
npm install          # una vez; requiere Google Chrome en el PATH
npm run capture-screenshots      # capturas generales (M01–M06, M08, M10…)
npm run capture-m05-screenshots  # capturas del flujo M05 (Lens, dashboards, alertas)
```

Requisitos: Elasticsearch y Kibana en marcha, perfil `beats` activo para capturas de `filebeat-*`. El script ejecuta `setup-ilm-lab.sh` y prepara snapshot de demo para M06.

## Catálogo

| Archivo | Pantalla | Labs / docs |
|---------|----------|-------------|
| `kibana-discover-sin-data-view.png` | Discover sin data view | M01-01, [guia Discover](../guia-kibana-discover-data-view.md) |
| `kibana-crear-data-view.png` | Formulario Create data view | M01-01, guía Discover |
| `kibana-data-views-list.png` | Stack Management → Data Views | guía Discover, M02-02 |
| `kibana-discover-con-eventos.png` | Discover con `filebeat-*` y KQL | M01-01, M01-02, M03+, guía Discover |
| `kibana-discover-fila-expandida.png` | Discover — tabla de documentos | guía Discover (expandir fila) |
| `kibana-discover-lab-smoke.png` | Discover — índice `lab-smoke` | M02-02 |
| `kibana-index-management.png` | Index Management (todos los índices) | M02-02, M01-02 |
| `kibana-ilm-policies-list.png` | Index Lifecycle Policies | M06-01 |
| `kibana-ilm-policy-lab-hot-warm-delete.png` | Política ILM `lab-hot-warm-delete` | M06-01 |
| `kibana-index-management-ilm-indices.png` | Index Management — `lab-ilm-demo-*` | M06-02, M06-04 |
| `kibana-snapshot-repositories.png` | Snapshot and Restore → Repositories | M06-03 |
| `kibana-snapshots-list.png` | Snapshot and Restore → Snapshots | M06-03 |
| `kibana-lens-editor.png` | Lens (editor vacío) | referencia genérica |
| `kibana-dashboards-list.png` | Biblioteca de dashboards | M10-04 |
| `kibana-observability-alerts.png` | Observability → Alerts | M08 |
| `kibana-alerting-rules.png` | Stack Management → Rules | M08 |
| `kibana-saved-objects.png` | Saved Objects (listado general) | M12-04 |
| `kibana-stack-monitoring.png` | Stack Monitoring (estado inicial) | M10-01 |

### M05 — Dashboards y Lens (flujo completo)

Generadas con `npm run capture-m05-screenshots` (stack `--profile beats`, runtime fields en `filebeat-*`).

| Archivo | Pantalla | Lab |
|---------|----------|-----|
| `m05-discover-demo-app.png` | Discover — `log_source : "demo-app"` | M05-01 |
| `m05-lens-donut-status.png` | Lens — `status_code` + KQL demo-app | M05-01 |
| `m05-lens-metric-error.png` | Lens — métrica errores 5xx | M05-02 |
| `m05-lens-line-latency.png` | Lens — latencia vs tiempo | M05-02 |
| `m05-dashboard-ops-logs.png` | Dashboard operativo (3 paneles) | M05-02 |
| `m05-discover-metricbeat-docker.png` | Discover — CPU Docker | M05-03 |
| `m05-lens-cpu-docker.png` | Lens — `docker.cpu.total.pct` | M05-03 |
| `m05-dashboard-host-metrics.png` | Dashboard métricas host | M05-03 |
| `m05-visualize-library.png` | Visualize Library | M05-04 |
| `m05-saved-objects-lab.png` | Saved Objects — filtro `lab-m05` | M05-04 |
| `m05-alert-create-rule.png` | Crear regla Elasticsearch query | M05-04 |
| `m05-observability-alerts.png` | Observability → Alerts | M05-04, M08 |
| `m05-alert-rule-list.png` | Stack Management → Rules | M05-04, M08 |

Script M05: [`scripts/capture-m05-screenshots.mjs`](../../scripts/capture-m05-screenshots.mjs).

Script general: [`scripts/capture-kibana-screenshots.mjs`](../../scripts/capture-kibana-screenshots.mjs).
