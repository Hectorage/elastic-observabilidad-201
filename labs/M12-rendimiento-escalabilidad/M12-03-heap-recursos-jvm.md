# Laboratorio M12-03 — Heap JVM y thread pools

[▲ Módulo M12](README.md) · [← Anterior](M12-02-bulk-indexing-carga.md) · [Siguiente →](M12-04-checklist-sizing.md)

> ⏱️ ~35 min

**Objetivo:** leer **thread pool** rechazos y límites JVM del nodo lab.

---

### Paso 1 — Thread pools

```bash
curl -fsS 'http://localhost:9200/_nodes/stats/thread_pool?pretty' | grep -E '"name"|"rejected"|"completed"' | head -40
```

---

### Paso 2 — Circuit breakers

```bash
curl -fsS 'http://localhost:9200/_nodes/stats/breaker?pretty' | head -35
```

---

### Paso 3 — ES_JAVA_OPTS

Revisa `infra/.env` → `ES_JAVA_OPTS=-Xms768m -Xmx768m`.

Regla práctica: **50 % RAM del contenedor** a heap ES; el resto para OS y filesystem cache.

---

### Paso 4 — Simular presión (opcional)

Lanza dos bulks en paralelo (solo si RAM > 8 GB) o documenta por qué no en Codespaces.

---

## Validación

- [ ] `rejected` en pools revisado (idealmente 0).
- [ ] Regla 50 % heap explicada con tus números de Codespace.

---

## Antes de seguir

Escalar horizontalmente añade nodos; tuning JVM tiene techo en un solo nodo.
