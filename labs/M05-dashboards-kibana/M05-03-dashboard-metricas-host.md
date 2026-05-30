# Laboratorio M05-03 — Dashboard de métricas del host

[▲ Módulo M05](README.md) · [← Anterior](M05-02-dashboard-logs-operacion.md) · [Siguiente →](M05-04-saved-objects-y-alertas-vista.md)

> ⏱️ ~50 min · 🧩 Metricbeat activo

**Objetivo:** panel de **CPU y memoria** Docker y enlazarlo temporalmente con errores de app en el mismo `host.name`.

> **Correlación ≠ causalidad:** ver CPU alta y ERROR a la vez sugiere hipótesis («¿el contenedor va justo de recursos?»). Hay que validar con logs, traces o cambios recientes — el lab entrena el **hábito** de mirar ambas señales.

---

### Paso 1 — Data view `metricbeat-*`

Metricbeat publica métricas del host y contenedores Docker en índices distintos a Filebeat — mismo `@timestamp`, distinto `event.module`.

Discover → `event.module : "docker" and metricset.name : "cpu"`.

Anota `host.name` del nodo donde corre el stack (en Codespaces suele ser el hostname del contenedor). Lo usarás para alinear logs y métricas en el paso 4.

---

### Paso 2 — Lens CPU

- Data view: `metricbeat-*`
- Métrica: **Average** de `docker.cpu.total.pct` (0–1 o 0–100 según versión; comprueba un documento en Discover)
- Breakdown: `container.name` · Últimos 30 min.

**Caso de uso:** identificar qué contenedor (`lab-elasticsearch`, `lab-kibana`, etc.) consume CPU cuando el host va al límite.

---

### Paso 3 — Lens memoria

- Filtro implícito: `metricset.name : "memory"` (o selecciona campo de memoria en el panel).
- Average `docker.memory.usage.pct` (o equivalente visible en tu doc).

Combina ambos en dashboard `lab-m05-host-metrics`.

**Producción:** aquí miras contenedores del lab; en prod agruparías por `kubernetes.pod.name` o `container.name` con labels de equipo/ servicio.

---

### Paso 4 — Correlación manual

Abre en otra pestaña el dashboard **M05-02**. Iguala time picker (misma ventana de 30 min) y desplázate al mismo tramo temporal.

| Observación | Interpretación posible | Siguiente paso |
|-------------|------------------------|----------------|
| CPU alta + 500 en logs | Presión de recursos | `docker stats`, revisar heap ES |
| CPU baja + 500 | Fallo lógico / dependencia externa | traces, logs de app |
| CPU alta + sin 500 | Trabajo batch, GC, reindex | normal si es transitorio |

KQL cruzado (mismo host):

```text
host.name : "<tu-host>" and event.module : "docker"
```

Documenta en una frase qué viste — aunque sea «no correlacionan en este lab».

---

### Paso 5 — Añadir enlace entre dashboards

En el dashboard de logs, edita un panel → **Panel settings** → descripción o **Markdown** con enlace al dashboard de métricas y el `host.name`.

En operaciones reales los runbooks enlazan dashboards, Grafana y runbooks de escalado — reduce fricción a las 3 AM.

---

## Validación

- [ ] Dashboard métricas guardado.
- [ ] Filtro `event.module : "docker"` devuelve datos.
- [ ] Documentaste un intento de correlación tiempo + host (aunque no haya causalidad).

---

## Antes de seguir

Métricas + logs en un solo dashboard es madurez intermedia. M10 añade **stack monitoring** (salud del propio Elasticsearch) — otra capa cuando el problema no es la app sino la plataforma.
