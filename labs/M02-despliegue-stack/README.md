# M02 — Instalación de Elasticsearch, Kibana y Beats

[← Página anterior](../M01-arquitectura-stack/M01-04-ritual-recovery.md) · [Siguiente página →](M02-01-solo-elasticsearch.md)

> ⏱️ ~2 h 20 min (4 ejercicios) · 🧩 Requisitos: M01 completado · 📎 [Chuleta](../CHEATSHEET.md) · [Troubleshooting](../TROUBLESHOOTING.md)

## Qué aprenderás

- Montar el stack **capa a capa**: primero solo Elasticsearch, luego Kibana, luego Filebeat.
- Indexar y buscar con **API REST** antes de abrir la UI.
- Conectar ingesta en vivo y repetir el rastreo de eventos de M01.
- Romper y recuperar el pipeline con runbook operativo.

## Contexto

- En M01 viste el conjunto funcionando; en M02 **desmontas y vuelves a montar** cada pieza.
- Cada ejercicio valida con `curl`, `_count` y Discover — nunca solo lectura.
- Seguridad avanzada (TLS/RBAC) en M09.

## Tabla de ejercicios

| ID | Guion | Objetivo |
|----|-------|----------|
| M02-01 | [Solo Elasticsearch](M02-01-solo-elasticsearch.md) | API + `lab-smoke` + persistencia del volumen |
| M02-02 | [Añadir Kibana](M02-02-kibana-discover.md) | Discover sobre `lab-smoke`; ES caído = UI inútil |
| M02-03 | [Añadir Filebeat](M02-03-filebeat-ingesta-viva.md) | Data stream `filebeat-*` + rastreo de evento |
| M02-04 | [Operación](M02-04-fallos-y-recovery.md) | Fallos, runbook, recovery cronometrado |

**Infra:** `infra/docker-compose.yml`

## Antes de seguir (cierre M02)

- [ ] Puedes levantar ES → Kibana → Beats en ese orden.
- [ ] `lab-smoke` y `filebeat-*` coexisten en el clúster.
- [ ] Tienes runbook para “Discover vacío”.
