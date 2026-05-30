# Laboratorio M12-01 — Latencia de búsqueda

[▲ Módulo M12](README.md) · [Siguiente →](M12-02-bulk-indexing-carga.md)

> ⏱️ ~35 min

**Objetivo:** medir tiempo de búsquedas con y sin filtro usando **profile** y comparar query types.

> **Por qué importa:** usuarios perciben «Kibana lenta» cuando queries scans millones de docs con wildcard. Medir antes de comprar hardware evita gasto innecesario.

---

### Paso 1 — Búsqueda simple

Baseline con `match_all` — coste mínimo de filtro:

```bash
time curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search' \
  -d '{"size":10,"query":{"match_all":{}}}' -o /dev/null
```

Anota segundos (real) — en lab suele ser <1 s con pocos docs.

---

### Paso 2 — Con profile

`profile: true` desglosa tiempo por shard/fase (query, fetch):

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{
    "size": 5,
    "profile": true,
    "query": {
      "bool": {
        "filter": [
          {"term": {"log_source": "demo-app"}},
          {"range": {"@timestamp": {"gte": "now-1h"}}}
        ]
      }
    }
  }' | head -60
```

**Filtros `term` + `range`** usan índices invertidos — escala bien. Es el patrón que M05 dashboards deberían usar.

---

### Paso 3 — Comparar wildcard costoso

```bash
time curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search' \
  -d '{"size":5,"query":{"wildcard":{"message":"*ERROR*"}}}' -o /dev/null
```

Compara con:

```bash
time curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search' \
  -d '{"size":5,"query":{"term":{"log.level":"ERROR"}}}' -o /dev/null 2>/dev/null || echo "log.level puede no existir — usa status_code parseado"
```

| Query | Coste relativo | Cuándo evitar |
|-------|----------------|---------------|
| `term` / `filter` | Bajo | — |
| `wildcard` leading `*text*` | Alto | Dashboards sin time bound |
| `match` en `message` | Medio-alto | Texto no keyword |

Rellena tabla con tus tiempos medidos (ms aprox).

---

## Validación

- [ ] Tres mediciones anotadas.
- [ ] Entiendes por qué wildcard en texto es caro.
- [ ] Propuesta: cómo reescribirías un filtro `message : *ERROR*` tras M04 grok.

---

## Antes de seguir

Índices bien mapeados + filtros `keyword`/`term` + ILM (menos shards fríos) escalan mejor que «más RAM» solo.
