# Laboratorio M12-01 — Latencia de búsqueda

[▲ Módulo M12](README.md) · [Siguiente →](M12-02-bulk-indexing-carga.md)

> ⏱️ ~35 min

**Objetivo:** medir tiempo de búsquedas con y sin filtro usando **profile**.

---

### Paso 1 — Búsqueda simple

```bash
time curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search' \
  -d '{"size":10,"query":{"match_all":{}}}' -o /dev/null
```

---

### Paso 2 — Con profile

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{
    "size": 5,
    "profile": true,
    "query": {
      "bool": {
        "filter": [
          {"term": {"log.source": "demo-app"}},
          {"range": {"@timestamp": {"gte": "now-1h"}}}
        ]
      }
    }
  }' | head -60
```

---

### Paso 3 — Comparar wildcard costoso

```bash
time curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search' \
  -d '{"size":5,"query":{"wildcard":{"message":"*ERROR*"}}}' -o /dev/null
```

Anota diferencia vs `term` en `log.level`.

---

## Validación

- [ ] Tres mediciones anotadas (ms aprox).
- [ ] Entiendes que wildcard en texto es caro.

---

## Antes de seguir

Índices bien mapeados + filtros `keyword`/`term` escalan mejor.
