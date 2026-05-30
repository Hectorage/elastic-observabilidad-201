# Laboratorio M10-03 — Estado de los Beats

[▲ Módulo M10](README.md) · [← Anterior](M10-02-logs-cluster-es.md) · [Siguiente →](M10-04-dashboard-salud-stack.md)

> ⏱️ ~35 min

**Objetivo:** inspeccionar métricas internas de Filebeat y confirmar que parar el Beat detiene ingesta.

> **Self-observability del shipper:** el clúster puede estar green mientras Filebeat no envía — M01-03 lo demostró. El endpoint `:5066/stats` (y logs del contenedor) son la primera línea cuando `_count` deja de crecer.

---

### Paso 1 — Stats Filebeat

```bash
docker exec lab-filebeat curl -fsS http://localhost:5066/stats 2>/dev/null | head -30 || \
  docker logs lab-filebeat --tail 30
```

Busca en JSON (si disponible):

| Métrica | Significado |
|---------|-------------|
| `events.active` | Eventos en cola |
| `output.write.bytes` | Tráfico hacia ES/Logstash |
| `output.events.failed` | Errores de publicación |
| `harvester.open_files` | Ficheros vigilados |

Subida de `failed` → auth (M09), red, o ES rechazando bulk.

---

### Paso 2 — Eventos Metricbeat state (opcional)

Metricbeat puede indexar estado de otros beats en entornos Fleet; en lab revisa logs si el módulo no está activo:

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/metricbeat-*/_search?pretty' \
  -d '{
    "size": 2,
    "query": {"term": {"metricset.name": "state"}},
    "sort": [{"@timestamp": "desc"}]
  }' 2>/dev/null | head -25
```

Si vacío, no es fallo — el lab no exige este metricset.

---

### Paso 3 — Parar Beat y medir

Experimento controlado — repite M01-03 con números:

```bash
BEFORE=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '[0-9]*$')
docker stop lab-filebeat
sleep 60
AFTER=$(curl -fsS 'http://localhost:9200/filebeat-*/_count' | grep -o '[0-9]*$')
echo "before=$BEFORE after=$AFTER"
docker start lab-filebeat
```

`after` debe igualar `before` (±0). Si crece: otro shipper indexa o lag de buffer (poco probable en lab).

**Runbook:** «`_count` plano + Filebeat stopped» = causa raíz en shipper, no en Kibana.

---

## Validación

- [ ] Revisaste stats o logs de Filebeat.
- [ ] Confirmaste parada de ingesta al parar Filebeat.
- [ ] Filebeat reiniciado para módulos siguientes.

---

## Antes de seguir

Monitorea shippers en prod (Metricbeat sobre Filebeat, Elastic Agent health). Un Beat caído = hueco en observabilidad — correlación imposible en incidentes pasados.
