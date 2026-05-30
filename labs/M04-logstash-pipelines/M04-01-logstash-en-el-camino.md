# Laboratorio M04-01 — Logstash en el camino del dato

[▲ Módulo M04](README.md) · [Siguiente página →](M04-02-filtros-grok-logstash.md)

> ⏱️ ~45 min · 🧩 Requisitos: M03 · 🖥️ Terminal + Discover

**Objetivo:** cambiar el pipeline a **Filebeat → Logstash → Elasticsearch** y comprobar que los eventos siguen llegando a data streams.

---

### Paso 1 — Parar el stack anterior y levantar con Logstash

```bash
docker compose -f infra/docker-compose.yml --profile beats down
docker compose -f infra/docker-compose.yml \
  -f infra/docker-compose.logstash.yml \
  --profile beats --profile logstash up -d
./scripts/health-check.sh
```

Salida esperada: contenedor `lab-logstash` en estado running.

---

### Paso 2 — API de nodos Logstash

```bash
curl -fsS 'http://localhost:9600/_node/stats/pipelines?pretty' | head -40
docker logs lab-logstash --tail 15
```

Debe aparecer al menos un pipeline activo (`10-beats-to-es`).

---

### Paso 3 — Contar documentos tras 1 minuto

```bash
sleep 60
curl -fsS 'http://localhost:9200/filebeat-*/_count'
```

Salida esperada: `"count"` > 0 y creciendo.

---

### Paso 4 — Discover

Data view `filebeat-*`, filtro `log_source : "demo-app"`.

Compara con M03: el **origen** es el mismo (`loggen`), el **camino** ahora pasa por Logstash (puerto 5044).

---

### Paso 5 — Trazar el flujo (dibujo mental)

```text
loggen → fichero → Filebeat → :5044 Logstash → Elasticsearch → Kibana
```

Anota en un evento: `agent.type` (filebeat), `host.name`, `@timestamp`.

---

## Validación

- [ ] `lab-logstash` healthy.
- [ ] `_count` en `filebeat-*` aumenta.
- [ ] Discover muestra eventos recientes de `demo-app`.

---

## Antes de seguir

### Pon el foco en

- Logstash añade **CPU/RAM** y un punto de fallo más; compensa con transformaciones complejas y buffers.
- Filebeat puede enviar a ES o a Logstash; no ambos a la vez con la misma config.

### Reto

1. ¿Qué pasa si paras Logstash (`docker stop lab-logstash`) y miras `docker logs lab-filebeat`?
2. Vuelve a arrancarlo antes del siguiente ejercicio.
