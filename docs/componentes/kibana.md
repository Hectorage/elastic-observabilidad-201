# Kibana

[← Índice](README.md)

## Propósito

Capa de **visualización y análisis** sobre Elasticsearch. Discover, dashboards, Lens, alertas, gestión de data views y muchas apps de solución (Observability, Security) viven aquí. Traduce interacciones de usuario (KQL, filtros, agregaciones) en consultas contra Elasticsearch.

## Rol en el pipeline

```text
  Usuario / API  ──HTTP──►  Kibana  ──query──►  Elasticsearch
                               │
                     objetos guardados (.kibana_*)
                     también almacenados en ES
```

Kibana no ingiere telemetría: depende de que los datos ya estén indexados upstream.

## Tecnología subyacente

- Backend **Node.js** + UI **React**.
- **Data views**: alias sobre patrones de índice (`logs-*`, `metrics-*`, …) con campo de tiempo.
- **KQL**: lenguaje de filtrado en Discover y visualizaciones.
- **Saved objects**: dashboards, visualizaciones, reglas de alerta persistidos en índices internos de Elasticsearch.
- **Spaces** y **RBAC** (con seguridad activa): partición lógica y permisos por rol.

## Modo de despliegue

| | |
|---|---|
| **Alta disponibilidad (producción)** | Varias instancias de Kibana **stateless** detrás de un load balancer. El estado (dashboards, data views) vive en Elasticsearch; cualquier instancia puede servir tráfico si ES responde. |
| **Standalone / desarrollo** | Una sola instancia. Caída = UI no disponible (los datos en ES siguen intactos). |
| **En este repositorio** | Una instancia (`lab-kibana`). |

## Operación y estado

| Área | Qué vigilar |
|------|-------------|
| **Disponibilidad** | `/api/status` y estado `available`. Kibana arranca después de ES y tarda más que el nodo de datos. |
| **Conectividad upstream** | `ELASTICSEARCH_HOSTS` correcto, resolución DNS, TLS y credenciales si aplica. |
| **Persistencia** | El estado útil (dashboards, data views) está en Elasticsearch; recrear instancias de Kibana no debería perder objetos guardados si ES está sano. |
| **Recursos** | Memoria del proceso Node; picos con dashboards complejos o muchos usuarios concurrentes. |
| **Versión** | Alineada con la major/minor de Elasticsearch (matriz de compatibilidad Elastic). |
| **Actualizaciones** | Rolling de instancias Kibana tras validar que ES está green/yellow estable. |

## Señales y comprobaciones

```bash
curl -fsS 'http://localhost:5601/api/status'
curl -fsS 'http://localhost:5601/api/status' | grep -E '"level"|"summary"'
```

Logs: errores de conexión a ES, timeouts de query, fallos de migración de saved objects tras upgrade.

## Documentación oficial

- [Kibana overview](https://www.elastic.co/docs/explore-analyze)
- [Discover](https://www.elastic.co/docs/explore-analyze/discover)
- [KQL](https://www.elastic.co/docs/explore-analyze/query-filter/languages/kql)
