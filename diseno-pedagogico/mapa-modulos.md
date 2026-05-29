# Mapa de módulos — Elastic Stack Observabilidad Lab First

## Módulos — Observabilidad con Elastic Stack (lab-first)

| Módulo | Título | Horas aprox. | Objetivo (una frase) |
|--------|--------|--------------|----------------------|
| **M01** | Introducción al Elastic Stack: arquitectura y componentes | 4 h | Identificar el rol de cada componente y el flujo de datos de extremo a extremo con el stack en marcha. |
| **M02** | Instalación de Elasticsearch, Kibana y Beats | 6 h | Levantar un clúster funcional con Docker Compose, validar salud del stack y operar el ciclo básico arranque/parada/configuración. |
| **M03** | Recolección de logs con Filebeat, Metricbeat y Auditbeat | 6 h | Configurar Beats para enviar logs, métricas y eventos de auditoría a Elasticsearch con módulos y salidas correctas. |
| **M04** | Procesamiento con Logstash y pipelines de ingestión | 7 h | Diseñar pipelines que transformen, filtren y enruten eventos usando Logstash e ingest pipelines nativos de Elasticsearch. |
| **M05** | Dashboards en Kibana: logs, métricas y alertas | 6 h | Construir visualizaciones y dashboards orientados a operación y respuesta a incidentes. |
| **M06** | Gestión de índices: rollover, snapshots e ILM | 5 h | Aplicar ILM, políticas de rollover y snapshots para controlar retención, coste y recuperación de datos. |
| **M07** | Enriquecimiento de eventos: geoIP, user agent y grok | 5 h | Parsear y enriquecer campos estructurados a partir de logs sin formato. |
| **M08** | Alerting y Watcher | 5 h | Definir reglas de alerta en Kibana y jobs de Watcher que disparen acciones ante condiciones medibles. |
| **M09** | Seguridad: TLS, usuarios, roles e integración LDAP | 6 h | Endurecer el clúster con TLS, RBAC nativo e integración de autenticación externa. |
| **M10** | Monitoreo del stack: self-observability | 4 h | Monitorizar salud de Elasticsearch, nodos, colas y Beats con métricas y logs del propio stack. |
| **M11** | Integración con Kafka, Fluent Bit y Prometheus | 6 h | Integrar fuentes y destinos externos sin romper el pipeline central. |
| **M12** | Buenas prácticas de rendimiento y escalabilidad | 4 h | Diagnosticar cuellos de botella y aplicar criterios de sizing/tuning en escenarios realistas. |

**Duración total orientativa:** 64 h.

**Dinámica del curso:** Codespaces desde fork del repo; Docker como base; kind cuando sea viable (M11).

## Correspondencia carpeta `labs/`

| Módulo | Carpeta prevista | Estado guiones |
|--------|------------------|----------------|
| M01 | `M01-arquitectura-stack/` | listo |
| M02 | `M02-despliegue-stack/` | listo |
| M03 | `M03-recoleccion-beats/` | listo |
| M04 | `M04-logstash-pipelines/` | en elaboración |
| M05 | `M05-dashboards-kibana/` | en elaboración |
| M06 | `M06-ilm-snapshots/` | en elaboración |
| M07 | `M07-enriquecimiento-eventos/` | en elaboración |
| M08 | `M08-alerting-watcher/` | en elaboración |
| M09 | `M09-seguridad-tls-rbac/` | en elaboración |
| M10 | `M10-self-observability/` | en elaboración |
| M11 | `M11-integraciones-externas/` | en elaboración |
| M12 | `M12-rendimiento-escalabilidad/` | en elaboración |
