# Capturas de interfaz (Kibana 8.17.2)

Imágenes **reales** del stack local (`docker compose --profile beats up -d`), no mockups. Se regeneran con:

```bash
npm install          # una vez; requiere Google Chrome en el PATH
npm run capture-screenshots
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
| `kibana-lens-editor.png` | Lens (editor vacío) | M05-01 |
| `kibana-dashboards-list.png` | Biblioteca de dashboards | M05-02, M10-04 |
| `kibana-observability-alerts.png` | Observability → Alerts | M08, M05-04 |
| `kibana-alerting-rules.png` | Stack Management → Rules | M08 |
| `kibana-saved-objects.png` | Saved Objects | M05-04, M12-04 |
| `kibana-stack-monitoring.png` | Stack Monitoring (estado inicial) | M10-01 |

Script: [`scripts/capture-kibana-screenshots.mjs`](../../scripts/capture-kibana-screenshots.mjs).
