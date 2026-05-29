# Laboratorio M09-02 — Usuarios y roles personalizados

[▲ Módulo M09](README.md) · [← Anterior](M09-01-habilitar-seguridad.md) · [Siguiente →](M09-03-tls-beats.md)

> ⏱️ ~45 min · 🧩 Seguridad activa

**Objetivo:** rol `lab_logs_reader` que solo lee `filebeat-*` y usuario `lab_analyst`.

---

### Paso 1 — Rol

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

---

### Paso 3 — Probar acceso

```bash
curl -fsS -u 'lab_analyst:LabAnalyst2026!' 'http://localhost:9200/filebeat-*/_count'
curl -fsS -u 'lab_analyst:LabAnalyst2026!' 'http://localhost:9200/metricbeat-*/_count'
```

Salida esperada: filebeat OK; metricbeat **403**.

---

### Paso 4 — Login Kibana como analyst

Ventana privada → `lab_analyst` → comprueba que Discover limita índices.

---

## Validación

- [ ] Rol y usuario creados.
- [ ] metricbeat denegado para analyst.
- [ ] filebeat permitido.

---

## Antes de seguir

Principio de mínimo privilegio: un rol por equipo/función.
