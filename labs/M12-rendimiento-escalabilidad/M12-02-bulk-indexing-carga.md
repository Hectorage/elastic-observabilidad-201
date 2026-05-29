# Laboratorio M12-02 — Bulk indexing bajo carga

[▲ Módulo M12](README.md) · [← Anterior](M12-01-latencia-busqueda.md) · [Siguiente →](M12-03-heap-recursos-jvm.md)

> ⏱️ ~40 min

**Objetivo:** indexar 5 000 docs con `_bulk` y observar impacto en heap.

---

### Paso 1 — Heap antes

```bash
curl -fsS 'http://localhost:9200/_nodes/stats/jvm?filter_path=nodes.*.jvm.mem.heap.used_percent'
```

---

### Paso 2 — Bulk 5000

```bash
python3 <<'PY'
import json, urllib.request, time
bulk = []
for i in range(5000):
    bulk.append(json.dumps({"index": {"_index": "lab-perf-bulk"}}))
    bulk.append(json.dumps({"@timestamp": "2026-05-29T12:00:00Z", "message": f"perf test {i}", "log.source": "perf"}))
body = "\n".join(bulk) + "\n"
t0 = time.time()
req = urllib.request.Request("http://localhost:9200/_bulk", data=body.encode(), method="POST",
    headers={"Content-Type": "application/x-ndjson"})
resp = urllib.request.urlopen(req).read()
print("elapsed", round(time.time()-t0, 2), "s", "errors" in str(resp))
PY
curl -fsS 'http://localhost:9200/lab-perf-bulk/_count'
```

---

### Paso 3 — Heap después + refresh

```bash
curl -fsS -X POST 'http://localhost:9200/lab-perf-bulk/_forcemerge?max_num_segments=1' 2>/dev/null || true
curl -fsS 'http://localhost:9200/_nodes/stats/jvm?filter_path=nodes.*.jvm.mem.heap.used_percent'
```

---

## Validación

- [ ] 5000 docs indexados.
- [ ] Tiempo total anotado.
- [ ] Heap comparado antes/después.

---

## Antes de seguir

Bulk con `refresh=false` y tamaño de lote 5–15 MB mejora throughput en prod.
