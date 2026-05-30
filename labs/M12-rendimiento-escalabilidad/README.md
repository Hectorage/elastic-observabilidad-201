# M12 — Buenas prácticas de rendimiento y escalabilidad

[← Página anterior](../M11-integraciones-externas/M11-04-patron-kubernetes.md) · [Siguiente →](M12-01-latencia-busqueda.md)

> ⏱️ ~2 h · Cierre del curso

## Qué aprenderás

- Medir latencia de búsqueda (`profile`, wildcard vs `term`).
- Carga con `_bulk` y efecto en heap JVM.
- Thread pools, circuit breakers y regla 50 % heap.
- Checklist de **sizing** y runbook personal.

## Contexto

- M12 no añade servicios — aplica herramientas de M01–M11 a decisiones de capacidad.
- Mediciones son en lab pequeño; interpreta **tendencias**, no números absolutos para prod.

## Tabla de ejercicios

| ID | Guion | Objetivo |
|----|-------|----------|
| M12-01 | [Latencia búsqueda](M12-01-latencia-busqueda.md) | Profile + tipos de query |
| M12-02 | [Bulk indexing](M12-02-bulk-indexing-carga.md) | Throughput y heap |
| M12-03 | [Heap y recursos](M12-03-heap-recursos-jvm.md) | JVM, pools, breakers |
| M12-04 | [Checklist sizing](M12-04-checklist-sizing.md) | Cierre curso + runbook |

## Antes de seguir (cierre M12)

- [ ] Tres tiempos de query anotados (M12-01).
- [ ] Checklist sizing con columna «prod derivada».
- [ ] Recorrido oral M01–M12 completado.
