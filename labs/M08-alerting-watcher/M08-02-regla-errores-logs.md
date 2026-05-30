# Laboratorio M08-02 — Regla sobre logs de error

[▲ Módulo M08](README.md) · [← Anterior](M08-01-regla-umbral-metricas.md) · [Siguiente →](M08-03-watcher-query.md)

> ⏱️ ~40 min

**Objetivo:** alerta cuando haya **≥ 3** eventos con `status=500` en 5 minutos.

> **Por qué ventana + umbral:** un solo 500 puede ser cliente abortado; tres en cinco minutos sugiere degradación real. Ajustar ventana/umbral es negociación entre **sensibilidad** (detectar pronto) y **ruido** (pager fatigue).

---

### Paso 1 — Regla Elasticsearch query

**Observability** → **Alerts** → **Create rule** → **Elasticsearch query** (misma familia que M05-04, con condición más exigente):

| Campo | Valor |
|-------|-------|
| Índices | `filebeat-*` |
| KQL | `log_source : "demo-app" and (http.response.status_code : 500 or message : *status=500*)` |
| Condición | count **>= 3** en **5 min** |
| Agrupación (si la UI lo ofrece) | opcional por `host.name` |

Nombre: `lab-m08-http-500-burst`.

**Caso de uso:** equipo de checkout quiere aviso cuando la tasa de error supera un piso sostenido, no en cada request fallido aislado.

**Si M04 parseó `http.response.status_code`:** prioriza ese campo sobre wildcard en `message` — query más barata y precisa.

---

### Paso 2 — Acción de log

Añade acción **Log action** con mensaje `Burst 500 detectado`.

En producción sustituirías por:

| Canal | Cuándo |
|-------|--------|
| Slack / Teams | Warning, visibilidad equipo |
| PagerDuty / Opsgenie | SLO crítico, guardia 24×7 |
| Ticket Jira | Deuda técnica, no urgente |

El log action del lab deja trazabilidad en Kibana sin configurar SMTP.

---

### Paso 3 — Validar con loggen

El `loggen` emite ~10 % de líneas con `status=500` — en ventanas activas deberías cumplir ≥3 en 5 min. Si no dispara:

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_count' \
  -d '{"query":{"bool":{"must":[{"term":{"log_source":"demo-app"}},{"query_string":{"query":"message:status=500 OR http.response.status_code:500"}}]}}}'
```

| `_count` | Diagnóstico |
|----------|-------------|
| 0 | Ingesta o KQL — revisa Filebeat y perfil `beats` |
| > 0, regla `ok` | Umbral/ventana o regla disabled |
| > 0, regla `active` | Mecanismo OK |

Espera al menos un ciclo completo de 5 min antes de concluir «no funciona».

---

## Validación

- [ ] Regla disparada al menos una vez **o** explicas con `_count` por qué no (umbral alto, ventana corta, sin datos).
- [ ] Acción de log visible en detalles de la regla.
- [ ] Puedes defender el umbral «3 en 5 min» frente a «> 0 en 1 min» de M05-04.

---

## Antes de seguir

Evita alertas ruidosas: sube umbral, alarga ventana, agrupa por servicio y usa **maintenance windows** en despliegues. Una alerta que siempre dispara se ignora; una que nunca dispara da falsa confianza.
