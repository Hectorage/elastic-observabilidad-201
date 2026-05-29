# Laboratorio M09-01 — Habilitar seguridad nativa

[▲ Módulo M09](README.md) · [Siguiente →](M09-02-usuarios-roles.md)

> ⏱️ ~50 min · ⚠️ Borra volumen si usas `down -v`

**Objetivo:** levantar el stack con **xpack.security** y acceder con usuario `elastic`.

---

### Paso 1 — Variables

```bash
cp infra/.env.example infra/.env
# Edita infra/.env:
# ELASTIC_PASSWORD=LabElastic2026!
# KIBANA_SYSTEM_PASSWORD=LabKibana2026!
```

Añade esas líneas al `.env` si no están en el example — actualiza `.env.example` too.

---

### Paso 2 — Reinicio con override

```bash
docker compose -f infra/docker-compose.yml --profile beats down
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.security.yml --profile beats up -d
```

Espera 2–3 min. Si Kibana no arranca, ejecuta (una vez) el setup de contraseñas según doc 8.17 para `kibana_system`.

---

### Paso 3 — curl autenticado

```bash
source infra/.env
curl -fsS -u "elastic:${ELASTIC_PASSWORD}" 'http://localhost:9200/_cluster/health?pretty'
```

---

### Paso 4 — Kibana

Abre http://localhost:5601 → login **elastic** / tu password.

---

## Validación

- [ ] Sin credenciales, `curl` devuelve 401.
- [ ] Login Kibana OK.
- [ ] Discover sigue mostrando datos tras reconfigurar Beats (puede requerir ajuste de credenciales en yml).

---

## Antes de seguir

En producción rota passwords y usa secretos, no `.env` en Git.
