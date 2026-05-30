# Laboratorio M11-02 — Kafka API con Redpanda (buffer)

[▲ Módulo M11](README.md) · [← Anterior](M11-01-fluent-bit-a-es.md) · [Siguiente →](M11-03-prometheus-metricas.md)

> ⏱️ ~50 min

**Objetivo:** entender el patrón **productor → topic → consumidor → ES** usando Redpanda del repo.

> **Por qué Kafka/Redpanda:** cuando Filebeat o Fluent Bit producen más rápido de lo que ES indexa (picos, mantenimiento), un **buffer** desacopla. El productor escribe al topic; consumidores (Logstash, Kafka Connect, custom) escalan aparte.

---

### Paso 1 — Verificar broker

Redpanda expone API compatible Kafka — en lab evitas cluster Zookeeper clásico.

```bash
docker exec lab-redpanda rpk cluster info 2>/dev/null || docker logs lab-redpanda --tail 15
```

Broker UP es prerrequisito de todo lo demás.

---

### Paso 2 — Crear topic

```bash
docker exec lab-redpanda rpk topic create lab-logs -p 1 -r 1
docker exec lab-redpanda rpk topic list
```

| Parámetro | Lab | Prod orientativo |
|-----------|-----|------------------|
| Partitions | 1 | N ≈ consumidores paralelos |
| Replicas | 1 | 3 para HA |

---

### Paso 3 — Producir y consumir mensaje de prueba

```bash
echo '{"message":"kafka lab event","log_source":"redpanda-test"}' | \
  docker exec -i lab-redpanda rpk topic produce lab-logs -f '%v'
docker exec lab-redpanda rpk topic consume lab-logs -n 1
```

Has verificado **persistencia** del evento en el topic — aunque ningún consumidor esté conectado a ES todavía.

---

### Paso 4 — Diagrama del pipeline completo

Completa y comenta en tus notas:

```text
Filebeat ──► [ Kafka topic lab-logs ] ──► Logstash/ES consumer ──► Elasticsearch
     │              │                              │
  picos app    buffer durable              escala independiente
```

**Cuándo NO usar Kafka:** ingesta < 1–2 TB/día estable, ES dimensionado con margen, sin picos brutales — añades operación (topics, lag, consumer groups) sin beneficio.

**Cuándo SÍ:** black Friday, batch nocturnos, múltiples consumidores (ES + SIEM + data lake).

---

## Validación

- [ ] Topic `lab-logs` creado.
- [ ] Mensaje producido y consumido una vez.
- [ ] Diagrama completado con tu explicación de backpressure.

---

## Antes de seguir

Kafka no es obligatorio en todos los pipelines — úsalo con backpressure real medido, no por moda arquitectónica.
