# Laboratorio M09-01 — Habilitar seguridad nativa

[▲ Módulo M09](README.md) · [Siguiente →](M09-02-usuarios-roles.md)

> ⏱️ ~50 min · ⚠️ Borra volumen si usas `down -v`

**Objetivo:** levantar el stack con **xpack.security** y acceder con usuario `elastic`.

> **Por qué:** en M01–M08 cualquiera con puerto 5601/9200 ve todos los datos. Producción exige **autenticación** (quién eres) y **autorización** RBAC (qué puedes ver). Security nativa es el baseline antes de LDAP/SSO (M09-04).

---

### Paso 1 — Variables

Contraseñas en `.env` (nunca en Git). El compose de seguridad las inyecta a ES/Kibana.

```bash
cp infra/.env.example infra/.env
# Edita infra/.env:
# ELASTIC_PASSWORD=LabElastic2026!
# KIBANA_SYSTEM_PASSWORD=LabKibana2026!
```

Añade esas líneas si no están en el example del repo.

| Variable | Consumidor |
|----------|------------|
| `ELASTIC_PASSWORD` | Usuario `elastic`, bootstrap |
| `KIBANA_SYSTEM_PASSWORD` | Kibana → ES interno |

---

### Paso 2 — Reinicio con override

```bash
docker compose -f infra/docker-compose.yml --profile beats down
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.security.yml --profile beats up -d
```

Espera 2–3 min. Kibana necesita `kibana_system` con password válido — si la UI no arranca, revisa logs `lab-kibana` y doc 8.17 bootstrap.

**Impacto en Beats:** Filebeat sin credenciales dejará de indexar — lo arreglarás en M09-03 checklist o ajustando yml.

---

### Paso 3 — curl autenticado

```bash
source infra/.env
curl -fsS -u "elastic:${ELASTIC_PASSWORD}" 'http://localhost:9200/_cluster/health?pretty'
```

Compara:

| Petición | Esperado |
|----------|----------|
| Sin `-u` | **401 Unauthorized** |
| Con `elastic` | JSON health normal |

---

### Paso 4 — Kibana

Abre http://localhost:5601 → login **elastic** / tu password.

Discover debe seguir mostrando datos **si** Beats reconectaron con credenciales. Si vacío: distingue auth (401 en logs Beat) de falta de ingesta.

---

## Validación

- [ ] Sin credenciales, `curl` devuelve 401.
- [ ] Login Kibana OK.
- [ ] Entiendes qué componentes necesitan password (Kibana, Beats, tus scripts curl).

---

## Antes de seguir

En producción: secret manager (Vault, K8s secrets), rotación periódica, usuario `elastic` solo break-glass — operadores usan cuentas nominativas (M09-02).
