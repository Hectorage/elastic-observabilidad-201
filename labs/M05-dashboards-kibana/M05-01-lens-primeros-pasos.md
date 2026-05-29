# Laboratorio M05-01 — Lens: de Discover a la primera visualización

[▲ Módulo M05](README.md) · [Siguiente →](M05-02-dashboard-logs-operacion.md)

> ⏱️ ~40 min · 🧩 Campos parseados (M04) o filtro por texto en `message`

**Objetivo:** crear una visualización Lens de **conteo por código HTTP** a partir de logs `demo-app`.

---

### Paso 1 — Stack con datos

```bash
docker compose -f infra/docker-compose.yml --profile beats up -d
./scripts/health-check.sh
```

Kibana → **Discover** → data view `filebeat-*` → `log.source : "demo-app"`.

---

### Paso 2 — Abrir Visualize desde Discover

1. Con el filtro activo, menú **Inspect** o **Open in Lens** (según build: *Visualize* / *Explore in Lens*).
2. Tipo sugerido: **Vertical bar** o **Donut**.
3. Métrica: **Count of records**.
4. Dimensión: `http.response.status_code` (si no existe, usa **Runtime field** o divide por `message : *status=500*` con filtros separados).

---

### Paso 3 — Ajustar tiempo

Time picker: **Last 15 minutes**. Auto-refresh: **30 s**.

Salida esperada: segmentos 200 / 404 / 500 alineados con la mezcla del `loggen` (~70/20/10).

---

### Paso 4 — Guardar

**Save** → nombre `lab-m05-status-codes` → espacio *Default*.

---

### Paso 5 — Validar con API (opcional)

```bash
curl -fsS -H 'Content-Type: application/json' \
  'http://localhost:9200/filebeat-*/_search?pretty' \
  -d '{
    "size": 0,
    "query": {"term": {"log.source": "demo-app"}},
    "aggs": {
      "by_status": {
        "terms": {
          "script": {
            "source": "if (doc[\"message.keyword\"].size()==0) return \"unknown\"; def m = /status=(\\d+)/.matcher(doc[\"message.keyword\"].value); m.find() ? m.group(1) : \"unknown\""
          },
          "size": 5
        }
      }
    }
  }' 2>/dev/null | head -25
```

---

## Validación

- [ ] Visualización guardada visible en **Visualize library**.
- [ ] Proporción 200 > 404 > 500 coherente con `loggen`.
- [ ] Time picker y refresh configurados.

---

## Antes de seguir

Lens aprende del **data view**; campos bien tipados (M04) evitan scripts frágiles.
