# Laboratorio M10-02 — Logs del clúster Elasticsearch

[▲ Módulo M10](README.md) · [← Anterior](M10-01-stack-monitoring.md) · [Siguiente →](M10-03-metricbeat-stack.md)

> ⏱️ ~35 min

**Objetivo:** leer logs del contenedor ES y activar **slowlog** de búsquedas (lab).

> **Cuándo mirar logs ES:** Discover vacío pero Beats OK → puede ser rechazo de mapping; cluster red; watermark de disco; circuit breaker. Los logs del nodo explican lo que `_cluster/health` solo resume.

---

### Paso 1 — Logs en vivo

```bash
docker logs lab-elasticsearch --tail 40
docker logs lab-elasticsearch 2>&1 | grep -iE 'error|warn' | tail -15
```

Clasifica lo que veas:

| Tipo | Ejemplo | ¿Acción? |
|------|---------|----------|
| WARN disk | watermark approaching | Liberar disco, ILM |
| ERROR mapping | failed to parse | Pipeline/grok |
| INFO master | elected as master | Normal single-node |
| GC pause largo | | Revisar heap M12-03 |

Documenta al menos una línea benigna vs una que investigarías en prod.

---

### Paso 2 — Slowlog (temporal)

Slowlog registra búsquedas lentas — en lab bajamos umbral a `0ms` para forzar entradas ( **nunca en prod** ).

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

**Caso de uso prod:** umbral 500ms–2s en índices calientes; alimentar alertas si queries de Kibana degradan nodo.

---

### Paso 3 — Búsqueda pesada

Provoca query costosa (wildcard sobre `message`) — patrón que M12-01 también mide:

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{"size":100,"query":{"wildcard":{"message":"*"}}}'
docker logs lab-elasticsearch --tail 20 | grep -i slow || echo "Puede no aparecer en stdout según config"
```

Relaciona con M05: dashboards con wildcard amplio pueden ser la causa de lentitud en hora punta.

---

### Paso 4 — Restaurar

```bash
curl -fsS -X PUT 'http://localhost:9200/_cluster/settings' \
  -H 'Content-Type: application/json' \
  -d '{"transient":{"index.search.slowlog.threshold.query.warn":null}}'
```

Siempre revierte settings transient de lab — evita logs ruidosos permanentes.

---

## Validación

- [ ] Clasificaste al menos un WARN/ERROR (benigno o accionable).
- [ ] Slowlog configurado y revertido.
- [ ] Entiendes relación slowlog ↔ queries Kibana pesadas.

---

## Antes de seguir

Logs de ES + slowlog + M10-01 métricas JVM forman triángulo de diagnóstico de plataforma — úsalos antes de escalar ciegamente el clúster.
