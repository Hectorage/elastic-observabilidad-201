# Laboratorio M04-02 — Filtros grok en Logstash

[▲ Módulo M04](README.md) · [← Anterior](M04-01-logstash-en-el-camino.md) · [Siguiente →](M04-03-ingest-pipeline-nativo.md)

> ⏱️ ~50 min · 🧩 Stack con perfil `logstash` activo

**Objetivo:** extraer `http.response.status_code`, `latency_ms` y `url.path` del mensaje de `demo-app` y validar tipos en Elasticsearch.

---

### Paso 1 — Revisar el pipeline

Abre `infra/logstash/pipeline/10-beats-to-es.conf` y localiza el bloque `grok` y `mutate convert`.

---

### Paso 2 — Reiniciar Logstash tras cambios (si editaste)

```bash
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.logstash.yml restart logstash
sleep 45
```

---

### Paso 3 — Buscar campos parseados

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{
    "size": 1,
    "sort": [{"@timestamp": "desc"}],
    "query": {"exists": {"field": "http.response.status_code"}},
    "_source": ["message", "http.response.status_code", "latency_ms", "url.path", "tags"]
  }'
```

Salida esperada: `http.response.status_code` como número (p. ej. 500), `latency_ms` presente.

---

### Paso 4 — Discover con KQL numérico

```text
log_source : "demo-app" and http.response.status_code >= 500
latency_ms > 300
```

Si el filtro numérico no funciona, el campo puede estar como texto — revisa el `mutate convert` en Logstash.

---

### Paso 5 — Eventos con fallo de grok

```bash
echo "$(date -Iseconds) TEXTO-ROTO sin formato demo-app" >> infra/samples/logs/app.log
sleep 30
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{"size":1,"query":{"term":{"tags":"_grokparsefailure"}}}'
```

Salida esperada: al menos un hit con tag `_grokparsefailure` (o sin campos HTTP parseados).

---

## Validación

- [ ] Campos HTTP visibles en `_source`.
- [ ] KQL `status_code >= 500` devuelve ERROR del `loggen`.
- [ ] Entiendes el tag `_grokparsefailure`.

---

## Antes de seguir

### Pon el foco en

- **grok** exige patrones estables; cambios de formato rompen el parseo.
- `mutate convert` evita comparaciones erróneas en KQL.

### Reto

Añade un filtro `if [http.response.status_code] >= 500 { mutate { add_tag => ["http_error"] } }` y filtra en Discover: `tags : "http_error"`.
