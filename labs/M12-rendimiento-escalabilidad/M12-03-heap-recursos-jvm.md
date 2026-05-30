# Laboratorio M12-03 — Heap JVM y thread pools

[▲ Módulo M12](README.md) · [← Anterior](M12-02-bulk-indexing-carga.md) · [Siguiente →](M12-04-checklist-sizing.md)

> ⏱️ ~35 min

**Objetivo:** leer **thread pool** rechazos y límites JVM del nodo lab.

> **Regla de oro:** Elasticsearch es JVM — heap mal dimensionado causa GC pauses (Kibana lenta) u OOM (nodo caído). Thread pool rejections indican saturación antes del crash.

---

### Paso 1 — Thread pools

```bash
curl -fsS 'http://localhost:9200/_nodes/stats/thread_pool?pretty' | grep -E '"name"|"rejected"|"completed"' | head -40
```

Pools críticos:

| Pool | Si `rejected` > 0 |
|------|-------------------|
| `write` | Indexación/bulk saturada — M12-02 |
| `search` | Demasiadas queries concurrentes — M12-01 |
| `management` | Tareas cluster acumuladas |

En lab idealmente **0 rejected** — anota valores tras bulk M12-02 si lo hiciste antes.

---

### Paso 2 — Circuit breakers

```bash
curl -fsS 'http://localhost:9200/_nodes/stats/breaker?pretty' | head -35
```

Breakers abortan queries que pedirían demasiada memoria (aggs enormes, wildcard global). Mejor rechazar query que tumbar nodo.

---

### Paso 3 — ES_JAVA_OPTS y regla 50 %

Revisa `infra/.env` → `ES_JAVA_OPTS=-Xms768m -Xmx768m`.

| Recurso | Regla práctica |
|---------|----------------|
| Heap ES | ~50 % RAM del contenedor |
| Resto RAM | OS page cache (lectura de índices en disco) |
| Codespace típico | Anota RAM total y si 768m es razonable |

**Error común:** `-Xmx` = 90 % RAM → sin cache, rendimiento de lectura pobre.

Completa: «Mi Codespace tiene ___ GB RAM; heap 768m es ___ (OK/ajustar)».

---

### Paso 4 — Simular presión (opcional)

Lanza dos bulks M12-02 en paralelo **solo si RAM > 8 GB**; en Codespaces 4 GB documenta «no ejecutado por riesgo OOM» — también es respuesta válida de operador prudente.

---

## Validación

- [ ] `rejected` revisado en pools (idealmente 0).
- [ ] Regla 50 % heap explicada con tus números.
- [ ] Sabes qué métrica mirarías primero si Kibana timeout.

---

## Antes de seguir

Escalar horizontalmente añade nodos; tuning JVM tiene techo en un solo nodo — M12-04 cierra con checklist de sizing holístico.
