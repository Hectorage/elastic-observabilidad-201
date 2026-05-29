# Laboratorio M03-01 — Dos orígenes de logs en el mismo Beat

[▲ Módulo M03](README.md) · [Siguiente página →](M03-02-multiline-stack-trace.md)

> ⏱️ ~30 min · 🧩 Requisitos: M02 completado · 🖥️ Terminal + Discover

**Objetivo:** separar en Discover eventos de **app simulada** (`loggen`) y de **seguridad simulada** (fichero estático), y aplicar un campo de gobierno (`environment`) que solo afecta a eventos nuevos.

---

### Paso 1 — Stack completo y contadores por origen

```bash
docker compose -f infra/docker-compose.yml --profile beats up -d
./scripts/health-check.sh
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_count' \
  -d '{"query":{"term":{"log.source":"demo-app"}}}'
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_count' \
  -d '{"query":{"match":{"message":"sshd"}}}'
```

El segundo `count` puede ser 0 hasta el paso 2.

---

### Paso 2 — Inyectar logs “sistema” en el volumen compartido

```bash
cat >> infra/samples/logs/system-lab.log <<'EOF'
2026-05-29T10:15:01Z WARN sshd Failed password for invalid user admin from 203.0.113.50 port 22
2026-05-29T10:15:02Z INFO sshd Disconnected from authenticating user root 203.0.113.50 port 22
EOF
sleep 25
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{"size":2,"sort":[{"@timestamp":"desc"}],"query":{"match":{"message":"sshd"}}}'
```

Salida esperada: al menos 2 hits con `sshd` en `message`.

---

### Paso 3 — Comparar en Discover (dos pantallas mentales)

Data view `filebeat-*`, time picker amplio:

| Filtro KQL | Qué demuestra |
|------------|----------------|
| `log.source : "demo-app"` | Tráfico continuo del `loggen` |
| `message : *sshd*` | Logs estáticos tipo syslog |
| `log.source : "demo-app" and message : *status=500*` | Errores HTTP de la app |

En un evento de cada filtro, anota el mismo `host.name` — misma máquina, distinto contenido.

---

### Paso 4 — Gobierno: campo `environment` en eventos nuevos

En `infra/filebeat/filebeat.yml`, bajo `fields` del input `lab-app-logs`:

```yaml
      environment: lab
```

```bash
docker compose -f infra/docker-compose.yml restart filebeat
sleep 30
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{"size":1,"sort":[{"@timestamp":"desc"}],"query":{"term":{"environment":"lab"}}}'
```

Discover: `environment : "lab"` — solo documentos **después** del reinicio.

---

### Paso 5 — Agregación rápida por nivel (API)

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{
    "size": 0,
    "query": {"term": {"log.source": "demo-app"}},
    "aggs": {
      "por_status": {
        "terms": {"field": "message.keyword", "size": 5}
      }
    }
  }' 2>/dev/null | head -30
```

Si `message.keyword` no existe, usa en Discover el filtro `message : *status=200*` vs `*status=500*` y cuenta visualmente — el `loggen` mezcla 200/404/500.

---

## Validación

- [ ] Filtros `demo-app` y `sshd` devuelven conjuntos distintos en Discover.
- [ ] Eventos nuevos con `environment: lab`.
- [ ] Mismo `host.name` en ambos tipos de evento.

---

## Antes de seguir

### Pon el foco en

- Un Beat, varios ficheros; la separación es por **campos**, no por índices manuales.
- Cambios de config no reescriben el pasado.
- Logs de seguridad y de app deben poder filtrarse por gobernanza (RBAC en M09).

### Reto (tómate tu tiempo)

1. KQL para solo `WARN` en logs sshd: `message : *sshd* and message : *WARN*`
2. ¿Por qué mezclar app+sshd en un fichero sin `log.source` rompe alertas?
3. Si no aparece `sshd`, `docker logs lab-filebeat --tail 20` y comprueba el volumen en compose.
