# Laboratorio M10-03 — Estado de los Beats

[▲ Módulo M10](README.md) · [← Anterior](M10-02-logs-cluster-es.md) · [Siguiente →](M10-04-dashboard-salud-stack.md)

> ⏱️ ~35 min

**Objetivo:** inspeccionar métricas internas de Filebeat y colas.

---

### Paso 1 — Stats Filebeat

```bash
docker exec lab-filebeat curl -fsS http://localhost:5066/stats 2>/dev/null | head -30 || \
  docker logs lab-filebeat --tail 30
```

---

### Paso 2 — Eventos en ES

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/metricbeat-*/_search?pretty' \
  -d '{
    "size": 2,
    "query": {"term": {"metricset.name": "state"}},
    "sort": [{"@timestamp": "desc"}]
  }' 2>/dev/null | head -25
```

---

### Paso 3 — Parar Beat y medir

```bash
BEFORE=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '[0-9]*$')
docker stop lab-filebeat
sleep 60
AFTER=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '[0-9]*$')
echo "before=$BEFORE after=$AFTER"
docker start lab-filebeat
```

`after` debe igualar `before`.

---

## Validación

- [ ] Confirmaste parada de ingesta al parar Filebeat.
- [ ] Filebeat reiniciado.

---

## Antes de seguir

Monitorea shippers: un Beat caído = hueco en observabilidad.
