# Auditbeat

[← Índice](README.md)

## Propósito

Agente orientado a **auditoría y seguridad**. Recoge eventos del kernel (`auditd`), integridad de ficheros (FIM), actividad de procesos, intentos de login y otros datasets de cumplimiento. Cierra el triángulo observabilidad: logs operativos, métricas de rendimiento, trazabilidad de seguridad.

## Rol en el pipeline

```text
  auditd / FIM / system  ──módulos──►  Auditbeat  ──►  Elasticsearch
                                              │
                                    eventos de seguridad (ECS)
```

## Tecnología subyacente

- Beat especializado en **security analytics**.
- Módulo **auditd**: reglas del subsistema audit de Linux (syscalls, accesos, cambios de permisos).
- Módulo **file_integrity** (FIM): hashes y metadatos de paths vigilados; detecta create, modify, delete, rename.
- Módulos **system** (login, procesos, sockets, packages) según SO.
- Eventos con campos ECS: `event.action`, `event.category`, `file.path`, `file.hash.*`, `user.name`, …

## Modo de despliegue

| | |
|---|---|
| **Alta disponibilidad (producción)** | **Uno por host** (o DaemonSet). Mismo modelo edge que Filebeat/Metricbeat: no hay par activo-passive del agente; la cobertura depende de tener Auditbeat en cada sistema a auditar. |
| **Standalone / desarrollo** | Una instancia en host o contenedor (FIM en paths acotados si no hay `auditd`). |
| **En este repositorio** | Un contenedor (`lab-auditbeat`) con módulo file_integrity sobre carpeta montada. |

## Operación y estado

| Área | Qué vigilar |
|------|-------------|
| **Baseline FIM** | Escaneo inicial (`scan_at_start`) puede ser costoso en árboles grandes; acotar paths y exclusiones. |
| **Persistencia de hashes** | Estado local del módulo FIM; pérdida implica rescan completo y posible ráfaga de eventos. |
| **auditd en host** | Requiere reglas cargadas y permisos; conflictos con otras herramientas que usen audit. |
| **Volumen de eventos** | Reglas demasiado amplias generan ruido; tunear exclusiones y rate limits. |
| **Integridad del agente** | Proteger el binario y la config; Auditbeat es target sensible en entornos regulados. |
| **Retención** | Eventos de auditoría suelen exigir políticas ILM más largas o índices dedicados. |
| **Actualizaciones** | Validar compatibilidad de módulos con kernel/auditd del host tras upgrade. |

## Señales y comprobaciones

```bash
auditbeat test config
auditbeat show modules
curl -fsS 'http://localhost:9200/auditbeat-*/_count'
```

Campos útiles en búsqueda: `event.action`, `file.path`, `event.category`, `event.outcome`.

## Documentación oficial

- [Auditbeat overview](https://www.elastic.co/docs/reference/beats/auditbeat)
- [File integrity module](https://www.elastic.co/docs/reference/beats/auditbeat/auditbeat-module-file_integrity)
