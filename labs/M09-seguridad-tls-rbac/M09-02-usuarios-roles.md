# Laboratorio M09-02 — Usuarios y roles personalizados

[▲ Módulo M09](README.md) · [← Anterior](M09-01-habilitar-seguridad.md) · [Siguiente →](M09-03-tls-beats.md)

> ⏱️ ~45 min · 🧩 Seguridad activa

**Objetivo:** rol `lab_logs_reader` que solo lee `filebeat-*` y usuario `lab_analyst`.

> **Principio de mínimo privilegio:** el analista de logs de aplicación no necesita ver métricas de infra ni índices de auditoría. Roles estrechos limitan impacto de credencial filtrada.

---

### Paso 1 — Rol

Define privilegios sobre índices **y** Kibana (sin Kibana read, el usuario no entra a Discover):

```bash
source infra/.env
curl -fsS -u "elastic:${ELASTIC_PASSWORD}" -X POST 'http://localhost:9200/_security/role/lab_logs_reader' \
  -H 'Content-Type: application/json' \
  -d '{
  "indices": [{
    "names": ["filebeat-*"],
    "privileges": ["read", "view_index_metadata"]
  }],
  "applications": [{
    "application": "kibana-.kibana",
    "privileges": ["read"],
    "resources": ["*"]
  }]
}'
```

| Privilegio | Permite |
|------------|---------|
| `read` | `_search`, `_count` en filebeat |
| `view_index_metadata` | Ver mapping en Stack Management |
| Kibana `read` | Abrir Discover/dashboards (no editar) |

---

### Paso 2 — Usuario

```bash
curl -fsS -u "elastic:${ELASTIC_PASSWORD}" -X POST 'http://localhost:9200/_security/user/lab_analyst' \
  -H 'Content-Type: application/json' \
  -d '{
  "password": "LabAnalyst2026!",
  "roles": ["lab_logs_reader"],
  "full_name": "Lab Analyst"
}'
```

**Producción:** contraseña generada, MFA vía SSO, rotación al cambiar de puesto.

---

### Paso 3 — Probar acceso

```bash
curl -fsS -u 'lab_analyst:LabAnalyst2026!' 'http://localhost:9200/filebeat-*/_count'
curl -fsS -u 'lab_analyst:LabAnalyst2026!' 'http://localhost:9200/metricbeat-*/_count'
```

Salida esperada: filebeat OK; metricbeat **403 Forbidden**.

Documenta el error JSON del segundo curl — es la prueba de RBAC funcionando.

---

### Paso 4 — Login Kibana como analyst

Ventana privada → `lab_analyst` / `LabAnalyst2026!`.

Comprueba: Discover muestra `filebeat-*`; intentar abrir índice metricbeat debería fallar o no listarse. **Spaces** (Kibana) permitirían restringir dashboards por equipo — fuera de alcance del lab.

---

## Validación

- [ ] Rol y usuario creados.
- [ ] metricbeat denegado para analyst (403 en API).
- [ ] filebeat permitido.
- [ ] Puedes nombrar un segundo rol que crearías para equipo de infra (metricbeat only).

---

## Antes de seguir

Un rol por función (logs, metrics, admin). Evita rol «read everything» — derrota el propósito de M09.
