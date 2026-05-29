# Elastic Stack Observabilidad Lab First

Curso **100 % laboratorio** para montar y operar un stack ELK en Docker: Elasticsearch, Kibana y Beats (Filebeat, Metricbeat, Auditbeat).  
Versión del stack: **8.17.2** · Entorno: **GitHub Codespaces** + fork de este repo.

---

## Empieza aquí (3 pasos)

1. Haz **fork** del repositorio y abre un **Codespace** (8 GB RAM recomendado).
2. Abre el primer guion: **[M01-01 — Arranque y flujo completo](labs/M01-arquitectura-stack/M01-01-arranque-flujo-completo.md)**.
3. Sigue los enlaces **Siguiente página →** al final de cada ejercicio; no saltes el orden.

Índice de módulos: [labs/README.md](labs/README.md)

---

## Qué es este curso

Aprenderás observabilidad **haciendo**, no leyendo diapositivas:

- Levantarás el stack con el `docker-compose` del repo.
- Verás logs y métricas en **Kibana Discover**.
- Pararás y arrancarás componentes para entender qué falla cuando algo no cuadra.

Cada ejercicio indica **salida esperada**, checklist de **Validación** y bloque **Antes de seguir** (ideas clave + retos opcionales).

---

## El pipeline que montarás

```text
  loggen / ficheros de log
           │
           ▼
       Filebeat ──────────► Elasticsearch :9200
           │                      ▲
    Metricbeat ──────────────────┤
           │                      │
    Auditbeat ───────────────────┘
                                  │
                                  ▼
                            Kibana :5601
                           (Discover)
```

Logstash, alertas avanzadas e integraciones (Kafka, Fluent Bit…) entran en módulos posteriores (M04+).

---

## Mapa completo del curso (M01–M12)

**Duración total orientativa:** 64 h · Detalle de objetivos: [diseno-pedagogico/mapa-modulos.md](diseno-pedagogico/mapa-modulos.md)

| # | Módulo | Horas | Carpeta (labs/) | Estado |
|---|--------|-------|-----------------|--------|
| M01 | Arquitectura y componentes del Elastic Stack | 4 h | [M01-arquitectura-stack/](labs/M01-arquitectura-stack/README.md) | listo |
| M02 | Instalación de Elasticsearch, Kibana y Beats | 6 h | [M02-despliegue-stack/](labs/M02-despliegue-stack/README.md) | listo |
| M03 | Filebeat, Metricbeat y Auditbeat | 6 h | [M03-recoleccion-beats/](labs/M03-recoleccion-beats/README.md) | listo |
| M04 | Logstash e ingest pipelines | 7 h | `M04-logstash-pipelines/` | en elaboración |
| M05 | Dashboards y alertas en Kibana | 6 h | `M05-dashboards-kibana/` | en elaboración |
| M06 | ILM, rollover y snapshots | 5 h | `M06-ilm-snapshots/` | en elaboración |
| M07 | Enriquecimiento: grok, geoIP, user agent | 5 h | `M07-enriquecimiento-eventos/` | en elaboración |
| M08 | Alerting y Watcher | 5 h | `M08-alerting-watcher/` | en elaboración |
| M09 | Seguridad: TLS, RBAC, LDAP | 6 h | `M09-seguridad-tls-rbac/` | en elaboración |
| M10 | Self-observability del stack | 4 h | `M10-self-observability/` | en elaboración |
| M11 | Kafka, Fluent Bit, Prometheus / K8s | 6 h | `M11-integraciones-externas/` | en elaboración |
| M12 | Rendimiento y escalabilidad | 4 h | `M12-rendimiento-escalabilidad/` | en elaboración |

**Primera capa publicada:** M01–M03 (~16 h). El resto del temario sigue el orden de la tabla; las carpetas `M04-*` … `M12-*` se irán añadiendo con sus guiones lab-first.

---

## Al cerrar M03, deberías poder

- Explicar el recorrido **fuente → Beat → Elasticsearch → Kibana** con un ejemplo real.
- Leer `_cluster/health`, `_count` y un documento en `_search`.
- Filtrar en Discover con KQL (`log.source`, `message`, `host.name`).
- Diferenciar data streams (`filebeat-*`) de un índice clásico (`lab-smoke`).
- Tener logs, métricas y eventos de auditoría en el mismo clúster.

---

## Si algo no funciona

| Situación | Recurso |
|-----------|---------|
| Comprobar salud del entorno | `./scripts/health-check.sh` |
| Síntoma → causa → solución | [labs/TROUBLESHOOTING.md](labs/TROUBLESHOOTING.md) |
| Comandos y KQL frecuentes | [labs/CHEATSHEET.md](labs/CHEATSHEET.md) |
| Docker / versiones / Beats | [infra/README.md](infra/README.md) |
| Documentación Elastic (URLs actuales) | [docs/enlaces-oficiales.md](docs/enlaces-oficiales.md) |

---

## Estructura del repositorio

```text
labs/Mxx-slug/          Guiones de laboratorio (M01-01-*.md, …)
infra/                  docker-compose.yml, configs de Beats
scripts/                health-check.sh
diseno-pedagogico/      [mapa-modulos.md](diseno-pedagogico/mapa-modulos.md), [ritmo-clase.md](diseno-pedagogico/ritmo-clase.md), guía del formador
```

Convención de nombres: carpeta `M02-despliegue-stack/`, ejercicio `M02-03-filebeat-ingesta-viva.md`.

---

## Siguiente paso

→ **[Abrir M01-01](labs/M01-arquitectura-stack/M01-01-arranque-flujo-completo.md)**
