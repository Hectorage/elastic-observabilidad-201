# Ritmo de clase — Elastic Stack Observabilidad Lab First

## Formato del curso

| | |
|---|---|
| **Sesiones** | 5 |
| **Duración por sesión** | 5 h |
| **Total** | **25 h** |
| **Alcance** | **M01–M12 completos** en aula |

Todo el temario del repo se imparte en estas **5 sesiones**. El ritmo es **intensivo** respecto a la suma de tiempos ⏱️ de los guiones (~32 h de laboratorio): el formador prioriza checkpoints y ejercicios con artefacto verificable; el detalle fino de reparto se ajusta en vivo.

---

## Patrón por sesión (5 h)

| Bloque | Duración | Qué ocurre |
|--------|----------|------------|
| Apertura | 15 min | Objetivo del día, `./scripts/health-check.sh`, Codespace/Kibana OK |
| Demo guiada | 15 min | Primer ejercicio del bloque con validación en vivo |
| Laboratorio | 3 h 30 min | Guiones Mxx-NN (uno o dos módulos según sesión) |
| Checkpoint | 15 min | Artefacto verificable (índice, dashboard, regla, ILM…) |
| Cierre | 15 min | «Antes de seguir», dudas, preparación sesión siguiente |

---

## Sesión 1 — Arquitectura y despliegue (5 h)

| Módulo | Ejercicios | h lab (guion) |
|--------|------------|---------------|
| **M01** | M01-01 → M01-04 | ~2 h |
| **M02** | M02-01 → M02-05 | ~3 h |

**Entregables:** stack `--profile beats` UP; Discover con `demo-app`; `lab-smoke`; ritual recovery; shards/réplicas (M02-05).

---

## Sesión 2 — Beats y procesamiento (5 h)

| Módulo | Ejercicios | h lab (guion) |
|--------|------------|---------------|
| **M03** | M03-01 → M03-04 | ~2 h 25 min |
| **M04** | M04-01 → M04-04 | ~3 h 30 min |

**Entregables:** tres familias Beats; Filebeat → Logstash; grok; ingest pipeline nativo; rutas condicionales.

---

## Sesión 3 — Dashboards y retención (5 h)

| Módulo | Ejercicios | h lab (guion) |
|--------|------------|---------------|
| **M05** | M05-01 → M05-04 | ~3 h |
| **M06** | M06-01 → M06-04 | ~2 h 30 min |

**Entregables:** dashboards `lab-m05-*`; export NDJSON; ILM `lab-hot-warm-delete`; snapshot en `lab_fs`.

---

## Sesión 4 — Enriquecimiento y alertas (5 h)

| Módulo | Ejercicios | h lab (guion) |
|--------|------------|---------------|
| **M07** | M07-01 → M07-04 | ~2 h 30 min |
| **M08** | M08-01 → M08-04 | ~2 h 30 min |

**Entregables:** pipeline access enriquecido; reglas Kibana; watch con webhook (M08).

---

## Sesión 5 — Seguridad, integraciones y cierre (5 h)

| Módulo | Ejercicios | h lab (guion) |
|--------|------------|---------------|
| **M09** | M09-01 → M09-04 | ~3 h |
| **M10** | M10-01 → M10-04 | ~2 h |
| **M11** | M11-01 → M11-04 | ~3 h |
| **M12** | M12-01 → M12-04 | ~2 h |

**Nota sesión 5:** es la más cargada en guiones. Prioridad en aula: **M09-01** (seguridad ON), **M10-04** (dashboard salud), **M12-04** (checklist sizing y cierre). M11: como mínimo **M11-01** (Fluent Bit) + **M11-04** (diagrama K8s); Kafka/Prometheus según tiempo. M12-01–03: profile/bulk/heap si el grupo llega.

**Entregables mínimos S5:** login `elastic`; dashboard `lab-m10-stack-health`; checklist sizing; al menos una integración externa demostrada (Fluent Bit o Redpanda).

---

## Resumen visual

```text
S1  M01 ── M02                    arquitectura + despliegue
S2  M03 ── M04                    beats + logstash/pipelines
S3  M05 ── M06                    dashboards + ILM
S4  M07 ── M08                    enriquecimiento + alertas
S5  M09 ── M10 ── M11 ── M12      seguridad + self-mon + integraciones + cierre
```

---

## Ajustes operativos

- **15 min** al inicio de cada sesión: `health-check.sh` y acceso Kibana.
- **M09** reinicia el stack con `docker-compose.security.yml` — reservar inicio de S5 para el recreate; avisar antes.
- **M11** perfil `integrations`: levantar solo los servicios del ejercicio en curso.
- **M11 kind/ECK:** diagrama M11-04 si RAM &lt; 16 GB.
- Priorizar ejercicios con checklist **Validación** completa antes de opcionales y retos.
