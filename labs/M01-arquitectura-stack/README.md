# M01 — Introducción al Elastic Stack: arquitectura y componentes

[← Página anterior](../../README.md) · [Siguiente página →](M01-01-arranque-flujo-completo.md)

> ⏱️ ~2 h (4 ejercicios) · 🧩 Requisitos: GitHub + Codespace con Docker (8 GB RAM recomendado) · 📎 [Chuleta](../CHEATSHEET.md) · [Troubleshooting](../TROUBLESHOOTING.md)

## Qué aprenderás

- **Levantar** el stack de demostración del curso y ver datos en tiempo real.
- **Seguir un evento** desde el fichero de log hasta Discover en Kibana.
- **Inspeccionar** documentos JSON, data streams e índices clásicos con la API y KQL.
- **Detectar** qué falla cuando un componente del pipeline se para.
- Dejar un **checklist operativo** para el resto del curso.

## Contexto

- M01 es **100 % práctico**: primero se ve funcionando, luego se nombran componentes y campos.
- El material preconstruido está en `infra/docker-compose.yml` (no partes de cero).
- La seguridad avanzada (TLS, RBAC) llega en M09; aquí el clúster va sin autenticación para aprender el flujo base.

## Tabla de ejercicios

| ID | Guion | Objetivo |
|----|-------|----------|
| M01-01 | [Arranque y flujo completo](M01-01-arranque-flujo-completo.md) | Stack UP + seguir un evento hasta Kibana |
| M01-02 | [Eventos y data streams](M01-02-eventos-data-streams-campos.md) | API, campos ECS, KQL, índice vs data stream |
| M01-03 | [Romper y reparar](M01-03-romper-reparar-pipeline.md) | Parar Beat/loggen; medir `_count` vs cluster green |
| M01-04 | [Ritual recovery](M01-04-ritual-recovery.md) | `down`/`up` cronometrado + checklist en Discover |

## Convención de nombres

| Qué | Patrón | Ejemplo |
|-----|--------|---------|
| Carpeta del módulo | `Mxx-slug/` | `labs/M01-arquitectura-stack/` |
| Guion de ejercicio | `Mxx-NN-slug.md` | `M01-03-romper-reparar-pipeline.md` |

El slug describe **qué hace el alumno** en ese bloque. El fork y Codespace están en M01-01, no en un directorio “bootstrap” aparte.

## Documentación de apoyo

| Recurso | Enlace |
|---------|--------|
| Componentes del stack | [docs/componentes/](../../docs/componentes/README.md) |
| Enlaces oficiales Elastic (`elastic.co/docs`) | [docs/enlaces-oficiales.md](../../docs/enlaces-oficiales.md) |

## Antes de seguir (cierre M01)

- [ ] Stack completo arriba con `./scripts/health-check.sh` OK.
- [ ] Has visto eventos en Discover y entiendes fuente → Beat → ES → Kibana.
- [ ] Sabes filtrar por `log.source` y por texto en `message`.
