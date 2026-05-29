# Laboratorio M09-04 — Patrón LDAP / SSO

[▲ Módulo M09](README.md) · [← Anterior](M09-03-tls-beats.md) · [Siguiente módulo →](../M10-self-observability/M10-01-stack-monitoring.md)

> ⏱️ ~40 min · 🧩 Sin servidor LDAP real en Codespaces

**Objetivo:** diseñar integración **LDAP** y comparar con realms nativos del lab.

---

### Paso 1 — Realm nativo actual

```bash
source infra/.env
curl -fsS -u "elastic:${ELASTIC_PASSWORD}" 'http://localhost:9200/_security/realm?pretty'
```

---

### Paso 2 — Esqueleto LDAP (no aplicar)

Fragmento de referencia para `elasticsearch.yml`:

```yaml
xpack.security.authc.realms.ldap.ldap1:
  order: 2
  url: "ldaps://ldap.corp.example:636"
  bind_dn: "cn=elastic-reader,ou=svc,dc=corp,dc=example"
  user_search:
    base_dn: "ou=people,dc=corp,dc=example"
    filter: "(uid={0})"
  group_search:
    base_dn: "ou=groups,dc=corp,dc=example"
```

Mapea grupos LDAP → roles ES con **role mapping API**.

---

### Paso 3 — Role mapping ejemplo

```bash
curl -fsS -u "elastic:${ELASTIC_PASSWORD}" -X POST 'http://localhost:9200/_security/role_mapping/ldap_ops' \
  -H 'Content-Type: application/json' \
  -d '{
  "roles": ["lab_logs_reader"],
  "rules": { "field": { "dn": "cn=ops,ou=groups,dc=corp,dc=example" } },
  "enabled": false
}'
```

`enabled: false` evita aplicar en lab.

---

### Paso 4 — Tabla comparativa

| Aspecto | Nativo ES | LDAP/AD | SSO (SAML) |
|---------|-----------|---------|------------|
| Gestión usuarios | API ES | Directorio | IdP |
| Ideal para | Labs, bots | Empresas | Kibana enterprise |

---

## Validación

- [ ] Realm listado.
- [ ] Esqueleto LDAP documentado.
- [ ] Role mapping de ejemplo creado (disabled).

---

## Antes de seguir

Tras M09 puedes volver al compose sin seguridad solo con `down -v` y stack base — pierdes datos.
