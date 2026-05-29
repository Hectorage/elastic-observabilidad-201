# M09 — Seguridad: TLS, usuarios, roles e integración LDAP

[← Página anterior](../M08-alerting-watcher/M08-04-accion-webhook.md) · [Siguiente →](M09-01-habilitar-seguridad.md)

> ⏱️ ~3 h · ⚠️ **Reinicia el stack** con `docker-compose.security.yml`

## Aviso

Este módulo **activa autenticación**. Tras M09-01 dejarás de usar `curl` anónimo hasta pasar credenciales. Reserva un Codespace o haz backup de datos si los necesitas.

## Tabla de ejercicios

| ID | Guion | Objetivo |
|----|-------|----------|
| M09-01 | [Habilitar seguridad](M09-01-habilitar-seguridad.md) | `elastic` + login Kibana |
| M09-02 | [Usuarios y roles](M09-02-usuarios-roles.md) | Rol solo logs |
| M09-03 | [TLS conceptos](M09-03-tls-beats.md) | HTTPS y certificados |
| M09-04 | [LDAP patrón](M09-04-ldap-patron.md) | Realm nativo vs LDAP |

```bash
# En infra/.env define ELASTIC_PASSWORD y KIBANA_SYSTEM_PASSWORD
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.security.yml down -v   # solo si aceptas borrar datos
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.security.yml --profile beats up -d
```
