# Laboratorio M12-02 — Bulk indexing bajo carga

[▲ Módulo M12](README.md) · [← Anterior](M12-01-latencia-busqueda.md) · [Siguiente →](M12-03-heap-recursos-jvm.md)

> ⏱️ ~40 min

**Objetivo:** indexar 5 000 docs con `_bulk` y observar impacto en heap y tiempo.

> **Bulk es el camino de producción:** Beats y Logstash envían batches, no documentos sueltos. Entender throughput y presión de heap guía sizing de nodos y tamaño de lote.

---

### Paso 1 — Heap antes

```bash
curl -fsS 'http://localhost:9200/_nodes/stats/jvm?filter_path=nodes.*.jvm.mem.heap.used_percent'
```

Anota `%` — referencia para paso 3.

---

### Paso 2 — Bulk 5000

El script indexa 5000 docs en **una** petición NDJSON — agresivo para lab, instructivo para ver latencia:

```bash
python3 <<'PY'
import json, urllib.request, time
bulk = []
for i in range(5000):
    bulk.append(json.dumps({"index": {"_index": "lab-perf-bulk"}}))
    bulk.append(json.dumps({"@timestamp": "2026-05-29T12:00:00Z", "message": f"perf test {i}", "log_source": "perf"}))
body = "\n".join(bulk) + "\n"
t0 = time.time()
req = urllib.request.Request("http://localhost:9200/_bulk", data=body.encode(), method="POST",
    headers={"Content-Type": "application/x-ndjson"})
resp = urllib.request.urlopen(req).read()
print("elapsed", round(time.time()-t0, 2), "s", "errors" in str(resp))
PY
curl -fsS 'http://localhost:9200/lab-perf-bulk/_count'
```

Anota **elapsed** segundos. En prod:

| Tuning | Efecto |
|--------|--------|
| `refresh=false` en bulk | Mayor throughput |
| Lotes 5–15 MB | Equilibrio latencia/memoria |
| Pipeline async | Menos presión en coordinador |

---

### Paso 3 — Heap después + merge (opcional)

```bash
curl -fsS -X POST 'http://localhost:9200/lab-perf-bulk/_forcemerge?max_num_segments=1' 2>/dev/null || true
curl -fsS 'http://localhost:9200/_nodes/stats/jvm?filter_path=nodes.*.jvm.mem.heap.used_percent'
```

¿Subió heap >10 puntos? forcemerge en lab es didáctico — en prod se planifica en ventana de mantenimiento.

---

## Validación

- [ ] 5000 docs indexados (`_count`).
- [ ] Tiempo total anotado.
- [ ] Heap antes/después comparado con interpretación.

---

## Antes de seguir

Bulk mal dimensionado satura heap y dispara rejections (M12-03). Beats ya batching — tú replicas con `_bulk` para pruebas de carga.
