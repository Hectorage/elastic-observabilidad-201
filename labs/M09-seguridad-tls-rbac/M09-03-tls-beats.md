# Laboratorio M09-03 — TLS: conceptos y checklist Beats

[▲ Módulo M09](README.md) · [← Anterior](M09-02-usuarios-roles.md) · [Siguiente →](M09-04-ldap-patron.md)

> ⏱️ ~45 min · 🧩 Lectura + checklist (TLS completo en prod)

**Objetivo:** entender **cadena de confianza** y qué tocar en Filebeat para HTTPS hacia ES.

---

### Paso 1 — Estado actual del clúster

```bash
source infra/.env
curl -fsS -u "elastic:${ELASTIC_PASSWORD}" 'http://localhost:9200/_ssl/certificates?pretty' 2>/dev/null | head -20 || \
  echo "HTTP sin certificado de cliente en este lab"
```

---

### Paso 2 — Checklist Filebeat (no aplicar todo en Codespaces)

En `infra/filebeat/filebeat.yml`, para producción añadirías:

```yaml
output.elasticsearch:
  hosts: ["https://elasticsearch:9200"]
  username: "filebeat_writer"
  password: "${FILEBEAT_PASSWORD}"
  ssl.certificate_authorities: ["/etc/filebeat/certs/ca.crt"]
  ssl.verification_mode: full
```

Anota cada línea: qué problema evita.

---

### Paso 3 — Generación de CA (simulación leída)

Documenta los pasos oficiales:

1. CA interna o certificado de AC pública.
2. Cert de nodo ES con SAN `DNS:elasticsearch`.
3. Montar volumen de certs en compose.
4. `xpack.security.http.ssl.enabled: true`.

---

### Paso 4 — Verificar cipher (opcional)

Si tu entorno tiene HTTPS:

```bash
openssl s_client -connect localhost:9200 -servername elasticsearch </dev/null 2>/dev/null | head -5
```

---

## Validación

- [ ] Checklist Filebeat completado en tus notas.
- [ ] Diferencias HTTP lab vs HTTPS prod articuladas.

---

## Antes de seguir

TLS protege confidencialidad e integridad; RBAC protege autorización — ambos necesarios.
