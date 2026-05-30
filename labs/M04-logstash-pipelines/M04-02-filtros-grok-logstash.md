# Laboratorio M04-02 — Filtros grok en Logstash

[▲ Módulo M04](README.md) · [← Anterior](M04-01-logstash-en-el-camino.md) · [Siguiente →](M04-03-ingest-pipeline-nativo.md)

> ⏱️ ~50 min · 🧩 Stack con perfil `logstash` activo

**Objetivo:** extraer `http.response.status_code`, `latency_ms` y `url.path` del mensaje de `demo-app` y validar tipos en Elasticsearch.

> **Por qué parsear:** KQL numérico (`status >= 500`) y agregaciones Lens exigen campos tipados. Un `message` libre obliga a regex en cada dashboard — frágil y lento.

---

### Paso 1 — Revisar el pipeline

Abre `infra/logstash/pipeline/10-beats-to-es.conf` y localiza:

| Bloque | Función |
|--------|---------|
| `grok` | Extrae campos del texto con patrones |
| `mutate convert` | Convierte strings a integer/float |
| `date` (si existe) | Normaliza `@timestamp` |

**Caso de uso:** el formato del `loggen` es estable (`status=500 latency_ms=42 path=/api/...`) — candidato ideal a grok. Logs de terceros con formato variable requieren más pruebas y tags de fallo.

Compara mentalmente con M07: mismo problema (texto → campos), distinto motor (Logstash vs ingest pipeline).

---

### Paso 2 — Reiniciar Logstash tras cambios (si editaste)

Logstash recarga pipeline al reinicio del contenedor (en prod usarías API reload o hot reload según despliegue).

```bash
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.logstash.yml restart logstash
sleep 45
```

Espera ~45 s: JVM Logstash tarda más que Filebeat en estar listo.

---

### Paso 3 — Buscar campos parseados

Valida en ES, no solo en Logstash stdout — el contrato es lo que queda indexado.

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

Salida esperada: `http.response.status_code` como número (p. ej. 500), `latency_ms` presente. Si solo ves strings, el `mutate convert` no corrió o grok no matcheó.

---

### Paso 4 — Discover con KQL numérico

Prueba dos filtros por separado:

```text
log_source : "demo-app" and http.response.status_code >= 500
log_source : "demo-app" and latency_ms > 300
```

| Síntoma | Causa probable |
|---------|----------------|
| Filtro numérico vacío | Campo mapeado como `text` — revisa `mutate convert` |
| Solo algunos docs parseados | Líneas con formato distinto — ver paso 5 |
| Discover OK, Lens falla | Data view sin refresh de field list |

Si el filtro numérico no funciona, el campo puede estar como texto — revisa el `mutate convert` en Logstash y el mapping en Index Management.

---

### Paso 5 — Eventos con fallo de grok

Simula línea corrupta — en prod llega por deploy bugueado, log manual o fuente nueva.

```bash
echo "$(date -Iseconds) TEXTO-ROTO sin formato demo-app" >> infra/samples/logs/app.log
sleep 30
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{"size":1,"query":{"term":{"tags":"_grokparsefailure"}}}'
```

Salida esperada: hit con tag `_grokparsefailure` (o doc sin campos HTTP). **Operación:** monitoriza ratio `_grokparsefailure` — subida = cambio de formato o patrón obsoleto.

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

<details>
<summary>Ver respuestas</summary>

En `infra/logstash/pipeline/10-beats-to-es.conf`, dentro de `filter { }` y junto al bloque grok existente:

```ruby
if [http.response.status_code] >= 500 {
  mutate { add_tag => ["http_error"] }
}
```

Reinicia Logstash, genera tráfico ERROR con `loggen` y en Discover (`filebeat-*`):

```text
tags : "http_error"
```

Debes ver solo eventos con status ≥ 500 parseado por grok. El tag simplifica alertas M08 sin repetir KQL largo.

</details>
