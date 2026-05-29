# Laboratorio M08-02 — Regla sobre logs de error

[▲ Módulo M08](README.md) · [← Anterior](M08-01-regla-umbral-metricas.md) · [Siguiente →](M08-03-watcher-query.md)

> ⏱️ ~40 min

**Objetivo:** alerta cuando haya **≥ 3** eventos con `status=500` en 5 minutos.

---

### Paso 1 — Regla Elasticsearch query

- Índices: `filebeat-*`
- KQL: `log.source : "demo-app" and (http.response.status_code : 500 or message : *status=500*)`
- Condición: count **>= 3** en **5 min**

Nombre: `lab-m08-http-500-burst`.

---

### Paso 2 — Acción de log

Añade acción **Log action** con mensaje `Burst 500 detectado`.

---

### Paso 3 — Validar con loggen

Espera 5–10 min; el `loggen` emite ~10 % ERROR — debería disparar en ventanas activas.

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_count' \
  -d '{"query":{"bool":{"must":[{"term":{"log.source":"demo-app"}},{"query_string":{"query":"message:status=500 OR http.response.status_code:500"}}]}}}'
```

---

## Validación

- [ ] Regla disparada al menos una vez O explicas por qué no (umbral alto).
- [ ] Acción de log visible en detalles de la regla.

---

## Antes de seguir

Evita alertas ruidosas: ajusta ventana, umbral y agrupación.
