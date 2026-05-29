# Laboratorio M05-03 — Dashboard de métricas del host

[▲ Módulo M05](README.md) · [← Anterior](M05-02-dashboard-logs-operacion.md) · [Siguiente →](M05-04-saved-objects-y-alertas-vista.md)

> ⏱️ ~50 min · 🧩 Metricbeat activo

**Objetivo:** panel de **CPU y memoria** Docker y enlazarlo temporalmente con errores de app en el mismo `host.name`.

---

### Paso 1 — Data view `metricbeat-*`

Discover → `event.module : "docker"` and `metricset.name : "cpu"`.

Anota `host.name` del contenedor donde corre el stack.

---

### Paso 2 — Lens CPU

- Data view: `metricbeat-*`
- Métrica: **Average** de `docker.cpu.total.pct` (o campo CPU disponible en tu doc)
- Breakdown: `container.name` · Últimos 30 min.

---

### Paso 3 — Lens memoria

- `metricset.name : "memory"`
- Average `docker.memory.usage.pct` (o equivalente).

Combina ambos en dashboard `lab-m05-host-metrics`.

---

### Paso 4 — Correlación manual

Abre en otra pestaña el dashboard M05-02. Alinea time picker y anota si un pico de CPU coincide con ERROR en logs (puede no coincidir — el lab es **hipótesis**, no causalidad automática).

KQL cruzado (mismo host):

```text
host.name : "<tu-host>" and event.module : "docker"
```

---

### Paso 5 — Añadir enlace entre dashboards

En el dashboard de logs, edita un panel → **Panel settings** → anota el `host.name` en descripción o markdown panel con enlace al dashboard de métricas.

---

## Validación

- [ ] Dashboard métricas guardado.
- [ ] Filtro `event.module : "docker"` devuelve datos.
- [ ] Documentaste un intento de correlación tiempo + host.

---

## Antes de seguir

Métricas + logs en un solo dashboard es el siguiente paso de madurez (M10 añade stack monitoring).
