# Laboratorio M11-02 — Kafka API con Redpanda (buffer)

[▲ Módulo M11](README.md) · [← Anterior](M11-01-fluent-bit-a-es.md) · [Siguiente →](M11-03-prometheus-metricas.md)

> ⏱️ ~50 min

**Objetivo:** entender el patrón **productor → topic → consumidor → ES** usando Redpanda del repo.

---

### Paso 1 — Verificar broker

```bash
docker exec lab-redpanda rpk cluster info 2>/dev/null || docker logs lab-redpanda --tail 15
```

---

### Paso 2 — Crear topic

```bash
docker exec lab-redpanda rpk topic create lab-logs -p 1 -r 1
docker exec lab-redpanda rpk topic list
```

---

### Paso 3 — Producir mensaje de prueba

```bash
echo '{"message":"kafka lab event","log.source":"redpanda-test"}' | \
  docker exec -i lab-redpanda rpk topic produce lab-logs -f '%v'
docker exec lab-redpanda rpk topic consume lab-logs -n 1
```

---

### Paso 4 — Diagrama (rellena)

```text
Filebeat ──► [ Kafka topic lab-logs ] ──► Logstash/ES consumer ──► Elasticsearch
```

En producción el buffer desacopla picos; el consumidor escala aparte.

---

## Validación

- [ ] Topic `lab-logs` creado.
- [ ] Mensaje consumido una vez.
- [ ] Diagrama completado.

---

## Antes de seguir

No es obligatorio Kafka en todos los pipelines; úsalo con backpressure real.
