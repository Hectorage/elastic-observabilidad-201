# M08 — Alerting y Watcher

[← Página anterior](../M07-enriquecimiento-eventos/M07-04-pipeline-enriquecimiento-completo.md) · [Siguiente →](M08-01-regla-umbral-metricas.md)

> ⏱️ ~2 h 30 min · 🧩 Stack sin seguridad (Watcher API abierta)

## Qué aprenderás

- Reglas **Kibana** (metric threshold, Elasticsearch query) — camino operativo habitual.
- **Watcher** por API para orquestación versionable en Git.
- Acciones **log** y **webhook**; equilibrio sensibilidad vs ruido.

## Contexto

- M05-04 introdujo una regla simple; M08 profundiza baseline, umbrales y Watcher.
- Cada guion incluye tablas de diagnóstico cuando la regla no dispara.
- M09 restringirá API — anota qué roles necesitarían reglas en prod.

## Tabla de ejercicios

| ID | Guion | Objetivo |
|----|-------|----------|
| M08-01 | [Regla métricas](M08-01-regla-umbral-metricas.md) | CPU Docker — baseline + umbral |
| M08-02 | [Regla logs](M08-02-regla-errores-logs.md) | Burst 500 — ventana + count |
| M08-03 | [Watcher](M08-03-watcher-query.md) | Watch JSON vs regla UI |
| M08-04 | [Webhook simulado](M08-04-accion-webhook.md) | Integración externa |

Capturas Kibana: [docs/imagenes/](../../docs/imagenes/README.md)

## Antes de seguir (cierre M08)

- [ ] Al menos una regla disparada o explicación documentada con `_count`.
- [ ] Sabes cuándo Watcher vs Kibana rules.
- [ ] Watch de lab eliminado (M08-04).
