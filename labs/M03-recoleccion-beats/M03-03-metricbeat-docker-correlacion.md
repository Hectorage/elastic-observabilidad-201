# Laboratorio M03-03 — Métricas Docker en vivo y correlación con logs

[← Página anterior](M03-02-multiline-stack-trace.md) · [▲ Módulo M03](README.md) · [Siguiente página →](M03-04-auditbeat-tres-familias.md)

> ⏱️ ~35 min · 🧩 Requisitos: M03-01 · 🖥️ Terminal + Discover (dos data views)

**Objetivo:** activar **Metricbeat**, ver métricas del contenedor `lab-elasticsearch` y alinear temporalmente un pico de logs `ERROR` con uso de CPU del mismo host.

---

### Paso 1 — Arrancar Metricbeat y verificar ingesta

```bash
docker compose -f infra/docker-compose.yml --profile beats up -d metricbeat
sleep 30
docker logs lab-metricbeat --tail 15
curl -fsS 'http://localhost:9200/metricbeat-*/_count'
```

Salida esperada: `count` > 0.

---

### Paso 2 — Inspeccionar un documento de métricas

```bash
curl -fsS 'http://localhost:9200/metricbeat-*/_search?pretty' \
  -H 'Content-Type: application/json' \
  -d '{
    "size": 1,
    "sort": [{"@timestamp": "desc"}],
    "query": {"bool": {"filter": [
      {"term": {"event.module": "docker"}},
      {"term": {"metricset.name": "cpu"}}
    ]}}
  }'
```

Rellena con valores reales:

| Campo | Tu valor |
|-------|----------|
| `event.module` | |
| `event.dataset` | |
| `metricset.name` | |
| `docker.container.name` | |
| `host.name` | |

---

### Paso 3 — Discover para métricas

1. Data view **`metricbeat-*`** (`@timestamp`).
2. KQL: `event.module : "docker" and metricset.name : "cpu"`.
3. Localiza filas con `docker.container.name : "lab-elasticsearch"`.

> Filtro correcto: **`event.module`**, no `metricset.module`.

---

### Paso 4 — Provocar señal en logs y buscar en métricas

Genera varios errores rápidos en el log de app:

```bash
for i in 1 2 3 4 5; do
  echo "$(date -Iseconds) ERROR demo-app request_id=stress-$i method=GET path=/api/checkout status=500 latency_ms=9000" \
    >> infra/samples/logs/app.log
done
sleep 25
```

Discover `filebeat-*`:

```text
message : *stress-* and message : *status=500*
```

Anota `@timestamp` del primer `stress-1`.

Discover `metricbeat-*`, misma ventana de tiempo (±2 min), mismo `host.name`:

```text
event.module : "docker" and docker.container.name : "lab-elasticsearch"
```

Observa si hay variación en campos de CPU/memoria del contenedor (el lab puede mostrar cambios suaves; lo importante es **alinear tiempo y host**).

---

### Paso 5 — Comparación logs vs métricas (tabla operativa)

| Pregunta | Logs (`filebeat-*`) | Métricas (`metricbeat-*`) |
|----------|---------------------|---------------------------|
| ¿Qué tipo de dato? | Texto / contexto | Números / series |
| ¿Campo de módulo? | `log_source` | `event.module` |
| ¿Contenedor? | `container.*` (si processor) | `docker.container.name` |
| ¿Correlacionar por? | `host.name` + `@timestamp` | `host.name` + `@timestamp` |

---

## Validación

- [ ] `metricbeat-*/_count` > 0.
- [ ] Localizaste `lab-elasticsearch` en métricas docker/cpu.
- [ ] Generaste eventos `stress-*` visibles en logs.
- [ ] Usaste la misma ventana temporal y `host.name` en ambas data views.

---

## Antes de seguir

### Pon el foco en

- Sin métricas, un pico de ERROR puede ser “ruido de app” sin ver saturación de contenedor.
- Metricbeat en Docker ve el motor del host vía socket, no toda la VM.
- Dashboards de M05 unirán estos mismos campos.

### Reto (tómate tu tiempo)

1. Lista tres `metricset.name` distintos en tus documentos.
2. `docker logs lab-metricbeat` si `_count` es 0 — ¿error de socket?
3. (Opcional) [Metricbeat docker module](https://www.elastic.co/docs/reference/beats/metricbeat/metricbeat-module-docker)
