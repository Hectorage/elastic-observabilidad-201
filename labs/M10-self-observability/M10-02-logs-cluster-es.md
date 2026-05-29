# Laboratorio M10-02 — Logs del clúster Elasticsearch

[▲ Módulo M10](README.md) · [← Anterior](M10-01-stack-monitoring.md) · [Siguiente →](M10-03-metricbeat-stack.md)

> ⏱️ ~35 min

**Objetivo:** leer logs del contenedor ES y activar **slowlog** de búsquedas (lab).

---

### Paso 1 — Logs en vivo

```bash
docker logs lab-elasticsearch --tail 40
docker logs lab-elasticsearch 2>&1 | grep -iE 'error|warn' | tail -15
```

---

### Paso 2 — Slowlog (temporal)

```bash
curl -fsS -X PUT 'http://localhost:9200/_cluster/settings' \
  -H 'Content-Type: application/json' \
  -d '{
  "transient": {
    "index.search.slowlog.threshold.query.warn": "0ms",
    "index.search.slowlog.level": "info"
  }
}'
```

---

### Paso 3 — Búsqueda pesada

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{"size":100,"query":{"wildcard":{"message":"*"}}}'
docker logs lab-elasticsearch --tail 20 | grep -i slow || echo "Puede no aparecer en stdout según config"
```

---

### Paso 4 — Restaurar

```bash
curl -fsS -X PUT 'http://localhost:9200/_cluster/settings' \
  -H 'Content-Type: application/json' \
  -d '{"transient":{"index.search.slowlog.threshold.query.warn":null}}'
```

---

## Validación

- [ ] Identificaste al menos un WARN/ERROR benigno o lo documentaste.
- [ ] Slowlog configurado y revertido.

---

## Antes de seguir

Los logs de ES explican rechazos de shard, disk watermark y circuit breakers.
