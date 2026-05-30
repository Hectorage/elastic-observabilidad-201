# Laboratorio M09-03 — TLS: conceptos y checklist Beats

[▲ Módulo M09](README.md) · [← Anterior](M09-02-usuarios-roles.md) · [Siguiente →](M09-04-ldap-patron.md)

> ⏱️ ~45 min · 🧩 Lectura + checklist (TLS completo en prod)

**Objetivo:** entender **cadena de confianza** y qué tocar en Filebeat para HTTPS hacia ES.

> **RBAC vs TLS:** M09-02 autoriza *quién* accede; TLS protege *confidencialidad e integridad* en tránsito (passwords y logs no viajan en claro). En producción necesitas **ambos**.

---

### Paso 1 — Estado actual del clúster

```bash
source infra/.env
curl -fsS -u "elastic:${ELASTIC_PASSWORD}" 'http://localhost:9200/_ssl/certificates?pretty' 2>/dev/null | head -20 || \
  echo "HTTP sin certificado de cliente en este lab"
```

El lab usa **HTTP** en 9200 — válido para aprender RBAC, no para prod. Anota qué falta: certificado servidor, CA confiable, `https://`.

---

### Paso 2 — Checklist Filebeat (referencia producción)

En `infra/filebeat/filebeat.yml`, para producción añadirías:

```yaml
output.elasticsearch:
  hosts: ["https://elasticsearch:9200"]
  username: "filebeat_writer"
  password: "${FILEBEAT_PASSWORD}"
  ssl.certificate_authorities: ["/etc/filebeat/certs/ca.crt"]
  ssl.verification_mode: full
```

Completa la tabla en tus notas:

| Línea / setting | Problema que evita |
|-----------------|-------------------|
| `https://` | Sniffing de tráfico en red |
| `username` / `password` | Acceso anónimo (M09-01) |
| `certificate_authorities` | Man-in-the-middle con cert falso |
| `verification_mode: full` | Aceptar cert con hostname incorrecto |
| Usuario dedicado `filebeat_writer` | Comprometer Beat ≠ comprometer admin `elastic` |

No apliques TLS completo en Codespaces salvo que el formador lo indique — el valor del paso es el **checklist**.

---

### Paso 3 — Generación de CA (simulación leída)

Documenta el flujo oficial que seguirías en prod:

1. CA interna (PKI empresa) o cert público (Let’s Encrypt raro en ES interno).
2. Cert de nodo ES con **SAN** `DNS:elasticsearch`, `DNS:es.prod.example.com`.
3. Montar volumen de certs en compose / Helm chart.
4. `xpack.security.http.ssl.enabled: true` + paths a key/cert.
5. Distribuir `ca.crt` a Filebeat/Logstash/Kibana.

**Caso de uso:** rotación anual de certs con ventana de dual-trust en Beats.

---

### Paso 4 — Verificar cipher (opcional)

Si tu entorno tiene HTTPS:

```bash
openssl s_client -connect localhost:9200 -servername elasticsearch </dev/null 2>/dev/null | head -5
```

Comprueba versión TLS ≥ 1.2 y cipher aceptable según política de seguridad.

---

## Validación

- [ ] Checklist Filebeat completado (tabla amenaza → setting).
- [ ] Articulas diferencias HTTP lab vs HTTPS prod en 3 frases.
- [ ] Sabes qué usuario de Beat usarías (no `elastic`).

---

## Antes de seguir

TLS protege confidencialidad e integridad; RBAC protega autorización — ambos necesarios. M11 Beats/Fluent Bit hacia ES en prod siempre con TLS + credencial de servicio.
