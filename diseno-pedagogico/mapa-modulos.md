# Mapa de módulos — Elastic Stack Observabilidad Lab First

## Calendario — 5 sesiones × 5 h (25 h, M01–M12)

| Sesión | Módulos | h lab guiones* |
|--------|---------|----------------|
| **S1** | M01, M02 | ~5 h |
| **S2** | M03, M04 | ~5 h 55 min |
| **S3** | M05, M06 | ~5 h 30 min |
| **S4** | M07, M08 | ~5 h |
| **S5** | M09, M10, M11, M12 | ~10 h |

\* Suma de tiempos ⏱️ de los README por módulo. Las **25 h de sesión** incluyen apertura, demo, checkpoints y cierre — el formador **prioriza** en S2, S3 y S5. Detalle: [ritmo-clase.md](ritmo-clase.md).

---

## Módulos — Observabilidad con Elastic Stack (lab-first)

| Módulo | Título | Lab (README) | Sesión | Objetivo (una frase) |
|--------|--------|--------------|--------|----------------------|
| **M01** | Introducción al Elastic Stack: arquitectura y componentes | ~2 h | S1 | Rol de cada componente y flujo de datos con el stack en marcha. |
| **M02** | Instalación de Elasticsearch, Kibana y Beats | ~3 h | S1 | Clúster Docker Compose, salud del stack, shards y réplicas (M02-05). |
| **M03** | Recolección con Filebeat, Metricbeat y Auditbeat | ~2 h 25 min | S2 | Beats para logs, métricas y auditoría. |
| **M04** | Procesamiento con Logstash y pipelines de ingestión | ~3 h 30 min | S2 | Pipelines Logstash + ingest nativo ES. |
| **M05** | Dashboards en Kibana: logs, métricas y alertas | ~3 h | S3 | Lens, dashboards operativos, saved objects. |
| **M06** | Gestión de índices: rollover, snapshots e ILM | ~2 h 30 min | S3 | ILM, rollover y snapshots. |
| **M07** | Enriquecimiento: geoIP, user agent y grok | ~2 h 30 min | S4 | Parseo y enriquecimiento de access logs. |
| **M08** | Alerting y Watcher | ~2 h 30 min | S4 | Reglas Kibana y Watcher con acciones. |
| **M09** | Seguridad: TLS, usuarios, roles e integración LDAP | ~3 h | S5 | TLS, RBAC, checklist endurecimiento. |
| **M10** | Monitoreo del stack: self-observability | ~2 h | S5 | Salud ES, JVM, Beats, dashboard stack. |
| **M11** | Integración con Kafka, Fluent Bit y Prometheus | ~3 h | S5 | Fuentes/destinos externos; patrón K8s. |
| **M12** | Buenas prácticas de rendimiento y escalabilidad | ~2 h | S5 | Profile, bulk, heap; checklist sizing (cierre). |

**Duración del curso:** **25 h** (5 sesiones × 5 h), **M01–M12**.

**Dinámica:** Codespaces + fork del repo; Docker; perfil `integrations` en S5.

---

## Correspondencia carpeta `labs/`

| Módulo | Carpeta prevista | Estado guiones |
|--------|------------------|----------------|
| M01 | `M01-arquitectura-stack/` | listo |
| M02 | `M02-despliegue-stack/` | listo (5 guiones) |
| M03 | `M03-recoleccion-beats/` | listo |
| M04 | `M04-logstash-pipelines/` | listo (4 guiones) |
| M05 | `M05-dashboards-kibana/` | listo (4 guiones) |
| M06 | `M06-ilm-snapshots/` | listo (4 guiones) |
| M07 | `M07-enriquecimiento-eventos/` | listo (4 guiones) |
| M08 | `M08-alerting-watcher/` | listo (4 guiones) |
| M09 | `M09-seguridad-tls-rbac/` | listo (4 guiones) |
| M10 | `M10-self-observability/` | listo (4 guiones) |
| M11 | `M11-integraciones-externas/` | listo (4 guiones) |
| M12 | `M12-rendimiento-escalabilidad/` | listo (4 guiones) |
