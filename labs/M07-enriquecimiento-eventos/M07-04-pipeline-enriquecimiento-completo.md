# Laboratorio M07-04 — Pipeline de enriquecimiento completo

[▲ Módulo M07](README.md) · [← Anterior](M07-03-user-agent-parse.md) · [Siguiente módulo →](../M08-alerting-watcher/M08-01-regla-umbral-metricas.md)

> ⏱️ ~40 min

**Objetivo:** operar `lab-enrich-completo` de punta a punta y medir calidad de enriquecimiento bajo carga.

> **Orden importa:** grok primero (extrae IP y user agent del message) → geoip sobre `client.ip` → user_agent sobre `user_agent.original`. Pipeline mal ordenado = campos vacíos difíciles de depurar.

---

### Paso 1 — Recargar pipelines

```bash
./scripts/apply-ingest-pipelines.sh
curl -fsS 'http://localhost:9200/_ingest/pipeline/lab-enrich-completo?pretty' | head -30
```

Anota la secuencia de processors en la respuesta — debe reflejar el orden anterior.

---

### Paso 2 — Bulk de ~100 eventos

Simula pico de tráfico web (Black Friday, campaña marketing):

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

**Producción:** bulk en lotes 5–15 MB con `refresh=false` — M12-02 profundiza throughput.

---

### Paso 3 — Agregación por status

Valida que el parseo masivo no degradó calidad:

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/lab-access-bulk/_search?pretty' \
  -d '{"size":0,"aggs":{"by_status":{"terms":{"field":"http.response.status_code","size":10}}}}'
```

Esperado: buckets 200, 404, 500 alineados con `access-lab.log`. Si muchos `null`, revisa grok failures.

---

### Paso 4 — Checklist de calidad

Muestrea mentalmente 10 docs al azar en Discover o con `_search`:

| Campo | ¿Presente en >90% docs? | Si no — acción |
|-------|---------------------------|----------------|
| `client.ip` | | Revisar grok pattern IP |
| `http.response.status_code` | | Revisar grok status |
| `client.geo.country_name` | | Solo IPs públicas; OK si parcial |
| `user_agent.name` | | Revisar extracción UA en grok |

**SLI de ingesta:** en prod monitorizas % docs con campos obligatorios — caída = deploy de pipeline roto.

---

## Validación

- [ ] `_count` ≥ 100.
- [ ] Agregación por status coherente (200, 404, 500).
- [ ] Checklist rellenado con porcentajes aproximados.

---

## Antes de seguir

M08 alertará sobre estos mismos campos parseados — enriquecimiento de calidad reduce falsos negativos en reglas KQL.
