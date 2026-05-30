# Laboratorio M10-01 — Stack monitoring en Kibana

[▲ Módulo M10](README.md) · [Siguiente →](M10-02-logs-cluster-es.md)

> ⏱️ ~30 min

**Objetivo:** localizar vistas de **Stack Monitoring** (o equivalente en 8.17) y leer salud de Elasticsearch.

---

### Paso 1 — Stack Management

Kibana → **Stack Management** → **Stack Monitoring** (o **Monitoring** en menú).

![Stack Monitoring — captura real (estado inicial sin Metricbeat de monitoring)](../../docs/imagenes/kibana/kibana-stack-monitoring.png)

Si pide habilitar collection interna, sigue el asistente (en lab single-node puede ser limitado). La captura muestra el estado **sin datos de monitoring** hasta que lo configures.

---

### Paso 2 — Métricas de nodo

Anota: heap usado, CPU, disco del nodo `lab-es01`.

```bash
curl -fsS 'http://localhost:9200/_nodes/stats/jvm,os,fs?pretty' | head -50
```

---

### Paso 3 — Comparar con health-check

```bash
./scripts/health-check.sh
```

¿Coinciden heap % entre API y UI?

---

## Validación

- [ ] Viste métricas JVM del nodo.
- [ ] Relacionaste `yellow` con nodo único.

---

## Antes de seguir

Observar el stack evita volar a ciegas cuando los logs de negocio fallan.
