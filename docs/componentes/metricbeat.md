# Metricbeat

[← Índice](README.md)

## Propósito

Agente de **métricas periódicas**. Interroga módulos del sistema operativo, servicios (Docker, Kubernetes, nginx, …) en intervalos configurables y publica series temporales en Elasticsearch. Complementa Filebeat: logs narran *qué pasó*; métricas cuantifican *cómo está* el sistema.

## Rol en el pipeline

```text
  SO / Docker / servicios  ──scrape periódico──►  Metricbeat  ──►  Elasticsearch
                                                          │
                                                   metricbeat-* (data stream)
```

Modelo **pull**: cada `period` dispara una colección; no hay streaming continuo byte a byte.

## Tecnología subyacente

- Runtime **Beats** (Go), misma familia que Filebeat.
- **Módulos** por tecnología (`system`, `docker`, `kubernetes`, …).
- **Metricsets** dentro de cada módulo: subconjuntos concretos (`cpu`, `memory`, `network`, `container`, …).
- Campos alineados con **ECS** (`event.module`, `event.dataset`, `host.*`, `container.*`).
- Agregación local mínima; cada scrape genera uno o más documentos.

## Modo de despliegue

| | |
|---|---|
| **Alta disponibilidad (producción)** | Igual que Filebeat: **uno por host** o DaemonSet en Kubernetes. Sin quorum ni réplicas del agente; HA = despliegue distribuido en toda la flota. |
| **Standalone / desarrollo** | Una instancia local o en contenedor. |
| **En este repositorio** | Un contenedor (`lab-metricbeat`) con acceso al socket Docker del host. |

## Operación y estado

| Área | Qué vigilar |
|------|-------------|
| **Intervalo (`period`)** | Trade-off resolución vs volumen de documentos y carga en ES. |
| **Permisos** | Acceso a `/proc`, cgroups, socket Docker/Kube API según módulo activo. |
| **Conectividad destino** | Misma lógica que Filebeat: bulk failures, cola interna, TLS/auth. |
| **Cardinalidad** | Labels dinámicos (p. ej. IDs efímeros) pueden inflar series; filtrar en config si hace falta. |
| **Despliegue** | Típicamente un Metricbeat por host o DaemonSet; evitar scrapes duplicados del mismo target. |
| **Estado interno** | Sin offset de fichero; reinicio implica hueco de un periodo como mucho, no reprocessing masivo. |
| **Actualizaciones** | Rolling; revisar cambios de metricsets entre versiones. |

## Señales y comprobaciones

```bash
metricbeat test config
metricbeat test modules
curl -fsS 'http://localhost:9200/metricbeat-*/_count'
```

Discover/KQL: filtrar por `event.module`, `event.dataset`, `service.type`.

## Documentación oficial

- [Metricbeat overview](https://www.elastic.co/docs/reference/beats/metricbeat)
- [Docker module](https://www.elastic.co/docs/reference/beats/metricbeat/metricbeat-module-docker)
