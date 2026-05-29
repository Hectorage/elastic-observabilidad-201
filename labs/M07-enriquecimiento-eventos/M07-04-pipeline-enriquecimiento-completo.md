# Laboratorio M07-04 — Pipeline de enriquecimiento completo

[▲ Módulo M07](README.md) · [← Anterior](M07-03-user-agent-parse.md) · [Siguiente módulo →](../M08-alerting-watcher/M08-01-regla-umbral-metricas.md)

> ⏱️ ~40 min

**Objetivo:** operar `lab-enrich-completo` de punta a punta y medir latencia de ingest.

---

### Paso 1 — Recargar pipelines

```bash
./scripts/apply-ingest-pipelines.sh
curl -fsS 'http://localhost:9200/_ingest/pipeline/lab-enrich-completo?pretty' | head -30
```

---

### Paso 2 — Bulk de 100 eventos

```bash
python3 <<'PY'
import json, urllib.request
lines = open("infra/samples/logs/access-lab.log").read().strip().split("\n")
bulk = []
for i, line in enumerate(lines * 34):  # ~100 docs
    bulk.append(json.dumps({"index": {"_index": "lab-access-bulk"}}))
    bulk.append(json.dumps({"message": line}))
body = "\n".join(bulk) + "\n"
req = urllib.request.Request(
    "http://localhost:9200/_bulk?pipeline=lab-enrich-completo",
    data=body.encode(), method="POST",
    headers={"Content-Type": "application/x-ndjson"})
print(urllib.request.urlopen(req).read()[:200])
PY
curl -fsS 'http://localhost:9200/lab-access-bulk/_count'
```

---

### Paso 3 — Agregación por status

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/lab-access-bulk/_search?pretty' \
  -d '{"size":0,"aggs":{"by_status":{"terms":{"field":"http.response.status_code","size":10}}}}'
```

---

### Paso 4 — Checklist de calidad

| Campo | ¿Presente en >90% docs? |
|-------|-------------------------|
| client.ip | |
| http.response.status_code | |
| client.geo.country_name | |
| user_agent.name | |

---

## Validación

- [ ] `_count` ≥ 100.
- [ ] Agregación por status coherente (200, 404, 500).
- [ ] Checklist rellenado.

---

## Antes de seguir

Orden de processors importa: grok antes de geoip/user_agent.
