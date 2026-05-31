# Elastic Stack Observabilidad Lab First

Curso **100 % laboratorio** para montar y operar un stack ELK en Docker: Elasticsearch, Kibana, Beats, Logstash, ILM, alertas e integraciones.  
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
- Verás logs y métricas en **Kibana Discover** y dashboards.
- Procesarás eventos con **Logstash** e **ingest pipelines**.
- Gestionarás retención con **ILM**, alertarás y endurecerás el clúster en **M09**.

Cada ejercicio indica **salida esperada**, checklist de **Validación** y bloque **Antes de seguir**.

---

## El pipeline que montarás

```text
  loggen / ficheros / Fluent Bit
           │
           ▼
       Filebeat ──► Logstash (M04) ──► Elasticsearch :9200
           │              ▲                  ▲
    Metricbeat ───────────┴──────────────────┤
           │                                 │
    Auditbeat ──────────────────────────────┘
                                            │
                                            ▼
                                      Kibana :5601
                              (Discover, dashboards, alertas)
```

Kafka/Redpanda (M11) y Prometheus entran como integraciones opcionales.

---

## Mapa completo del curso (M01–M12)

**Duración:** **5 sesiones × 5 h = 25 h** — **M01–M12** en aula

| Sesión | Módulos |
|--------|---------|
| S1 | M01, M02 |
| S2 | M03, M04 |
| S3 | M05, M06 |
| S4 | M07, M08 |
| S5 | M09, M10, M11, M12 |

| # | Módulo | Carpeta (labs/) | Estado |
|---|--------|-----------------|--------|
| M01 | Arquitectura y componentes | [M01-arquitectura-stack/](labs/M01-arquitectura-stack/README.md) | listo |
| M02 | Instalación ES, Kibana y Beats | [M02-despliegue-stack/](labs/M02-despliegue-stack/README.md) | listo |
| M03 | Filebeat, Metricbeat, Auditbeat | [M03-recoleccion-beats/](labs/M03-recoleccion-beats/README.md) | listo |
| M04 | Logstash e ingest pipelines | [M04-logstash-pipelines/](labs/M04-logstash-pipelines/README.md) | listo |
| M05 | Dashboards y alertas en Kibana | [M05-dashboards-kibana/](labs/M05-dashboards-kibana/README.md) | listo |
| M06 | ILM, rollover y snapshots | [M06-ilm-snapshots/](labs/M06-ilm-snapshots/README.md) | listo |
| M07 | Enriquecimiento: grok, geoIP, UA | [M07-enriquecimiento-eventos/](labs/M07-enriquecimiento-eventos/README.md) | listo |
| M08 | Alerting y Watcher | [M08-alerting-watcher/](labs/M08-alerting-watcher/README.md) | listo |
| M09 | Seguridad: TLS, RBAC, LDAP | [M09-seguridad-tls-rbac/](labs/M09-seguridad-tls-rbac/README.md) | listo |
| M10 | Self-observability del stack | [M10-self-observability/](labs/M10-self-observability/README.md) | listo |
| M11 | Kafka, Fluent Bit, Prometheus | [M11-integraciones-externas/](labs/M11-integraciones-externas/README.md) | listo |
| M12 | Rendimiento y escalabilidad | [M12-rendimiento-escalabilidad/](labs/M12-rendimiento-escalabilidad/README.md) | listo |

---

## Al cerrar el curso, deberías poder

- Diseñar un pipeline **fuente → procesamiento → ES → Kibana** con criterio Logstash vs ingest.
- Operar **ILM**, snapshots y dashboards operativos.
- Definir **alertas** (Kibana + Watcher) y aplicar **RBAC** básico.
- Integrar **Fluent Bit / Kafka / Prometheus** y razonar sobre sizing.

---

## Si algo no funciona

| Situación | Recurso |
|-----------|---------|
| Comprobar salud del entorno | `./scripts/health-check.sh` |
| Síntoma → causa → solución | [labs/TROUBLESHOOTING.md](labs/TROUBLESHOOTING.md) |
| Qué hace cada servicio del compose | [docs/componentes/](docs/componentes/README.md) |
| CAP y consistencia del pipeline | [docs/cap-y-consistencia-stack.md](docs/cap-y-consistencia-stack.md) |
| Comandos y KQL frecuentes | [labs/CHEATSHEET.md](labs/CHEATSHEET.md) |
| Docker / perfiles compose | [infra/README.md](infra/README.md) |
| Documentación Elastic | [docs/enlaces-oficiales.md](docs/enlaces-oficiales.md) |

---

## Estructura del repositorio

```text
labs/Mxx-slug/          Guiones (Mxx-NN-slug.md)
docs/componentes/       Referencia por servicio (ES, Kibana, Beats, loggen)
docs/cap-y-consistencia-stack.md  CAP y garantías del pipeline
infra/                  docker-compose + overrides (logstash, security, integrations)
infra/ingest-pipelines/ JSON de pipelines (M04/M07)
scripts/                health-check, apply-ingest-pipelines, setup-ilm-lab
```

Convención: carpeta `M04-logstash-pipelines/`, ejercicio `M04-01-logstash-en-el-camino.md`.

---

## Siguiente paso

→ **[Abrir M01-01](labs/M01-arquitectura-stack/M01-01-arranque-flujo-completo.md)**
