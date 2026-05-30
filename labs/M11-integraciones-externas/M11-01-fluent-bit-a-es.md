# Laboratorio M11-01 — Fluent Bit hacia Elasticsearch

[▲ Módulo M11](README.md) · [Siguiente →](M11-02-kafka-redpanda-buffer.md)

> ⏱️ ~45 min

**Objetivo:** ingerir `access-lab.log` con Fluent Bit al índice `lab-fluent-bit`.

---

### Paso 1 — Levantar integraciones

```bash
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.integrations.yml \
  --profile integrations up -d
docker logs lab-fluent-bit --tail 20
```

---

### Paso 2 — Contar documentos

```bash
sleep 30
curl -fsS 'http://localhost:9200/lab-fluent-bit/_count?pretty'
```

---

### Paso 3 — Discover

Data view `lab-fluent-bit` → `log_source : "fluent-bit-lab"`.

---

### Paso 4 — Añadir línea

```bash
echo '198.51.100.99 - - [29/May/2026:11:00:00 +0000] "GET /test HTTP/1.1" 200 10 "-" "curl/8.0"' >> infra/samples/logs/access-lab.log
sleep 15
curl -fsS 'http://localhost:9200/lab-fluent-bit/_search?size=1&sort=@timestamp:desc&pretty'
```

---

## Validación

- [ ] `_count` > 0.
- [ ] Nueva línea visible.

---

## Antes de seguir

Fluent Bit es ligero en edge/K8s; Elastic Agent unifica muchos casos Beats.
